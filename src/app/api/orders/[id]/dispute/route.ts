import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";
import { publishAgroEvent } from "@/lib/events";

// POST /api/orders/[id]/dispute — Submit formal order dispute
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceCtx = createTraceContext(req);
  const { id: orderId } = await params;

  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value || "usr_demo_buyer";
    const body = await req.json();
    const { reason, description } = body;

    if (!reason || !description) {
      const res = NextResponse.json(
        createErrorResponse("INVALID_INPUT", "Dispute reason and description are required"),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { buyer: true },
    });

    if (!order) {
      const res = NextResponse.json(createErrorResponse("NOT_FOUND", "Order not found"), { status: 404 });
      return attachTraceHeaders(res, traceCtx);
    }

    // Flag order status as PROCESSING during dispute review
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "PROCESSING" },
    });

    // Emit notification event
    await publishAgroEvent("ORDER_DELIVERED", {
      userId: order.buyer.userId,
      orderId,
      orderNumber: order.orderNumber,
      remarks: `Dispute logged: ${reason} - ${description}`,
    });

    const res = NextResponse.json(
      createSuccessResponse({
        orderId,
        orderNumber: order.orderNumber,
        status: "PROCESSING_DISPUTE",
        message: "Dispute submitted successfully. SmartHub AgroChain compliance team will review within 24 hours.",
      })
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    const res = NextResponse.json(createErrorResponse("DISPUTE_FAILED", err.message || "Failed to submit dispute"), { status: 500 });
    return attachTraceHeaders(res, traceCtx);
  }
}
