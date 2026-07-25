import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { WalletService } from "@/services/wallet.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// POST /api/wallet/withdraw — Execute NGN bank transfer payout
export async function POST(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const session = await getSession();
    if (!session?.userId) {
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

    const result = await WalletService.executeWithdrawal(session.userId, withdrawAmount, bankAccountId);

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
