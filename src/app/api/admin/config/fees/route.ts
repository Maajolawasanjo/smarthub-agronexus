import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// In-memory / dynamic config storage with baseline defaults
let platformFeeConfig = {
  platformCommissionRatePercent: 5.0, // 5% marketplace commission
  escrowFeePercent: 0.0, // Escrow management included in platform commission (authoritative model)
  vatRatePercent: 7.5, // 7.5% Statutory VAT on commission
  currency: "NGN",
  updatedAt: new Date().toISOString(),
  updatedBy: "SYSTEM_INIT",
};

// GET /api/admin/config/fees — Retrieve platform commission & fee rates
export async function GET(req: Request) {
  const traceCtx = createTraceContext(req);

  try {
    const auth = await getAdminSession();
    if (!auth || auth.role !== "ADMIN") {
      const res = NextResponse.json(createErrorResponse("FORBIDDEN", "Administrative privilege required"), { status: 403 });
      return attachTraceHeaders(res, traceCtx);
    }

    const res = NextResponse.json(createSuccessResponse(platformFeeConfig));
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    const res = NextResponse.json(
      createErrorResponse("CONFIG_FETCH_FAILED", err.message || "Failed to fetch platform fee config"),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}

// PATCH /api/admin/config/fees — Update platform commission & fee rates
export async function PATCH(req: Request) {
  const traceCtx = createTraceContext(req);

  try {
    const auth = await getAdminSession();
    if (!auth || auth.role !== "ADMIN") {
      const res = NextResponse.json(createErrorResponse("FORBIDDEN", "Administrative privilege required"), { status: 403 });
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
    const { platformCommissionRatePercent, escrowFeePercent, vatRatePercent } = body;

    if (
      (platformCommissionRatePercent !== undefined && (typeof platformCommissionRatePercent !== "number" || platformCommissionRatePercent < 0)) ||
      (escrowFeePercent !== undefined && (typeof escrowFeePercent !== "number" || escrowFeePercent < 0)) ||
      (vatRatePercent !== undefined && (typeof vatRatePercent !== "number" || vatRatePercent < 0))
    ) {
      const res = NextResponse.json(
        createErrorResponse("INVALID_INPUT", "Fee rates must be non-negative numeric percentages"),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    platformFeeConfig = {
      ...platformFeeConfig,
      ...(platformCommissionRatePercent !== undefined && { platformCommissionRatePercent }),
      ...(escrowFeePercent !== undefined && { escrowFeePercent }),
      ...(vatRatePercent !== undefined && { vatRatePercent }),
      updatedAt: new Date().toISOString(),
      updatedBy: auth.user.email,
    };

    const res = NextResponse.json(
      createSuccessResponse({
        config: platformFeeConfig,
        message: "Platform commission & fee configuration updated successfully.",
      })
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    const res = NextResponse.json(
      createErrorResponse("CONFIG_UPDATE_FAILED", err.message || "Failed to update fee configuration"),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
