import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WalletService } from "@/services/wallet.service";
import { verifyWebhookSignature } from "@/lib/settlement";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("verif-hash");
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH || process.env.FLUTTERWAVE_SECRET_KEY;

    if (!secretHash || !verifyWebhookSignature(rawBody, signature, secretHash)) {
      console.warn("[FLUTTERWAVE_WEBHOOK_UNAUTHORIZED] Signature mismatch or missing header.");
      return NextResponse.json({ error: "Unauthorized webhook signature." }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    if (event === "charge.completed" && payload.data?.status === "successful") {
      const transactionId = payload.data.id;
      const txRef = payload.data.tx_ref;
      const orderId = payload.data.meta?.orderId;
      const paymentId = payload.data.meta?.paymentId;
      const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

      // Never settle money based on a signed notification alone. Verify against the gateway,
      // and fail closed when verification cannot be performed.
      if (!secretKey || !transactionId || !txRef) {
        return NextResponse.json({ error: "Gateway verification is not configured or transaction data is incomplete." }, { status: 503 });
      }

      const verifyRes = await fetch(
        `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(String(transactionId))}/verify`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
        }
      );
      const verifyData = await verifyRes.json();
      const verified = verifyData?.data;
      if (
        !verifyRes.ok ||
        verifyData.status !== "success" ||
        verified?.status !== "successful" ||
        verified?.tx_ref !== txRef ||
        String(verified?.currency || "").toUpperCase() !== "NGN" ||
        !Number.isFinite(Number(verified?.amount)) ||
        Math.round(Number(verified.amount) * 100) !== Math.round(Number(payload.data.amount) * 100)
      ) {
        console.error("[FLUTTERWAVE_WEBHOOK_VERIFY_FAILED]", { transactionId, txRef, status: verifyData?.status });
        return NextResponse.json({ error: "Gateway verification or transaction binding failed." }, { status: 400 });
      }

      // Every charge must map to a persisted payment intent. Do not turn an unmatched checkout
      // into an arbitrary wallet deposit based on userId metadata.
      const targetPayment = await prisma.payment.findUnique({
        where: { transactionRef: txRef },
      });
      if (!targetPayment) {
        console.warn("[FLUTTERWAVE_WEBHOOK_UNBOUND_PAYMENT]", { txRef, orderId, paymentId });
        return NextResponse.json({ error: "No matching pending payment intent." }, { status: 404 });
      }
      if (
        (orderId && targetPayment.orderId !== orderId) ||
        (paymentId && targetPayment.id !== paymentId) ||
        Math.round(Number(targetPayment.amount) * 100) !== Math.round(Number(verified.amount) * 100) ||
        targetPayment.paymentMethod !== "CARD"
      ) {
        console.warn("[FLUTTERWAVE_WEBHOOK_PAYMENT_MISMATCH]", { txRef, orderId, paymentId, paymentRecordId: targetPayment.id });
        return NextResponse.json({ error: "Gateway transaction does not match the stored payment intent." }, { status: 400 });
      }

      // Idempotency: the settlement service and transaction reference provide the authoritative
      // state guard. This read is only a fast path, not the concurrency control.
      if (targetPayment.paymentStatus === "PAID") {
        return NextResponse.json({ status: "already_processed" }, { status: 200 });
      }
      if (targetPayment.paymentStatus !== "PENDING") {
        console.warn("[FLUTTERWAVE_WEBHOOK_PAYMENT_NOT_PENDING]", { txRef, paymentStatus: targetPayment.paymentStatus });
        return NextResponse.json({ error: "Payment intent is no longer pending; manual review is required." }, { status: 409 });
      }

      await WalletService.settleOrderPaymentFromGateway(targetPayment.id, txRef, Number(verified.amount));
    } else if (event === "transfer.completed") {
      const txRef = payload.data?.reference;
      const transferStatus = payload.data?.status;

      if (!txRef) {
        console.warn("[FLUTTERWAVE_TRANSFER_WEBHOOK_NO_REF] Transfer webhook missing reference.");
        return NextResponse.json({ status: "ignored" }, { status: 200 });
      }

      await WalletService.handleTransferWebhook(
        txRef,
        transferStatus === "SUCCESSFUL",
        payload.data?.complete_message || payload.data?.message
      );
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    console.error("[FLUTTERWAVE_WEBHOOK_ERROR]", error);
    return NextResponse.json({ error: "Internal server error processing webhook." }, { status: 500 });
  }
}
