import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isTrustedMutationOrigin } from "@/lib/csrf";

// POST /api/payments/flutterwave/initialize
// A hosted checkout must be bound to a persisted, buyer-owned pending CARD order.
// Client-supplied item prices/totals are never payment intents.
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (session.role !== "BUYER") {
      return NextResponse.json({ error: "Only buyers can initialize checkout." }, { status: 403 });
    }
    if (!isTrustedMutationOrigin(req)) {
      return NextResponse.json({ error: "Untrusted mutation origin." }, { status: 403 });
    }

    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Flutterwave secret key is not configured on the server." },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
    if (!orderId) {
      return NextResponse.json(
        { error: "A persisted orderId is required. Create the order before initializing payment." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { buyer: true, payment: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.buyer.userId !== session.userId) {
      return NextResponse.json({ error: "You are not authorized to pay for this order." }, { status: 403 });
    }
    if (order.status !== "PENDING" || !order.payment ||
        order.payment.paymentMethod !== "CARD" || order.payment.paymentStatus !== "PENDING") {
      return NextResponse.json(
        { error: "Only unpaid, pending CARD orders can be initialized." },
        { status: 409 }
      );
    }

    const amount = Number(order.totalAmount);
    const paymentAmount = Number(order.payment.amount);
    if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) !== Math.round(paymentAmount * 100)) {
      return NextResponse.json(
        { error: "Order and payment amounts do not match. Checkout was not initialized." },
        { status: 409 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true, fullName: true },
    });
    if (!dbUser?.email) {
      return NextResponse.json({ error: "A valid buyer email is required for checkout." }, { status: 400 });
    }

    // Stable per-payment reference makes retries safe and binds the webhook to this exact Payment row.
    const txRef = order.payment.transactionRef?.startsWith("AGRO-FLW-")
      ? order.payment.transactionRef
      : `AGRO-FLW-${order.payment.id}`;

    await prisma.payment.update({
      where: { id: order.payment.id },
      data: { transactionRef: txRef },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const flwPayload = {
      tx_ref: txRef,
      amount: paymentAmount,
      currency: "NGN",
      redirect_url: `${appUrl}/api/payments/flutterwave/verify`,
      customer: { email: dbUser.email, name: dbUser.fullName || "AgroChain Customer" },
      meta: {
        userId: session.userId,
        orderId: order.id,
        paymentId: order.payment.id,
        serverVerifiedTotal: paymentAmount,
      },
      customizations: {
        title: "SmartHub AgroChain Payment",
        description: `Payment for Order #${order.orderNumber}`,
        logo: `${appUrl}/LOGO.jpg`,
      },
    };

    const flwResponse = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(flwPayload),
    });
    const flwData = await flwResponse.json();

    if (flwResponse.ok && flwData.status === "success" && flwData.data?.link) {
      return NextResponse.json({ status: "success", link: flwData.data.link, tx_ref: txRef });
    }

    console.error("[FLUTTERWAVE_INITIALIZE_ERROR]", flwData);
    return NextResponse.json(
      { error: flwData.message || "Failed to initialize Flutterwave payment session." },
      { status: 502 }
    );
  } catch (error) {
    console.error("[FLUTTERWAVE_INITIALIZE_EXCEP]", error);
    return NextResponse.json(
      { error: "Internal server error initializing Flutterwave payment." },
      { status: 500 }
    );
  }
}
