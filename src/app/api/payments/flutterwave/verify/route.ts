import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function redirectToCart(appUrl: string, payment: string, reason?: string, ref?: string, amount?: number) {
  const url = new URL("/cart", appUrl);
  url.searchParams.set("payment", payment);
  if (reason) url.searchParams.set("reason", reason);
  if (ref) url.searchParams.set("ref", ref);
  if (amount !== undefined) url.searchParams.set("amount", String(amount));
  return NextResponse.redirect(url);
}

export async function GET(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get("transaction_id") || "";
    const txRef = searchParams.get("tx_ref") || "";
    const status = searchParams.get("status");

    if (status === "cancelled") {
      return redirectToCart(appUrl, "cancelled");
    }

    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secretKey || !/^\d+$/.test(transactionId) || !txRef.trim()) {
      return redirectToCart(appUrl, "failed", "invalid_params");
    }

    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`,
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
    const paidAmount = Number(verified?.amount);

    if (
      !verifyRes.ok ||
      verifyData.status !== "success" ||
      verified?.status !== "successful" ||
      String(verified?.id) !== transactionId ||
      verified?.tx_ref !== txRef ||
      String(verified?.currency || "").toUpperCase() !== "NGN" ||
      !Number.isFinite(paidAmount) ||
      paidAmount <= 0
    ) {
      return redirectToCart(appUrl, "failed", "verification_failed");
    }

    // The redirect is not settlement proof. Show success only after the signed webhook
    // has settled the exact persisted intent; otherwise tell the buyer it is processing.
    const payment = await prisma.payment.findUnique({
      where: { transactionRef: txRef },
      include: { order: true },
    });

    if (payment) {
      if (
        Math.abs(Number(payment.amount) - paidAmount) > 0.01 ||
        Math.abs(Number(payment.order.totalAmount) - paidAmount) > 0.01
      ) {
        return redirectToCart(appUrl, "failed", "amount_mismatch", txRef);
      }
      if (
        payment.paymentStatus === "PAID" &&
        payment.gatewayTransactionId === transactionId
      ) {
        return redirectToCart(appUrl, "success", undefined, txRef, paidAmount);
      }
      if (payment.paymentStatus === "PENDING" && payment.transactionRef === txRef) {
        return redirectToCart(appUrl, "processing", undefined, txRef, paidAmount);
      }
      return redirectToCart(appUrl, "failed", "intent_not_settled", txRef);
    }

    const walletIntent = await prisma.walletTransaction.findUnique({
      where: { reference: txRef },
      include: { wallet: true },
    });
    if (
      !walletIntent ||
      walletIntent.type !== "DEPOSIT" ||
      Math.abs(Number(walletIntent.amount) - paidAmount) > 0.01
    ) {
      return redirectToCart(appUrl, "failed", "intent_not_found", txRef);
    }
    if (walletIntent.status === "SUCCESS") {
      return redirectToCart(appUrl, "success", undefined, txRef, paidAmount);
    }
    if (walletIntent.status === "PENDING") {
      return redirectToCart(appUrl, "processing", undefined, txRef, paidAmount);
    }
    return redirectToCart(appUrl, "failed", "intent_not_settled", txRef);
  } catch (error) {
    console.error("[FLUTTERWAVE_VERIFY_ERROR]", error);
    return redirectToCart(appUrl, "error");
  }
}
