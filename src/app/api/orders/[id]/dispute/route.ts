import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";
import { getSession } from "@/lib/session";
import { recordAuditEvent } from "@/lib/audit";

// POST /api/orders/[id]/dispute — Submit formal order dispute
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceCtx = createTraceContext(req);
  const { id: orderId } = await params;

  try {
    const session = await getSession();
    if (!session || !session.userId) {
      const res = NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "Authentication required to file an order dispute"),
        { status: 401 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const body = await req.json().catch(() => ({}));
    const { reason, description, title } = body;

    if (!reason && !description) {
      const res = NextResponse.json(
        createErrorResponse("INVALID_INPUT", "Dispute reason and description are required"),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: true,
        disputes: {
          where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
        },
      },
    });

    if (!order) {
      const res = NextResponse.json(
        createErrorResponse("NOT_FOUND", "Order not found"),
        { status: 404 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    // Verify ownership: buyer or admin
    if (order.buyer.userId !== session.userId && session.role !== "ADMIN") {
      const res = NextResponse.json(
        createErrorResponse("FORBIDDEN", "Only the buyer who placed this order can file a dispute"),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    // Check for duplicate active disputes
    if (order.disputes && order.disputes.length > 0) {
      const res = NextResponse.json(
        createErrorResponse("CONFLICT", "An active dispute is already open for this order"),
        { status: 409 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const disputeTitle = title || reason || "Order Dispute";
    const disputeDesc = (description || reason || "").trim();

    // Create real dispute record in DB
    const dispute = await prisma.dispute.create({
      data: {
        orderId,
        userId: session.userId,
        title: disputeTitle,
        description: disputeDesc,
        status: "OPEN",
      },
    });

    await recordAuditEvent({
      category: "DISPUTE",
      severity: "WARNING",
      action: "DISPUTE_OPENED",
      actorId: session.userId,
      actorEmail: session.email,
      resourceId: orderId,
      metadata: { reason, orderNumber: order.orderNumber, disputeId: dispute.id },
      req,
    });

    const res = NextResponse.json(
      createSuccessResponse({
        orderId,
        orderNumber: order.orderNumber,
        disputeId: dispute.id,
        status: "OPEN",
        message: "Dispute submitted successfully. SmartHub AgroChain compliance team will review within 24 hours.",
      })
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    console.error("Error submitting order dispute:", err);
    const res = NextResponse.json(
      createErrorResponse("DISPUTE_FAILED", err.message || "Failed to submit dispute"),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}

