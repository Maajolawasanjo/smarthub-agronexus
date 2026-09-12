import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const body = await req.json().catch(() => ({}));
    const { items, orderId, totalAmount } = body;

    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Flutterwave secret key is not configured on the server." },
        { status: 500 }
      );
    }

    // Recalculate price total on the server — never trust client-provided totalAmount
    let serverVerifiedTotal = 0;
    let validatedOrderId = orderId || null;

    if (orderId) {
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
      });
      if (!existingOrder) {
        return NextResponse.json(
          { error: "Order not found for payment initialization." },
          { status: 404 }
        );
      }
      serverVerifiedTotal = Number(existingOrder.totalAmount);
    } else if (Array.isArray(items) && items.length > 0) {
      const productIds = items.map((i: any) => i.productId || i.id).filter(Boolean);
      const dbProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { inventory: true },
      });

      let subtotal = 0;
      for (const item of items) {
        const pid = item.productId || item.id;
        const dbProduct = dbProducts.find((p) => p.id === pid);
        if (!dbProduct) {
          return NextResponse.json(
            { error: `Produce listing ${pid} was not found in catalog.` },
            { status: 404 }
          );
        }
        if (!dbProduct.isAvailable) {
          return NextResponse.json(
            { error: `Produce '${dbProduct.name}' is currently unavailable.` },
            { status: 400 }
          );
        }
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        subtotal += Number(dbProduct.price) * qty;
      }
      const shippingFee = 400; // Flat standard platform shipping
      serverVerifiedTotal = subtotal + shippingFee;
    } else {
      return NextResponse.json(
        { error: "Valid items or orderId are required to initialize payment." },
        { status: 400 }
      );
    }

    // Enforce serverVerifiedTotal > 0
    if (serverVerifiedTotal <= 0) {
      return NextResponse.json(
        { error: "Calculated checkout total must be greater than zero." },
        { status: 400 }
      );
    }

    // Determine customer email and name
    let customerEmail = "customer@smarthub.farm";
    let customerName = "AgroChain Customer";

    if (session?.userId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { email: true, fullName: true },
      });
      if (dbUser) {
        customerEmail = dbUser.email || customerEmail;
        customerName = dbUser.fullName || customerName;
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const txRef = `AGRO-FLW-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const flwPayload = {
      tx_ref: txRef,
      amount: serverVerifiedTotal,
      currency: "NGN",
      redirect_url: `${appUrl}/api/payments/flutterwave/verify`,
      customer: {
        email: customerEmail,
        name: customerName,
      },
      meta: {
        userId: session?.userId || "guest",
        orderId: validatedOrderId,
        itemsCount: Array.isArray(items) ? items.length : 0,
        serverVerifiedTotal,
      },
      customizations: {
        title: "SmartHub AgroChain Payment",
        description: "Agro Produce Order Checkout",
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
      return NextResponse.json({
        status: "success",
        link: flwData.data.link,
        tx_ref: txRef,
      });
    }

    console.error("[FLUTTERWAVE_INITIALIZE_ERROR]", flwData);
    return NextResponse.json(
      {
        error: flwData.message || "Failed to initialize Flutterwave payment session.",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[FLUTTERWAVE_INITIALIZE_EXCEP]", error);
    return NextResponse.json(
      { error: "Internal server error initializing Flutterwave payment." },
      { status: 500 }
    );
  }
}
