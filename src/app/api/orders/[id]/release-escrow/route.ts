import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { WalletService } from "@/services/wallet.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

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

    const { id: orderId } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { buyer: true },
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
        createErrorResponse("FORBIDDEN", "Only the buyer who placed the order can confirm delivery & release escrow."),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    if (order.status === "COMPLETED") {
      const res = NextResponse.json(
        createErrorResponse("ALREADY_RELEASED", "Escrow has already been released for this order."),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const result = await WalletService.executeEscrowRelease(session.userId, orderId);

    const res = NextResponse.json(
      createSuccessResponse({
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: "COMPLETED",
        message: "Delivery confirmed! Escrow funds released to farmer wallet (minus 2.5% platform commission).",
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
