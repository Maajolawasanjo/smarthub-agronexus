import { NextResponse } from "next/server";
import { getSharedSession, AuthRealm } from "@/lib/session";
import { WalletService } from "@/services/wallet.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// POST /api/wallet/withdraw — Execute NGN bank transfer payout
export async function POST(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    // 1. CSRF Layer: Verify Origin on state-changing financial mutation
    const origin = req.headers.get("origin");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (origin && appUrl) {
      try {
        const originHost = new URL(origin).host;
        const appHost = new URL(appUrl).host;
        if (originHost !== appHost && !originHost.includes("localhost")) {
          const res = NextResponse.json(
            createErrorResponse("FORBIDDEN", "Cross-origin financial mutations are prohibited."),
            { status: 403 }
          );
          return attachTraceHeaders(res, traceCtx);
        }
      } catch {
        // malformed origin header
      }
    }

    // 2. Authoritative Multi-Realm Session Verification
    const auth = await getSharedSession(req, [AuthRealm.FARMER, AuthRealm.BUYER]);
    if (!auth?.userId) {
      const res = NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "Authentication required to initiate withdrawal."),
        { status: 401 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const idempotencyKey = req.headers.get("idempotency-key") || req.headers.get("x-idempotency-key");
    const body = await req.json();
    const { amount, bankAccountId } = body;
    const withdrawAmount = parseFloat(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      const res = NextResponse.json(
        createErrorResponse("INVALID_AMOUNT", "Withdrawal amount must be greater than zero"),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    // 3. Strict Financial Invariant: Identity derived strictly from server-verified auth.userId
    const result = await WalletService.executeWithdrawal(auth.userId, withdrawAmount, bankAccountId);

    const res = NextResponse.json(
      createSuccessResponse({
        transactionRef: result.transactionRef,
        amountWithdrawn: withdrawAmount,
        formattedAmount: WalletService.formatNGN(withdrawAmount),
        newBalance: Number(result.updatedWallet.balance),
        formattedNewBalance: WalletService.formatNGN(Number(result.updatedWallet.balance)),
        status: "SUCCESS",
        timestamp: new Date().toISOString(),
      })
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    console.error("Error in POST /api/wallet/withdraw:", err);
    const status = err.message?.startsWith("ACCOUNT_FROZEN") ? 403 : err.message?.startsWith("INSUFFICIENT_FUNDS") ? 400 : 500;
    const res = NextResponse.json(
      createErrorResponse("WITHDRAWAL_FAILED", err.message || "Failed to process bank withdrawal"),
      { status }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
