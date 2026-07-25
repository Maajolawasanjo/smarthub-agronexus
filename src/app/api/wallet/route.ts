import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { WalletService } from "@/services/wallet.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// GET /api/wallet — Fetch unified WalletPageDTO (Single Source of Truth)
export async function GET(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const session = await getSession();
    if (!session?.userId) {
      const res = NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "Authentication required to access wallet data."),
        { status: 401 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const walletPageData = await WalletService.getWalletPageData(session.userId);
    const res = NextResponse.json(createSuccessResponse(walletPageData));
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    console.error("Error in GET /api/wallet:", err);
    const res = NextResponse.json(
      createErrorResponse("WALLET_FETCH_FAILED", err.message || "Failed to retrieve wallet data."),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
