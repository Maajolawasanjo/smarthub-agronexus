import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// Comprehensive Platform Control Center Configuration
let systemControlCenterConfig = {
  platformFeePercent: 5.0,
  vatRatePercent: 7.5,
  escrowAutoReleaseDays: 7,
  maxDailyWithdrawalLimitNgn: 5000000.0, // 5M NGN daily limit
  kycRequiredForWithdrawal: true,
  marketplaceMaintenanceMode: false,
  registrationEnabled: true,
  reviewModerationMode: "AUTO_PUBLISH", // "AUTO_PUBLISH" | "MANUAL_REVIEW"
  supportedPaymentProviders: ["AGROPAY_ESCROW", "PAYSTACK", "FLUTTERWAVE"],
  supportedCurrencies: ["NGN"],
  updatedAt: new Date().toISOString(),
  updatedBy: "SYSTEM_INIT",
};

// GET /api/admin/config — Control Center configuration view
export async function GET(req: Request) {
  const traceCtx = createTraceContext(req);

  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "config:view")) {
      const res = NextResponse.json(createErrorResponse("FORBIDDEN", "Access denied"), { status: 403 });
      return attachTraceHeaders(res, traceCtx);
    }

    const res = NextResponse.json(createSuccessResponse(systemControlCenterConfig));
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    const res = NextResponse.json(
      createErrorResponse("CONFIG_FETCH_FAILED", err.message || "Failed to fetch platform config"),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}

// PATCH /api/admin/config — Update Control Center configuration
export async function PATCH(req: Request) {
  const traceCtx = createTraceContext(req);

  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "config:update")) {
      const res = NextResponse.json(createErrorResponse("FORBIDDEN", "Access denied: config:update permission required"), { status: 403 });
      return attachTraceHeaders(res, traceCtx);
    }

    const body = await req.json();

    systemControlCenterConfig = {
      ...systemControlCenterConfig,
      ...(typeof body.platformFeePercent === "number" && { platformFeePercent: body.platformFeePercent }),
      ...(typeof body.vatRatePercent === "number" && { vatRatePercent: body.vatRatePercent }),
      ...(typeof body.escrowAutoReleaseDays === "number" && { escrowAutoReleaseDays: body.escrowAutoReleaseDays }),
      ...(typeof body.maxDailyWithdrawalLimitNgn === "number" && { maxDailyWithdrawalLimitNgn: body.maxDailyWithdrawalLimitNgn }),
      ...(typeof body.kycRequiredForWithdrawal === "boolean" && { kycRequiredForWithdrawal: body.kycRequiredForWithdrawal }),
      ...(typeof body.marketplaceMaintenanceMode === "boolean" && { marketplaceMaintenanceMode: body.marketplaceMaintenanceMode }),
      ...(typeof body.registrationEnabled === "boolean" && { registrationEnabled: body.registrationEnabled }),
      ...(typeof body.reviewModerationMode === "string" && { reviewModerationMode: body.reviewModerationMode }),
      updatedAt: new Date().toISOString(),
      updatedBy: session.userId,
    };

    const res = NextResponse.json(
      createSuccessResponse({
        config: systemControlCenterConfig,
        message: "Platform Control Center configuration updated successfully.",
      })
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    const res = NextResponse.json(
      createErrorResponse("CONFIG_UPDATE_FAILED", err.message || "Failed to update platform config"),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
