import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY || "demo_secret_key";
    const bodyText = await req.text();

    // Verify Paystack HMAC Signature
    const signature = req.headers.get("x-paystack-signature");
    if (signature && process.env.NODE_ENV === "production") {
      const hash = crypto
        .createHmac("sha512", secret)
        .update(bodyText)
        .digest("hex");

      if (hash !== signature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    const event = JSON.parse(bodyText);

    // Handle charge success
    if (event.event === "charge.success") {
      const { reference, amount, customer } = event.data;

      // Find matching payment record by transaction reference
      const payment = await prisma.payment.findFirst({
        where: { transactionRef: reference },
      });

      if (payment) {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: { status: "COMPLETED" },
          }),
          prisma.order.update({
            where: { id: payment.orderId },
            data: { status: "PROCESSING" },
          }),
        ]);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error handling payment webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 }
    );
  }
}
