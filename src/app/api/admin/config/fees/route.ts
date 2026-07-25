import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// In-memory / dynamic config storage with baseline defaults
let platformFeeConfig = {
  platformCommissionRatePercent: 5.0, // 5% marketplace commission
  escrowFeePercent: 1.5, // 1.5% escrow management fee
  vatRatePercent: 7.5, // 7.5% Statutory VAT
  currency: "NGN",
  updatedAt: new Date().toISOString(),
  updatedBy: "SYSTEM_INIT",
};

// GET /api/admin/config/fees — Retrieve platform commission & fee rates
export async function GET(req: Request) {
  const traceCtx = createTraceContext(req);

  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
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
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      const res = NextResponse.json(createErrorResponse("FORBIDDEN", "Administrative privilege required"), { status: 403 });
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
      updatedBy: session.userId,
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
