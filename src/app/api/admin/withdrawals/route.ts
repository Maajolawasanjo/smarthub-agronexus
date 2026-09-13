import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { AdminWithdrawalService, AdminWithdrawalAction } from "@/services/admin-withdrawal.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// GET /api/admin/withdrawals — Query withdrawal ledger stream with provider status
export async function GET(req: Request) {
  const traceCtx = createTraceContext(req);

  try {
    const auth = await getAdminSession();
    if (!auth || auth.role !== "ADMIN") {
      const res = NextResponse.json(
        createErrorResponse("FORBIDDEN", "Admin authorization required to view platform withdrawals."),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 20;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const data = await AdminWithdrawalService.listWithdrawals({
      page,
      limit,
      status,
      search,
    });

    const res = NextResponse.json(createSuccessResponse(data));
    return attachTraceHeaders(res, traceCtx);
  } catch (error: any) {
    console.error("Error fetching admin withdrawals:", error);
    const res = NextResponse.json(
      createErrorResponse("INTERNAL_SERVER_ERROR", error.message || "Failed to fetch withdrawals."),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}

// POST /api/admin/withdrawals — Process, retry, or reverse withdrawal with double-payout protection
export async function POST(req: Request) {
  const traceCtx = createTraceContext(req);

  try {
    const auth = await getAdminSession();
    if (!auth || auth.role !== "ADMIN") {
      const res = NextResponse.json(
        createErrorResponse("FORBIDDEN", "Admin authorization required to process withdrawals."),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    // CSRF origin validation for financial payout action
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const expectedOrigin = new URL(appUrl).origin;
    if ((origin && origin !== expectedOrigin) || (referer && !referer.startsWith(expectedOrigin))) {
      const res = NextResponse.json(createErrorResponse("FORBIDDEN", "Cross-origin request forbidden."), { status: 403 });
      return attachTraceHeaders(res, traceCtx);
    }

    const body = await req.json().catch(() => ({}));
    const { transactionId, action, reason } = body;

    if (!transactionId || !action) {
      const res = NextResponse.json(
        createErrorResponse("BAD_REQUEST", "transactionId and action are required."),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    if (!["APPROVE_PAYOUT", "RETRY_PAYOUT", "REVERSE_PAYOUT"].includes(action)) {
      const res = NextResponse.json(
        createErrorResponse("BAD_REQUEST", "Invalid action. Must be APPROVE_PAYOUT, RETRY_PAYOUT, or REVERSE_PAYOUT."),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const result = await AdminWithdrawalService.processWithdrawalAction({
      transactionId,
      action: action as AdminWithdrawalAction,
      reason,
      adminUserId: auth.userId,
      adminEmail: auth.user.email,
      req,
    });

    const res = NextResponse.json(createSuccessResponse(result));
    return attachTraceHeaders(res, traceCtx);
  } catch (error: any) {
    console.error("Error processing admin withdrawal action:", error);
    const res = NextResponse.json(
      createErrorResponse("ACTION_FAILED", error.message || "Failed to process withdrawal action."),
      { status: 400 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
