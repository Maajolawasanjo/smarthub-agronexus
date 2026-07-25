import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { publishAgroEvent } from "@/lib/events";
import { calculateSettlement, generateReceipt, verifyWebhookSignature } from "@/lib/settlement";
import { SettlementDTO } from "@/dto";

export async function getSettlementDTO(orderId: string): Promise<SettlementDTO | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: { include: { user: true } },
      payment: true,
    },
  });

  if (!order || !order.payment) return null;

  const grossAmount = Number(order.totalAmount);
  const breakdown = calculateSettlement(grossAmount);
  const transactionRef = order.payment.transactionRef || `TX-${order.id.slice(0, 8)}`;
  const receipt = generateReceipt(order.orderNumber, transactionRef, order.payment.paymentMethod, grossAmount);

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    transactionRef,
    paymentMethod: order.payment.paymentMethod,
    paymentStatus: order.payment.paymentStatus,
    breakdown,
    escrow: {
      status: order.status === "COMPLETED" ? "RELEASED" : order.payment.paymentStatus === "REFUNDED" ? "REFUNDED" : "HELD",
      lockedAmount: grossAmount,
      releaseEligible: order.status === "DELIVERED",
    },
    receipt,
    audit: {
      createdAt: order.payment.createdAt.toISOString(),
      paidAt: order.payment.paidAt ? order.payment.paidAt.toISOString() : null,
      idempotencyKey: transactionRef,
    },
  };
}

export async function processWebhookPaymentEvent(
  rawBody: string,
  signature: string | null,
  event: { eventType: string; transactionRef: string; amount: number; orderId: string }
) {
  // 1. Webhook Signature Validation
  if (process.env.NODE_ENV === "production" && !verifyWebhookSignature(rawBody, signature, process.env.PAYMENT_WEBHOOK_SECRET || "")) {
    logger.security("Invalid payment webhook signature attempted", { signature });
    throw new Error("Invalid payment gateway signature.");
  }

  // 2. Idempotency Check: Prevent duplicate payment processing
  const existingPayment = await prisma.payment.findUnique({
    where: { transactionRef: event.transactionRef },
    include: { order: true },
  });

  if (existingPayment && existingPayment.paymentStatus === "PAID") {
    logger.info("Idempotent webhook payload ignored — payment already settled", {
      transactionRef: event.transactionRef,
      orderId: event.orderId,
    });
    return { status: "IDEMPOTENT_IGNORED", message: "Transaction already processed." };
  }

  // 3. Process Transactional Settlement
  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.upsert({
      where: { orderId: event.orderId },
      create: {
        orderId: event.orderId,
        amount: event.amount,
        paymentMethod: "CARD",
        paymentStatus: "PAID",
        transactionRef: event.transactionRef,
        paidAt: new Date(),
      },
      update: {
        paymentStatus: "PAID",
        transactionRef: event.transactionRef,
        paidAt: new Date(),
      },
    });

    const order = await tx.order.update({
      where: { id: event.orderId },
      data: { status: "CONFIRMED" },
      include: { buyer: true },
    });

    return { payment, order };
  });

  logger.security("Payment settlement completed via webhook", {
    orderId: event.orderId,
    transactionRef: event.transactionRef,
    amount: event.amount,
  });

  await publishAgroEvent("PAYMENT_COMPLETED", {
    userId: result.order.buyer.userId,
    orderId: event.orderId,
    orderNumber: result.order.orderNumber,
    amount: event.amount,
  });

  return { status: "SUCCESS", payment: result.payment };
}

export async function executeRefund(orderId: string, reason: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true, buyer: true },
  });

  if (!order || !order.payment) {
    throw new Error("Payment record not found for refund.");
  }

  if (order.payment.paymentStatus === "REFUNDED") {
    throw new Error("Order payment has already been refunded.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: order.payment!.id },
      data: { paymentStatus: "REFUNDED" },
    });

    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });

    return { updatedPayment, updatedOrder };
  });

  logger.security("Order payment refunded", {
    orderId,
    reason,
    amount: Number(order.payment.amount),
  });

  await publishAgroEvent("REFUND_EXECUTED", {
    userId: order.buyer.userId,
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: Number(order.payment.amount),
    remarks: reason,
  });

  return result;
}
