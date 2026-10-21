import { isTrustedMutationOrigin } from "@/lib/csrf";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { WalletService } from "@/services/wallet.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";
import { recordAuditEvent } from "@/lib/audit";

// POST /api/orders/[id]/release-escrow — Release escrow funds to farmer upon buyer delivery confirmation
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const traceCtx = createTraceContext(req);
  try {
    const session = await getSession();
    if (!session?.userId) {
      const res = NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "Authentication required to release escrow."),
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
      include: { buyer: true, payment: true, delivery: true, sellerOrders: true, disputes: true },
    });

    if (!order) {
      const res = NextResponse.json(
        createErrorResponse("NOT_FOUND", "Order not found."),
        { status: 404 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    // Only the authenticated buyer who owns this order may confirm delivery here.
    // Admin arbitration uses the dedicated dispute-resolution endpoint.
    if (session.role !== "BUYER" || order.buyer.userId !== session.userId) {
      const res = NextResponse.json(
        createErrorResponse("FORBIDDEN", "Only the buyer who placed the order can confirm delivery & release escrow."),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    if (order.status === "COMPLETED") {
      const res = NextResponse.json(
        createErrorResponse("ALREADY_RELEASED", "Escrow has already been released for this order."),
        { status: 409 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    if (order.payment?.paymentStatus !== "PAID") {
      const res = NextResponse.json(
        createErrorResponse("PAYMENT_NOT_SETTLED", "Payment must be confirmed before escrow release."),
        { status: 409 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const deliveryConfirmed =
      order.status === "DELIVERED" ||
      order.delivery?.deliveryStatus === "DELIVERED" ||
      (order.sellerOrders.length > 0 && order.sellerOrders.every((sellerOrder) =>
        sellerOrder.status === "DELIVERED" || sellerOrder.status === "COMPLETED"
      ));
    if (!deliveryConfirmed) {
      const res = NextResponse.json(
        createErrorResponse("DELIVERY_NOT_CONFIRMED", "Escrow can only be released after delivery is confirmed."),
        { status: 409 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    if (order.disputes.some((dispute) => dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW")) {
      const res = NextResponse.json(
        createErrorResponse("DISPUTE_OPEN", "Escrow is held while this order has an active dispute."),
        { status: 409 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const result = await WalletService.executeEscrowRelease(session.userId, orderId);

    await recordAuditEvent({
      category: "PAYMENT",
      severity: "INFO",
      action: "ESCROW_RELEASED",
      actorId: session.userId,
      actorEmail: session.email,
      resourceId: order.id,
      metadata: { orderNumber: order.orderNumber, amount: Number(order.totalAmount) },
      req,
    });

    const res = NextResponse.json(
      createSuccessResponse({
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: "COMPLETED",
        message: "Delivery confirmed! Escrow funds released to farmer wallet (minus 5.0% platform commission).",
      })
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    console.error("Error in POST /api/orders/[id]/release-escrow:", err);
    const res = NextResponse.json(
      createErrorResponse("ESCROW_RELEASE_FAILED", err.message || "Failed to release escrow"),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
