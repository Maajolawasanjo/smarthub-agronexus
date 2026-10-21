import { isTrustedMutationOrigin } from "@/lib/csrf";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { WalletService } from "@/services/wallet.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";
import { recordAuditEvent } from "@/lib/audit";

// POST /api/orders/[id]/release-escrow — Buyer confirms delivery and releases funded escrow.
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const traceCtx = createTraceContext(req);
  try {
    const session = await getSession();
    if (!session?.userId) {
      return attachTraceHeaders(
        NextResponse.json(createErrorResponse("UNAUTHORIZED", "Authentication required to release escrow."), { status: 401 }),
        traceCtx
      );
    }
    if (session.role !== "BUYER") {
      return attachTraceHeaders(
        NextResponse.json(createErrorResponse("FORBIDDEN", "Only the buyer can confirm delivery and release escrow."), { status: 403 }),
        traceCtx
      );
    }
    if (!isTrustedMutationOrigin(req)) {
      return attachTraceHeaders(
        NextResponse.json(createErrorResponse("FORBIDDEN", "Untrusted mutation origin."), { status: 403 }),
        traceCtx
      );
    }

    const { id: orderId } = await context.params;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: true,
        payment: true,
        disputes: { where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } },
      },
    });

    if (!order) {
      return attachTraceHeaders(
        NextResponse.json(createErrorResponse("NOT_FOUND", "Order not found."), { status: 404 }),
        traceCtx
      );
    }
    if (order.buyer.userId !== session.userId) {
      return attachTraceHeaders(
        NextResponse.json(createErrorResponse("FORBIDDEN", "You are not authorized to release this order's escrow."), { status: 403 }),
        traceCtx
      );
    }
    if (order.status !== "DELIVERED") {
      return attachTraceHeaders(
        NextResponse.json(createErrorResponse("ORDER_NOT_DELIVERED", "Escrow can only be released after delivery is confirmed."), { status: 409 }),
        traceCtx
      );
    }
    if (order.payment?.paymentStatus !== "PAID") {
      return attachTraceHeaders(
        NextResponse.json(createErrorResponse("PAYMENT_NOT_SETTLED", "This order has no settled payment to release."), { status: 409 }),
        traceCtx
      );
    }
    if ((order.disputes?.length || 0) > 0) {
      return attachTraceHeaders(
        NextResponse.json(createErrorResponse("ACTIVE_DISPUTE", "Escrow is frozen while an order dispute is active."), { status: 409 }),
        traceCtx
      );
    }

    const result = await WalletService.executeEscrowRelease(session.userId, orderId);

    await recordAuditEvent({
      category: "PAYMENT",
      severity: "INFO",
      action: "ESCROW_RELEASED",
      actorId: session.userId,
      actorEmail: session.email,
      resourceId: order.id,
      metadata: {
        orderNumber: order.orderNumber,
        amount: Number(order.totalAmount),
        settledSellerOrdersCount: "settledSellerOrdersCount" in result ? result.settledSellerOrdersCount : result.settledCount,
      },
      req,
    });

    return attachTraceHeaders(
      NextResponse.json(createSuccessResponse({
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: "COMPLETED",
        message: "Delivery confirmed and escrow release processed.",
      })),
      traceCtx
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to release escrow.";
    const conflictCodes = [
      "ORDER_NOT_DELIVERED",
      "PAYMENT_NOT_SETTLED",
      "PAYMENT_FINANCIAL_STATE_CONFLICT",
      "ACTIVE_DISPUTE_BLOCKS_RELEASE",
      "ESCROW_NOT_FUNDED",
      "INSUFFICIENT_ESCROW",
      "ESCROW_ALREADY_RELEASED",
      "SELLER_ORDER_NOT_DELIVERED",
      "SELLER_ORDER_TOTAL_MISMATCH",
      "PAYMENT_AMOUNT_MISMATCH",
      "INVALID_ORDER_AMOUNT",
      "SELLER_GROSS_EXCEEDS_ORDER_AMOUNT",
      "ORDER_OWNER_MISMATCH",
      "ESCROW_LOCK_REFERENCE_MISSING",
      "NO_SELLERS_FOR_ORDER",
      "SELLER_USER_NOT_FOUND",
      "INVALID_SELLER_ORDER_AMOUNT",
    ];
    const status = conflictCodes.some((code) => message.includes(code)) ? 409 : 500;
    console.error("[ORDER_ESCROW_RELEASE_ERROR]", { message, status });
    return attachTraceHeaders(
      NextResponse.json(createErrorResponse(
        status === 409 ? "ESCROW_RELEASE_CONFLICT" : "ESCROW_RELEASE_FAILED",
        message
      ), { status }),
      traceCtx
    );
  }
}
