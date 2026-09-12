import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Legacy Paystack webhook route is permanently decommissioned in favor of Flutterwave v3.
  // All gateway webhooks must be routed to /api/payments/flutterwave/webhook
  return NextResponse.json(
    {
      error: "This webhook endpoint has been decommissioned. Please direct all payment webhooks to /api/payments/flutterwave/webhook",
      deprecated: true,
      activeWebhookEndpoint: "/api/payments/flutterwave/webhook",
    },
    { status: 410 }
  );
}

