import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { AdminOrderService } from "@/services/admin-order.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// GET /api/admin/orders — Platform-wide orders query with administrative filters
export async function GET(req: Request) {
  const traceCtx = createTraceContext(req);

  try {
    const auth = await getAdminSession();
    if (!auth || auth.role !== "ADMIN") {
      const res = NextResponse.json(
        createErrorResponse("FORBIDDEN", "Admin authorization required to view platform orders."),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 20;
    const status = searchParams.get("status") || undefined;
    const paymentStatus = searchParams.get("paymentStatus") || undefined;
    const search = searchParams.get("search") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const data = await AdminOrderService.listOrders({
      page,
      limit,
      status,
      paymentStatus,
      search,
      startDate,
      endDate,
    });

    const res = NextResponse.json(createSuccessResponse(data));
    return attachTraceHeaders(res, traceCtx);
  } catch (error: any) {
    console.error("Error fetching admin orders:", error);
    const res = NextResponse.json(
      createErrorResponse("INTERNAL_SERVER_ERROR", error.message || "Failed to fetch orders."),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
