import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WalletService } from "@/services/wallet.service";
import { verifyWebhookSignature } from "@/lib/settlement";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("verif-hash");
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;

    // Gateway callbacks are authenticated by the configured Flutterwave webhook hash.
    // Never fall back to the API secret key or process financial events without a secret.
    if (!secretHash || !verifyWebhookSignature(rawBody, signature, secretHash)) {
      console.warn("[FLUTTERWAVE_WEBHOOK_UNAUTHORIZED] Missing or invalid webhook hash.");
      return NextResponse.json({ error: "Unauthorized webhook signature." }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    if (event === "charge.completed" && payload.data?.status === "successful") {
      const transactionId = payload.data.id;
      const txRef = payload.data.tx_ref;
      const payloadAmount = Number(payload.data.amount);
      const meta = payload.data.meta || {};
      const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

      if (!secretKey || !transactionId || typeof txRef !== "string" || !txRef.trim()) {
        return NextResponse.json(
          { error: "Gateway verification configuration or transaction reference is missing." },
          { status: 503 }
        );
      }
      if (!Number.isFinite(payloadAmount) || payloadAmount <= 0) {
        return NextResponse.json({ error: "Invalid gateway amount." }, { status: 400 });
      }

      // Verify the transaction with Flutterwave itself; signed webhook data alone is not enough.
      const verifyRes = await fetch(
        `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(String(transactionId))}/verify`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );
      const verifyData = await verifyRes.json().catch(() => ({}));
      const verified = verifyData.data;
      const verifiedAmount = Number(verified?.amount);

      if (
        !verifyRes.ok ||
        verifyData.status !== "success" ||
        verified?.status !== "successful" ||
        String(verified?.id) !== String(transactionId) ||
        verified?.tx_ref !== txRef ||
        String(verified?.currency || "").toUpperCase() !== "NGN" ||
        !Number.isFinite(verifiedAmount) ||
        verifiedAmount <= 0 ||
        Math.abs(verifiedAmount - payloadAmount) > 0.01
      ) {
        console.error("[FLUTTERWAVE_WEBHOOK_VERIFY_FAILED]", {
          transactionId: String(transactionId),
          txRef,
          gatewayStatus: verified?.status,
          currency: verified?.currency,
        });
        return NextResponse.json(
          { error: "Verified gateway transaction does not match the webhook." },
          { status: 400 }
        );
      }

      // Order payments must match the exact pending Payment.transactionRef. Never use
      // metadata orderId/paymentId as a fallback to select an unrelated payment.
      const targetPayment = await prisma.payment.findUnique({
        where: { transactionRef: txRef },
        include: { order: true },
      });

      if (targetPayment) {
        if (
          (meta.orderId && meta.orderId !== targetPayment.orderId) ||
          (meta.paymentId && meta.paymentId !== targetPayment.id) ||
          (meta.purpose && meta.purpose !== "ORDER_PAYMENT")
        ) {
          return NextResponse.json({ error: "Payment intent metadata mismatch." }, { status: 400 });
        }

        await WalletService.settleOrderPaymentFromGateway(
          targetPayment.id,
          txRef,
          verifiedAmount,
          String(verified.id)
        );
      } else if (
        meta.purpose === "WALLET_FUNDING" &&
        meta.walletTransactionRef === txRef &&
        typeof meta.userId === "string" &&
        meta.userId.length > 0
      ) {
        await WalletService.settleGatewayWalletDeposit(txRef, verifiedAmount, meta.userId);
      } else {
        // A successful gateway transaction without a persisted, matching intent is not
        // allowed to become an arbitrary wallet deposit.
        console.error("[FLUTTERWAVE_WEBHOOK_INTENT_NOT_FOUND]", { txRef });
        return NextResponse.json({ error: "No matching pending payment intent." }, { status: 404 });
      }
    } else if (event === "transfer.completed") {
      // Flutterwave transfer callbacks are still signature-checked above. They affect only
      // an existing withdrawal whose reference and state are validated by the wallet service.
      const txRef = payload.data?.reference;
      const transferStatus = payload.data?.status;

      if (!txRef || typeof txRef !== "string") {
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
    return NextResponse.json(
      { error: "Unable to process the verified gateway callback." },
      { status: 500 }
    );
  }
}
