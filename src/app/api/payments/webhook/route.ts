import { NextResponse } from "next/server";
import { processWebhookPaymentEvent } from "@/services/payment.service";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature") || req.headers.get("x-webhook-signature");
    const payload = JSON.parse(rawBody);

    const eventType = payload.event || "charge.success";
    const transactionRef = payload.data?.reference || payload.reference || `TX-${Date.now()}`;
    const amount = (payload.data?.amount ? payload.data.amount / 100 : payload.amount) || 1000;
    const orderId = payload.data?.metadata?.orderId || payload.orderId;

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId in webhook metadata." }, { status: 400 });
    }

    const result = await processWebhookPaymentEvent(rawBody, signature, {
      eventType,
      transactionRef,
      amount,
      orderId,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Error processing payment webhook controller:", error);
    return NextResponse.json({ error: error.message || "Webhook processing failed." }, { status: 400 });
  }
}
