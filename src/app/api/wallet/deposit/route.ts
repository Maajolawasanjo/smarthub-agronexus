import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, email, currency = "NGN" } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "A valid deposit amount is required." },
        { status: 400 }
      );
    }

    const reference = `WAL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // In production: call Paystack API `https://api.paystack.co/transaction/initialize` or Stripe Checkout Session
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

    if (paystackSecretKey) {
      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(parseFloat(amount) * 100), // Kobo / cents conversion
          email: email || "buyer@smarthubagro.com",
          currency,
          reference,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/wallet?status=success`,
        }),
      });

      const data = await response.json();
      if (data.status) {
        return NextResponse.json({
          authorizationUrl: data.data.authorization_url,
          accessCode: data.data.access_code,
          reference,
        });
      }
    }

    // Fallback simulation URL for development
    return NextResponse.json({
      authorizationUrl: `/dashboard/wallet?deposit_success=true&ref=${reference}&amount=${amount}`,
      reference,
      simulated: true,
    });
  } catch (error: any) {
    console.error("Error initializing wallet deposit API:", error);
    return NextResponse.json(
      { error: "Internal server error initializing payment deposit." },
      { status: 500 }
    );
  }
}
