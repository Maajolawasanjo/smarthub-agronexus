import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const body = await req.json().catch(() => ({}));
    const { items, totalAmount } = body;

    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Flutterwave secret key is not configured on the server." },
        { status: 500 }
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
      amount: totalAmount || 100,
      currency: "NGN",
      redirect_url: `${appUrl}/api/payments/flutterwave/verify`,
      customer: {
        email: customerEmail,
        name: customerName,
      },
      meta: {
        userId: session?.userId || "guest",
        itemsCount: items?.length || 0,
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
