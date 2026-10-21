import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

/**
 * Legacy KYC verification mutation endpoint.
 *
 * No application code calls this endpoint. The authenticated admin verification
 * workflow is implemented at PUT /api/admin/verifications/[id].
 *
 * This endpoint previously allowed unauthenticated approval/rejection. Do not
 * re-enable a parallel write path: requiring an ADMIN realm here AND returning
 * 410 prevents accidental use while retaining a clear migration message.
 */
export async function POST(req: Request) {
  const traceCtx = createTraceContext(req);

  try {
    const auth = await getAdminSession();
    if (!auth || auth.role !== "ADMIN") {
      const res = NextResponse.json(
        createErrorResponse("FORBIDDEN", "Admin authorization required."),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const res = NextResponse.json(
      createErrorResponse(
        "ENDPOINT_RETIRED",
        "Legacy KYC verification is disabled. Use PUT /api/admin/verifications/{verificationId}."
      ),
      { status: 410 }
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (error) {
    console.error("[KYC_VERIFY_LEGACY_AUTH_ERROR]", error instanceof Error ? error.name : "Unknown");
    const res = NextResponse.json(
      createErrorResponse("AUTH_CHECK_FAILED", "Unable to verify admin authorization."),
      { status: 503 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
