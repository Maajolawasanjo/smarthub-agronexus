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
            paymentStatus: order.payment.paymentStatus === "PAID" ? "REFUNDED" : "FAILED",
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
  } catch (err: any) {
    console.error("Error in POST /api/orders/[id]/cancel:", err);
    const res = NextResponse.json(
      createErrorResponse("CANCEL_FAILED", err.message || "Failed to cancel order"),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
