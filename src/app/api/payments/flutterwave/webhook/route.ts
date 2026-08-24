import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WalletService } from "@/services/wallet.service";
import { verifyWebhookSignature } from "@/lib/settlement";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("verif-hash");
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH || process.env.FLUTTERWAVE_SECRET_KEY;

    // 1. Cryptographic Signature Guard (PAY-001)
    if (!secretHash || !verifyWebhookSignature(rawBody, signature, secretHash)) {
      console.warn("[FLUTTERWAVE_WEBHOOK_UNAUTHORIZED] Signature mismatch or missing header.");
      return NextResponse.json(
        { error: "Unauthorized webhook signature match failure." },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    // ────────────────────────────────────────────────────────────────────────
    // A. CHARGE COMPLETED — Direct Product Order Checkout or Wallet Deposit (PAY-004)
    // ────────────────────────────────────────────────────────────────────────
    if (event === "charge.completed" && payload.data?.status === "successful") {
      const transactionId = payload.data.id;
      const txRef = payload.data.tx_ref;
      const amount = payload.data.amount;
      const userId = payload.data.meta?.userId;
      const orderId = payload.data.meta?.orderId;
      const paymentId = payload.data.meta?.paymentId;

      const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

      // 2. Server-Side Verification against Flutterwave v3 API (Never trust webhook payload alone)
      if (secretKey && transactionId) {
        const verifyRes = await fetch(
          `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${secretKey}`,
              "Content-Type": "application/json",
            },
          }
        );
        const verifyData = await verifyRes.json();

        if (
          !verifyRes.ok ||
          verifyData.status !== "success" ||
          verifyData.data?.status !== "successful"
        ) {
          console.error("[FLUTTERWAVE_WEBHOOK_VERIFY_FAILED]", verifyData);
          return NextResponse.json(
            { error: "Gateway verification check failed." },
            { status: 400 }
          );
        }
      }

      // 3. Idempotency Check — Prevent double-crediting on retried webhooks
      const existingTx = await prisma.walletTransaction.findUnique({
        where: { reference: txRef },
      });

      if (existingTx) {
        console.log(`[FLUTTERWAVE_WEBHOOK_IDEMPOTENT] ${txRef} already processed. Skipping.`);
        return NextResponse.json({ status: "already_processed" }, { status: 200 });
      }

      console.log(`[FLUTTERWAVE_CHARGE_SUCCESS] Ref: ${txRef}, Amount: ₦${amount}, User: ${userId}`);

      // 4. Match Order Checkout Payment vs Wallet Deposit
      const targetPayment = await prisma.payment.findFirst({
        where: {
          OR: [
            { transactionRef: txRef },
            ...(orderId ? [{ orderId }] : []),
            ...(paymentId ? [{ id: paymentId }] : []),
          ],
        },
      });

      if (targetPayment) {
        // Settle Order Payment & Escrow Lock (PAY-004)
        await WalletService.settleOrderPaymentFromGateway(targetPayment.id, txRef, Number(amount));
      } else if (userId && userId !== "guest") {
        // General Wallet Funding Deposit
        await WalletService.executeDeposit(userId, Number(amount), txRef);
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // B. TRANSFER COMPLETED — Farmer bank withdrawal confirmation or failure
    // ────────────────────────────────────────────────────────────────────────
    else if (event === "transfer.completed") {
      const txRef = payload.data?.reference;
      const transferStatus = payload.data?.status; // "SUCCESSFUL" | "FAILED"

      if (!txRef) {
        console.warn("[FLUTTERWAVE_TRANSFER_WEBHOOK_NO_REF] Transfer webhook missing reference.");
        return NextResponse.json({ status: "ignored" }, { status: 200 });
      }

      const isSuccessful = transferStatus === "SUCCESSFUL";
      const failureReason = payload.data?.complete_message || payload.data?.message;

      console.log(`[FLUTTERWAVE_TRANSFER_WEBHOOK] Ref: ${txRef}, Status: ${transferStatus}`);

      await WalletService.handleTransferWebhook(txRef, isSuccessful, failureReason);
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    console.error("[FLUTTERWAVE_WEBHOOK_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error processing webhook." },
      { status: 500 }
    );
  }
}
