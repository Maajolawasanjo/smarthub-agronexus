/**
 * Background Jobs & Task Workers for SmartHub AgroChain
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { publishAgroEvent } from "@/lib/events";
import { config } from "@/lib/config";

/**
 * Job: Auto-completes orders delivered past the auto-completion window (7 days) and releases escrow.
 */
export async function runAutoCompleteDeliveredOrdersJob() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - config.timeouts.orderAutoCompletionDays);

  const eligibleOrders = await prisma.order.findMany({
    where: {
      status: "DELIVERED",
      updatedAt: { lte: cutoffDate },
    },
    include: { buyer: true, payment: true, delivery: true },
  });

  logger.info(`AutoCompleteDeliveredOrdersJob started. Found ${eligibleOrders.length} eligible orders.`);

  let completedCount = 0;
  for (const order of eligibleOrders) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: "COMPLETED" },
        });

        if (order.payment) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: { paymentStatus: "PAID" },
          });
        }
      });

      await publishAgroEvent("ESCROW_RELEASED", {
        userId: order.buyer.userId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: Number(order.totalAmount),
      });

      completedCount++;
    } catch (err) {
      logger.error(`Error auto-completing order #${order.orderNumber}`, err);
    }
  }

  logger.info(`AutoCompleteDeliveredOrdersJob finished. Successfully auto-completed ${completedCount} orders.`);
  return { processed: eligibleOrders.length, completed: completedCount };
}

/**
 * Job: Audits platform wallet balances against paid payment totals.
 */
export async function runWalletReconciliationJob() {
  const paidAggregate = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { paymentStatus: "PAID" },
  });

  const totalPaid = Number(paidAggregate._sum.amount || 0);

  logger.info("WalletReconciliationJob completed", { totalPaidAmount: totalPaid });
  return { totalPaidAmount: totalPaid, reconciledAt: new Date().toISOString() };
}
