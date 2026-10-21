import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isTrustedMutationOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";

const MIN_WALLET_FUNDING_NGN = 100;
const MAX_PAYMENT_NGN = 99_999_999.99;

export async function POST(req: Request) {
  let walletIntentRef: string | null = null;

  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!isTrustedMutationOrigin(req)) {
      return NextResponse.json({ error: "Untrusted mutation origin." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Flutterwave is not configured. No payment intent was created." },
        { status: 503 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const txRef = `AGRO-FLW-${randomUUID()}`;
    let amount = 0;
    let customerEmail = "";
    let customerName = "";
    let meta: Record<string, string> = {};

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true, fullName: true, isActive: true },
    });
    if (!user || !user.isActive) {
      return NextResponse.json({ error: "An active account is required to initialize payment." }, { status: 403 });
    }

    customerEmail = user.email;
    customerName = user.fullName;

    if (body.purpose === "WALLET_FUNDING") {
      if (session.role !== "BUYER" && session.role !== "FARMER") {
        return NextResponse.json({ error: "This account cannot fund a wallet." }, { status: 403 });
      }

      const requestedAmount = Number(body.totalAmount);
      if (
        !Number.isFinite(requestedAmount) ||
        requestedAmount < MIN_WALLET_FUNDING_NGN ||
        requestedAmount > MAX_PAYMENT_NGN
      ) {
        return NextResponse.json(
          { error: `Wallet funding amount must be between ₦${MIN_WALLET_FUNDING_NGN} and ₦${MAX_PAYMENT_NGN}.` },
          { status: 400 }
        );
      }
      amount = Number(requestedAmount.toFixed(2));

      await prisma.$transaction(async (tx) => {
        let wallet = await tx.wallet.findUnique({ where: { userId: session.userId } });
        if (!wallet) {
          wallet = await tx.wallet.create({
            data: { userId: session.userId, balance: 0, escrow: 0 },
          });
        }

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "DEPOSIT",
            amount,
            reference: txRef,
            description: "Pending Flutterwave wallet funding intent",
            status: "PENDING",
          },
        });
      });

      walletIntentRef = txRef;
      meta = {
        userId: session.userId,
        purpose: "WALLET_FUNDING",
        walletTransactionRef: txRef,
      };
    } else if (typeof body.orderId === "string" && body.orderId.trim()) {
      if (session.role !== "BUYER") {
        return NextResponse.json({ error: "Only the order's buyer can initialize checkout." }, { status: 403 });
      }

      const order = await prisma.order.findUnique({
        where: { id: body.orderId.trim() },
        include: { buyer: true, payment: true },
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found." }, { status: 404 });
      }
      if (order.buyer.userId !== session.userId) {
        return NextResponse.json({ error: "You are not authorized to pay for this order." }, { status: 403 });
      }
      if (order.status !== "PENDING") {
        return NextResponse.json({ error: "Only pending orders can enter checkout." }, { status: 409 });
      }
      if (
        !order.payment ||
        order.payment.paymentMethod !== "CARD" ||
        order.payment.paymentStatus !== "PENDING"
      ) {
        return NextResponse.json(
          { error: "This order has no pending card payment." },
          { status: 409 }
        );
      }

      const orderAmount = Number(order.totalAmount);
      const paymentAmount = Number(order.payment.amount);
      if (
        !Number.isFinite(orderAmount) ||
        orderAmount <= 0 ||
        Math.abs(orderAmount - paymentAmount) > 0.01 ||
        orderAmount > MAX_PAYMENT_NGN
      ) {
        return NextResponse.json({ error: "Order payment amount is invalid or inconsistent." }, { status: 409 });
      }
      amount = Number(orderAmount.toFixed(2));

      // Bind the gateway transaction reference to the pending payment before exposing a checkout URL.
      // The webhook must match this exact reference; client-supplied order IDs are not enough.
      const paymentClaim = await prisma.payment.updateMany({
        where: {
          id: order.payment.id,
          orderId: order.id,
          paymentMethod: "CARD",
          paymentStatus: "PENDING",
        },
        data: { transactionRef: txRef },
      });
      if (paymentClaim.count !== 1) {
        return NextResponse.json(
          { error: "Payment state changed. Refresh the order and try again." },
          { status: 409 }
        );
      }

      meta = {
        userId: session.userId,
        purpose: "ORDER_PAYMENT",
        orderId: order.id,
        paymentId: order.payment.id,
      };
    } else {
      return NextResponse.json(
        { error: "Provide an owned pending orderId or use purpose WALLET_FUNDING." },
        { status: 400 }
      );
    }

    const flwPayload = {
      tx_ref: txRef,
      amount,
      currency: "NGN",
      redirect_url: `${appUrl}/api/payments/flutterwave/verify`,
      customer: { email: customerEmail, name: customerName },
      meta,
      customizations: {
        title: "SmartHub AgroChain Payment",
        description: meta.purpose === "WALLET_FUNDING" ? "Wallet funding" : "Agro produce order checkout",
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

    const flwData = await flwResponse.json().catch(() => ({}));
    if (flwResponse.ok && flwData.status === "success" && flwData.data?.link) {
      return NextResponse.json({ status: "success", link: flwData.data.link, tx_ref: txRef });
    }

    if (walletIntentRef) {
      await prisma.walletTransaction.updateMany({
        where: { reference: walletIntentRef, type: "DEPOSIT", status: "PENDING" },
        data: { status: "FAILED", description: "Flutterwave did not create a wallet funding checkout." },
      });
      walletIntentRef = null;
    }

    console.error("[FLUTTERWAVE_INITIALIZE_ERROR]", { status: flwResponse.status, message: flwData.message });
    return NextResponse.json(
      { error: flwData.message || "Failed to initialize Flutterwave checkout." },
      { status: 502 }
    );
  } catch (error: unknown) {
    if (walletIntentRef) {
      await prisma.walletTransaction.updateMany({
        where: { reference: walletIntentRef, type: "DEPOSIT", status: "PENDING" },
        data: { status: "FAILED", description: "Flutterwave checkout initialization failed." },
      }).catch(() => undefined);
    }
    console.error("[FLUTTERWAVE_INITIALIZE_EXCEPTION]", error);
    return NextResponse.json(
      { error: "Internal server error initializing Flutterwave payment." },
      { status: 500 }
    );
  }
}
