import { NextResponse } from "next/server";
import { ReconciliationService } from "@/services/reconciliation.service";
import { getSession } from "@/lib/session";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// POST /api/jobs/reconcile — Financial Reconciliation Job (CRON / Admin Trigger)
export async function POST(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || process.env.FLUTTERWAVE_SECRET_KEY;
    const session = await getSession();

    // Guard: Allow CRON bearer token or Admin session
    const isCron = authHeader && authHeader === `Bearer ${cronSecret}`;
    const isAdmin = session?.role === "ADMIN";

    if (!isCron && !isAdmin) {
      const res = NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "CRON bearer secret or Admin session required to run reconciliation."),
        { status: 401 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    console.log("[RECONCILIATION_JOB_START] Running automated financial integrity audit...");

    const report = await ReconciliationService.runFinancialReconciliation();

    console.log(
      `[RECONCILIATION_JOB_END] Status: ${report.status}, Wallets: ${report.summary.totalWalletsAudited}, Discrepancies: ${report.summary.discrepanciesCount}`
    );

    const res = NextResponse.json(createSuccessResponse(report));
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    console.error("Error in POST /api/jobs/reconcile:", err);
    const res = NextResponse.json(
      createErrorResponse("RECONCILIATION_FAILED", err.message || "Failed to execute reconciliation job"),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
