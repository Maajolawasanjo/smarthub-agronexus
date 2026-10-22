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
    if (session.role !== "BUYER" && session.role !== "ADMIN") {
      const res = NextResponse.json(
        createErrorResponse("FORBIDDEN", "Only the buyer or an administrator may cancel this order."),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const { id: orderId } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: true,
        orderItems: { include: { product: true } },
        payment: true,
        disputes: { where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } },
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

    if ((order.disputes?.length || 0) > 0) {
      return attachTraceHeaders(
        NextResponse.json(
          createErrorResponse("ACTIVE_DISPUTE", "Cancel this order through the active dispute workflow."),
          { status: 409 }
        ),
        traceCtx
      );
    }

    const totalAmount = Number(order.totalAmount);

    // A prior REFUNDED status is not sufficient proof for a retry. Require the
    // provider success marker or the exact successful wallet-refund ledger entry.
    if (order.payment?.paymentStatus === "REFUNDED") {
      const priorWalletRefund =
        order.payment.paymentMethod === "WALLET"
          ? await prisma.walletTransaction.findUnique({
              where: { reference: `WALLET-REFUND-${order.id}` },
            })
          : null;
      const priorCardRefund =
        order.payment.paymentMethod === "CARD"
          ? await prisma.walletTransaction.findUnique({
              where: { reference: `CARD-REFUND-${order.id}` },
            })
          : null;
      const refundConfirmed =
        (order.payment.paymentMethod === "CARD" &&
          order.payment.refundStatus === "SUCCEEDED" &&
          priorCardRefund?.status === "SUCCESS" &&
          Math.abs(Number(priorCardRefund.amount) - totalAmount) <= 0.01) ||
        (order.payment.paymentMethod === "WALLET" &&
          priorWalletRefund?.status === "SUCCESS" &&
          Math.abs(Number(priorWalletRefund.amount) - totalAmount) <= 0.01);
      if (!refundConfirmed) {
        const res = NextResponse.json(
          createErrorResponse("REFUND_STATE_CONFLICT", "The payment is marked refunded but no matching successful refund can be verified."),
          { status: 409 }
        );
        return attachTraceHeaders(res, traceCtx);
      }
    }

    // Perform the source-aware refund before marking the order/payment as cancelled.
    // If a gateway refund fails, leave the order and inventory state unchanged.
    const buyerUserId = order.buyer.userId;
    if (order.payment?.paymentStatus === "PAID") {
      if (order.payment.paymentMethod === "WALLET") {
        await WalletService.executeWalletEscrowRefund(buyerUserId, totalAmount, order.id);
      } else if (order.payment.paymentMethod === "CARD") {
        await WalletService.executeGatewayCardRefund(
          buyerUserId,
          order.id,
          order.payment.gatewayTransactionId || "",
          totalAmount
        );
      } else {
        return attachTraceHeaders(
          NextResponse.json(
            createErrorResponse(
              "MANUAL_REFUND_REQUIRED",
              "This payment method requires a verified provider refund before the order can be cancelled."
            ),
            { status: 409 }
          ),
          traceCtx
        );
      }
    }

    // Refund must succeed before inventory and order/payment states are changed.
    await prisma.$transaction(async (tx) => {
      for (const item of order.orderItems) {
        const restored = await tx.inventory.updateMany({
          where: { productId: item.productId, reservedQty: { gte: item.quantity } },
          data: {
            availableQty: { increment: item.quantity },
            reservedQty: { decrement: item.quantity },
          },
        });
        if (restored.count !== 1) {
          throw new Error(`INVENTORY_RESTORE_CONFLICT: Cannot restore reserved quantity for product ${item.productId}.`);
        }
      }

      const cancellationClaim = await tx.order.updateMany({
        where: { id: order.id, status: { in: ["PENDING", "CONFIRMED"] } },
        data: { status: "CANCELLED" },
      });
      if (cancellationClaim.count !== 1) {
        throw new Error("ORDER_STATE_CONFLICT: Another request already changed this order.");
      }

      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            paymentStatus: ["PAID", "REFUNDED"].includes(order.payment.paymentStatus) ? "REFUNDED" : "FAILED",
          },
        });
      }
    });

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to cancel order";
    const conflict = [
      "ORDER_STATE_CONFLICT",
      "INVENTORY_RESTORE_CONFLICT",
      "INSUFFICIENT_ESCROW",
      "ESCROW_NOT_FUNDED",
      "REFUND_AMOUNT_MISMATCH",
      "REFUND_ORDER_OWNER_MISMATCH",
      "PAYMENT_SOURCE_MISMATCH",
      "GATEWAY_REFUND_PAYMENT_MISMATCH",
      "CARD_REFUND_FAILED",
      "CARD_REFUND_PENDING_RECONCILIATION",
      "PAYMENT_FINANCIAL_STATE_CONFLICT",
      "REFUND_STATE_CONFLICT",
    ].some((code) => String(message).includes(code));
    const status = conflict ? 409 : 500;
    console.error("Error in POST /api/orders/[id]/cancel:", { message, status });
    const res = NextResponse.json(
      createErrorResponse(conflict ? "CANCEL_CONFLICT" : "CANCEL_FAILED", message),
      { status }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
