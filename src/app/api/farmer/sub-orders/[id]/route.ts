import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { recordAuditEvent } from "@/lib/audit";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

const VALID_FARMER_SUBORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["READY_FOR_PICKUP"],
  READY_FOR_PICKUP: ["IN_TRANSIT"],
  IN_TRANSIT: ["DELIVERED"],
  DELIVERED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

// PATCH /api/farmer/sub-orders/[id] — Transition a specific seller sub-order
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceCtx = createTraceContext(req);
  const { id: subOrderId } = await params;

  try {
    const session = await getSession();
    if (!session?.userId) {
      const res = NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "Authentication required."),
        { status: 401 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const subOrder = await prisma.sellerOrder.findUnique({
      where: { id: subOrderId },
      include: {
        farmerProfile: true,
        order: {
          include: {
            sellerOrders: true,
          },
        },
      },
    });

    if (!subOrder) {
      const res = NextResponse.json(
        createErrorResponse("NOT_FOUND", "Seller order not found."),
        { status: 404 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    // Ownership check: must be the farmer who owns this sub-order or admin
    const isOwner = subOrder.farmerProfile.userId === session.userId;
    const isAdmin = session.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      const res = NextResponse.json(
        createErrorResponse("FORBIDDEN", "You are not authorized to update this seller order."),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const body = await req.json().catch(() => ({}));
    const { status: newStatus, trackingNumber, dispatchNotes } = body;

    if (!newStatus) {
      const res = NextResponse.json(
        createErrorResponse("BAD_REQUEST", "Target status is required."),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const upperStatus = newStatus.toUpperCase();

    // Farmer role restrictions
    if (!isAdmin) {
      const farmerAllowed = ["CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "CANCELLED"];
      if (!farmerAllowed.includes(upperStatus)) {
        const res = NextResponse.json(
          createErrorResponse(
            "FORBIDDEN",
            `Farmers can only transition seller orders to: ${farmerAllowed.join(", ")}`
          ),
          { status: 403 }
        );
        return attachTraceHeaders(res, traceCtx);
      }
    }

    const allowedTransitions = VALID_FARMER_SUBORDER_TRANSITIONS[subOrder.status] || [];
    if (!allowedTransitions.includes(upperStatus) && !isAdmin) {
      const res = NextResponse.json(
        createErrorResponse(
          "INVALID_STATE_TRANSITION",
          `Invalid status transition from ${subOrder.status} to ${upperStatus}. Allowed: ${allowedTransitions.join(", ")}`
        ),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    // Execute status update and check if parent Order aggregate state should update
    const updatedSubOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.sellerOrder.update({
        where: { id: subOrderId },
        data: {
          status: upperStatus as any,
          trackingNumber: trackingNumber || subOrder.trackingNumber,
          dispatchNotes: dispatchNotes || subOrder.dispatchNotes,
          shippedAt: upperStatus === "IN_TRANSIT" ? new Date() : undefined,
          deliveredAt: upperStatus === "DELIVERED" ? new Date() : undefined,
        },
      });

      // Aggregate Master Order State synchronization
      const allSubOrders = await tx.sellerOrder.findMany({
        where: { orderId: subOrder.orderId },
      });

      const allStatuses = allSubOrders.map((so) =>
        so.id === subOrderId ? upperStatus : so.status
      );

      // If all seller orders are at least CONFIRMED, advance master order
      if (allStatuses.every((s) => s === "CONFIRMED" || s === "PROCESSING" || s === "READY_FOR_PICKUP" || s === "IN_TRANSIT" || s === "DELIVERED" || s === "COMPLETED")) {
        if (subOrder.order.status === "PENDING") {
          await tx.order.update({
            where: { id: subOrder.orderId },
            data: { status: "CONFIRMED" },
          });
        }
      }

      // If all seller orders are READY_FOR_PICKUP or higher
      if (allStatuses.every((s) => s === "READY_FOR_PICKUP" || s === "IN_TRANSIT" || s === "DELIVERED" || s === "COMPLETED")) {
        if (subOrder.order.status === "CONFIRMED" || subOrder.order.status === "PROCESSING") {
          await tx.order.update({
            where: { id: subOrder.orderId },
            data: { status: "READY_FOR_PICKUP" },
          });
        }
      }

      return updated;
    });

    await recordAuditEvent({
      category: "ORDER",
      severity: "INFO",
      action: "SELLER_ORDER_STATUS_UPDATED",
      actorId: session.userId,
      actorEmail: session.email,
      resourceType: "SELLER_ORDER",
      resourceId: subOrderId,
      metadata: {
        sellerOrderNumber: subOrder.sellerOrderNumber,
        previousStatus: subOrder.status,
        newStatus: upperStatus,
      },
      req,
    });

    const res = NextResponse.json(
      createSuccessResponse({
        message: `Seller order updated: ${subOrder.status} → ${upperStatus}`,
        sellerOrder: updatedSubOrder,
      }),
      { status: 200 }
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (error: any) {
    console.error("Error updating seller order status:", error);
    const res = NextResponse.json(
      createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to update seller order."),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
