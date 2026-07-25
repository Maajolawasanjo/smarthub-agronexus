import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

export type ProduceStatusState = "ACTIVE" | "PAUSED" | "ARCHIVED" | "OUT_OF_STOCK" | "DRAFT";

// PATCH /api/farmer/produce/[id]/status — Status State Machine mutation (Pause, Archive, Activate)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceCtx = createTraceContext(req);
  const { id: productId } = await params;

  try {
    const session = await getSession();
    if (!session) {
      const res = NextResponse.json(createErrorResponse("UNAUTHORIZED", "Authentication required"), { status: 401 });
      return attachTraceHeaders(res, traceCtx);
    }

    const body = await req.json();
    const { status } = body;

    const validStatuses: ProduceStatusState[] = ["ACTIVE", "PAUSED", "ARCHIVED", "OUT_OF_STOCK", "DRAFT"];
    if (!status || !validStatuses.includes(status.toUpperCase() as ProduceStatusState)) {
      const res = NextResponse.json(
        createErrorResponse("INVALID_INPUT", "Valid status (ACTIVE, PAUSED, ARCHIVED, OUT_OF_STOCK, DRAFT) is required"),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const targetStatus = status.toUpperCase() as ProduceStatusState;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { farmerProfile: true },
    });

    if (!product) {
      const res = NextResponse.json(createErrorResponse("NOT_FOUND", "Produce listing not found"), { status: 404 });
      return attachTraceHeaders(res, traceCtx);
    }

    const isAuthorized = session.role === "ADMIN" || product.farmerProfile.userId === session.userId;
    if (!isAuthorized) {
      const res = NextResponse.json(createErrorResponse("FORBIDDEN", "Access denied"), { status: 403 });
      return attachTraceHeaders(res, traceCtx);
    }

    const isAvailable = targetStatus === "ACTIVE";

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        isAvailable,
      },
    });

    const res = NextResponse.json(
      createSuccessResponse({
        productId: updatedProduct.id,
        status: targetStatus,
        isAvailable: updatedProduct.isAvailable,
        message: `Produce listing status successfully updated to ${targetStatus}`,
      })
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    const res = NextResponse.json(
      createErrorResponse("PRODUCE_STATUS_UPDATE_FAILED", err.message || "Failed to update produce status"),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
