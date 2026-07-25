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
          data: { paymentStatus: "FAILED" },
        });
      }
    });

    // 3. If funds were deducted to escrow (PAID via WALLET), refund buyer wallet
    if (order.payment?.paymentMethod === "WALLET" || order.payment?.paymentStatus === "PAID") {
      await WalletService.executeRefund(session.userId, totalAmount, order.id);
    }

    const res = NextResponse.json(
      createSuccessResponse({
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: "CANCELLED",
        refundedAmount: totalAmount,
        formattedRefundedAmount: WalletService.formatNGN(totalAmount),
        message: "Order cancelled successfully. Funds refunded to wallet and inventory restored.",
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
