import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
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
  supportedPaymentProviders: ["AGROPAY_ESCROW", "FLUTTERWAVE"],
  supportedCurrencies: ["NGN"],
  updatedAt: new Date().toISOString(),
  updatedBy: "SYSTEM_INIT",
};

// GET /api/admin/config — Control Center configuration view
export async function GET(req: Request) {
  const traceCtx = createTraceContext(req);

  try {
    const auth = await getAdminSession();
    if (!auth || auth.role !== "ADMIN") {
      const res = NextResponse.json(createErrorResponse("FORBIDDEN", "Admin authorization required"), { status: 403 });
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
    const auth = await getAdminSession();
    if (!auth || auth.role !== "ADMIN") {
      const res = NextResponse.json(createErrorResponse("FORBIDDEN", "Admin authorization required"), { status: 403 });
      return attachTraceHeaders(res, traceCtx);
    }

    // CSRF origin validation
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const expectedOrigin = new URL(appUrl).origin;
    if ((origin && origin !== expectedOrigin) || (referer && !referer.startsWith(expectedOrigin))) {
      const res = NextResponse.json(createErrorResponse("FORBIDDEN", "Cross-origin request forbidden."), { status: 403 });
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
      updatedBy: auth.user.email,
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
