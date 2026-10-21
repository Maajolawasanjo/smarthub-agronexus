import { isTrustedMutationOrigin } from "@/lib/csrf";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { WalletService } from "@/services/wallet.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// POST /api/orders/[id]/cancel — Cancel order and refund escrow funds to buyer wallet
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const traceCtx = createTraceContext(req);
  try {
    const session = await getSession();
    if (!session?.userId) {
      const res = NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "Authentication required to cancel order."),
        { status: 401 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    if (!isTrustedMutationOrigin(req)) {
      return NextResponse.json({ error: "Untrusted mutation origin." }, { status: 403 });
    }

    const { id: orderId } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: true,
        orderItems: { include: { product: true } },
        payment: true,
      },
    });

    if (!order) {
      const res = NextResponse.json(
        createErrorResponse("NOT_FOUND", "Order not found."),
        { status: 404 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    // Verify buyer owns this order or user is admin
    if (order.buyer.userId !== session.userId && session.role !== "ADMIN") {
      const res = NextResponse.json(
        createErrorResponse("FORBIDDEN", "You are not authorized to cancel this order."),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    // Can only cancel orders in PENDING or CONFIRMED state
    if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
      const res = NextResponse.json(
        createErrorResponse(
          "INVALID_STATE",
          `Order cannot be cancelled in state '${order.status}'. Only PENDING or CONFIRMED orders can be cancelled.`
        ),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const totalAmount = Number(order.totalAmount);

    // Only wallet-funded orders have an in-app escrow balance that this application can
    // safely refund synchronously. Card/bank refunds require a verified gateway transaction
    // ID and must not be marked refunded or cancelled before that source-aware flow exists.
    if (order.payment?.paymentStatus === "PAID" && order.payment.paymentMethod !== "WALLET") {
      const { recordAuditEvent } = await import("@/lib/audit");
      await recordAuditEvent({
        category: "PAYMENT",
        severity: "WARNING",
        action: "PAID_EXTERNAL_ORDER_CANCELLATION_REQUIRES_MANUAL_REVIEW",
        actorId: session.userId,
        actorEmail: session.email,
        resourceType: "ORDER",
        resourceId: order.id,
        metadata: { orderNumber: order.orderNumber, paymentMethod: order.payment.paymentMethod, amount: totalAmount },
        req,
      });
      return NextResponse.json(
        createErrorResponse("MANUAL_REVIEW_REQUIRED", "This paid external-gateway order requires a verified source-aware refund. No order, payment, inventory, or wallet state was changed."),
        { status: 409 }
      );
    }

    if (order.payment?.paymentMethod === "WALLET" && order.payment.paymentStatus === "PAID") {
      const buyerWallet = await prisma.wallet.findUnique({
        where: { userId: order.buyer.userId },
        select: { id: true, escrow: true },
      });
      if (!buyerWallet || Number(buyerWallet.escrow) + 0.001 < totalAmount) {
        return NextResponse.json(
          createErrorResponse("ESCROW_BALANCE_MISMATCH", "The buyer escrow balance is insufficient for a safe refund. No order, payment, inventory, or wallet state was changed."),
          { status: 409 }
        );
      }
    }

    // Execute atomic refund and inventory release inside a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Restore reserved inventory back to available
      for (const item of order.orderItems) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: {
            availableQty: { increment: item.quantity },
            reservedQty: { decrement: item.quantity },
          },
        });
      }

      // 2. Update order & payment status
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });

      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            paymentStatus: order.payment.paymentStatus === "PAID" ? "REFUNDED" : "FAILED",
          },
        });
      }
    });

    // 3. Payment-Source Aware Refund Routing
    const buyerUserId = order.buyer.userId;
    if (order.payment?.paymentMethod === "WALLET") {
      // Wallet-paid order: unlock buyer's locked escrow funds back to available balance
      await WalletService.executeWalletEscrowRefund(buyerUserId, totalAmount, order.id);
    } else if (order.payment?.paymentMethod === "CARD" && order.payment?.paymentStatus === "PAID") {
      // Card-paid order that was already captured: initiate gateway refund or credit store balance
      await WalletService.executeGatewayCardRefund(
        buyerUserId,
        order.id,
        order.payment.transactionRef || order.orderNumber,
        totalAmount
      );
    }
    // Note: If CARD payment was PENDING, no funds were captured so no wallet refund is executed.

    const { recordAuditEvent } = await import("@/lib/audit");
    await recordAuditEvent({
      category: "ORDER",
      severity: "INFO",
      action: "ORDER_CANCELLED_REFUNDED",
      actorId: session.userId,
      actorEmail: session.email,
      resourceType: "ORDER",
      resourceId: order.id,
      metadata: {
        orderNumber: order.orderNumber,
        refundedAmount: totalAmount,
        recipientUserId: buyerUserId,
      },
      req,
    });

    const res = NextResponse.json(
      createSuccessResponse({
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: "CANCELLED",
        refundedAmount: totalAmount,
        refundRecipientUserId: buyerUserId,
        formattedRefundedAmount: WalletService.formatNGN(totalAmount),
        message: "Order cancelled successfully. Funds refunded to buyer wallet and inventory restored.",
      })
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    console.error("Error in POST /api/orders/[id]/cancel:", err);
    const res = NextResponse.json(
      createErrorResponse("CANCEL_FAILED", err.message || "Failed to cancel order"),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
