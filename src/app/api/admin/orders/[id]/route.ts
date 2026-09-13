import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { AdminOrderService, AdminOrderAction } from "@/services/admin-order.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// GET /api/admin/orders/[id] — Retrieve single order dossier
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const traceCtx = createTraceContext(req);

  try {
    const auth = await getAdminSession();
    if (!auth || auth.role !== "ADMIN") {
      const res = NextResponse.json(
        createErrorResponse("FORBIDDEN", "Admin authorization required to view order details."),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const { id } = await context.params;
    const data = await AdminOrderService.getOrderDetails(id);

    const res = NextResponse.json(createSuccessResponse(data));
    return attachTraceHeaders(res, traceCtx);
  } catch (error: any) {
    const status = error.message === "ORDER_NOT_FOUND" ? 404 : 500;
    const res = NextResponse.json(
      createErrorResponse(status === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR", error.message || "Failed to fetch order."),
      { status }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}

// PUT /api/admin/orders/[id] — Execute explicit domain order action with transactional escrow safety
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const traceCtx = createTraceContext(req);

  try {
    const auth = await getAdminSession();
    if (!auth || auth.role !== "ADMIN") {
      const res = NextResponse.json(
        createErrorResponse("FORBIDDEN", "Admin authorization required to modify orders."),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    // CSRF origin validation for state-changing order action
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const expectedOrigin = new URL(appUrl).origin;
    if ((origin && origin !== expectedOrigin) || (referer && !referer.startsWith(expectedOrigin))) {
      const res = NextResponse.json(createErrorResponse("FORBIDDEN", "Cross-origin request forbidden."), { status: 403 });
      return attachTraceHeaders(res, traceCtx);
    }

    const { id: orderId } = await context.params;
    const body = await req.json().catch(() => ({}));
    let { action, status, reason, trackingNumber } = body;

    // Normalization: If status is passed instead of action (e.g. from legacy UI dropdown: status === "CANCELLED")
    if (!action && status) {
      const s = status.toUpperCase();
      if (s === "CANCELLED") action = "CANCEL";
      else if (s === "COMPLETED") action = "RELEASE_ESCROW";
      else if (s === "PROCESSING") action = "MARK_PROCESSING";
      else if (s === "READY_FOR_PICKUP") action = "MARK_READY_FOR_PICKUP";
      else if (s === "IN_TRANSIT") action = "MARK_IN_TRANSIT";
      else if (s === "DELIVERED") action = "MARK_DELIVERED";
    }

    if (!action) {
      const res = NextResponse.json(
        createErrorResponse("BAD_REQUEST", "Action or valid target status is required."),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const result = await AdminOrderService.executeOrderAction({
      orderId,
      action: action as AdminOrderAction,
      reason,
      trackingNumber,
      adminUserId: auth.userId,
      adminEmail: auth.user.email,
      req,
    });

    const res = NextResponse.json(createSuccessResponse(result));
    return attachTraceHeaders(res, traceCtx);
  } catch (error: any) {
    console.error("Error executing admin order action:", error);
    const res = NextResponse.json(
      createErrorResponse("ACTION_FAILED", error.message || "Failed to execute order action."),
      { status: 400 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
