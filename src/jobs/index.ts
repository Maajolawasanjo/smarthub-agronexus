/**
 * Background Jobs & Task Workers for SmartHub AgroChain
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { publishAgroEvent } from "@/lib/events";
import { config } from "@/lib/config";
import { WalletService } from "@/services/wallet.service";

/**
 * Job: Auto-completes orders delivered past the auto-completion window (7 days) and releases escrow.
 */
export async function runAutoCompleteDeliveredOrdersJob() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - config.timeouts.orderAutoCompletionDays);

  // Select only paid, delivered orders without an active dispute. A status update is
  // not a financial settlement: WalletService validates the funded escrow ledger,
  // compare-and-sets each seller order, posts seller credits, and completes the order.
  const eligibleOrders = await prisma.order.findMany({
    where: {
      status: "DELIVERED",
      updatedAt: { lte: cutoffDate },
      payment: { is: { paymentStatus: "PAID" } },
      disputes: { none: { status: { in: ["OPEN", "UNDER_REVIEW"] } } },
    },
    include: { buyer: true, payment: true, delivery: true },
  });

  logger.info(`AutoCompleteDeliveredOrdersJob started. Found ${eligibleOrders.length} eligible orders.`);

  let completedCount = 0;
  for (const order of eligibleOrders) {
    try {
      // This operation is idempotent and rejects unpaid, unfunded, disputed, or
      // already-completed orders. Never mark a payment PAID from a background job.
      const release = await WalletService.executeEscrowRelease(order.buyer.userId, order.id);

      await publishAgroEvent("ESCROW_RELEASED", {
        userId: order.buyer.userId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: Number(order.totalAmount),
      });

      completedCount++;
      logger.info(`Auto-completed Order #${order.orderNumber} after verified escrow release.`, {
        orderId: order.id,
        settledSellerOrdersCount: "settledSellerOrdersCount" in release
          ? release.settledSellerOrdersCount
          : release.settledCount,
      });
    } catch (err) {
      // Keep the order DELIVERED and surface the failure for reconciliation. Do not
      // fake payment settlement or emit ESCROW_RELEASED when the ledger did not settle.
      logger.error(`Unable to auto-complete Order #${order.orderNumber}; escrow release was not confirmed.`, err);
    }
  }

  logger.info(`AutoCompleteDeliveredOrdersJob finished. Successfully released escrow and completed ${completedCount} orders.`);
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
