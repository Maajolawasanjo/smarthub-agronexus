import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// GET /api/orders/[id]/receipt — Payment Proof Receipt document endpoint
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceCtx = createTraceContext(req);
  const { id } = await params;

  try {
    const session = await getSession();
    if (!session) {
      const res = NextResponse.json(createErrorResponse("UNAUTHORIZED", "Authentication required"), { status: 401 });
      return attachTraceHeaders(res, traceCtx);
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        buyer: { include: { user: true } },
        payment: true,
      },
    });

    if (!order) {
      const res = NextResponse.json(createErrorResponse("NOT_FOUND", "Order receipt not found"), { status: 404 });
      return attachTraceHeaders(res, traceCtx);
    }

    const isAuthorized =
      session.role === "ADMIN" || order.buyer.userId === session.userId;

    if (!isAuthorized) {
      const res = NextResponse.json(createErrorResponse("FORBIDDEN", "Access denied"), { status: 403 });
      return attachTraceHeaders(res, traceCtx);
    }

    const receiptData = {
      receiptNumber: `RCT-${order.orderNumber}`,
      paymentReference: order.payment?.transactionRef || `REF-${order.id.slice(0, 8)}`,
      paymentStatus: order.payment?.paymentStatus || "PAID",
      paymentMethod: order.payment?.paymentMethod || "AgroPay Escrow Wallet",
      amountPaid: Number(order.totalAmount),
      currency: "NGN",
      paidAt: (order.payment?.createdAt || order.createdAt).toISOString(),
      buyerName: order.buyer.user.fullName,
      buyerEmail: order.buyer.user.email,
      escrowProtection: "Protected by SmartHub AgroChain Escrow",
    };

    const res = NextResponse.json(createSuccessResponse(receiptData));
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    const res = NextResponse.json(
      createErrorResponse("RECEIPT_GENERATION_FAILED", err.message || "Failed to generate receipt"),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
