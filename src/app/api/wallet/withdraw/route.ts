import { isTrustedMutationOrigin } from "@/lib/csrf";
import { NextResponse } from "next/server";
import { getSharedSession, AuthRealm } from "@/lib/session";
import { WalletService } from "@/services/wallet.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// POST /api/wallet/withdraw — Execute NGN bank transfer payout
export async function POST(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    // 2. Authoritative Multi-Realm Session Verification
    const auth = await getSharedSession(req, [AuthRealm.FARMER, AuthRealm.BUYER]);
    if (!auth?.userId) {
      const res = NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "Authentication required to initiate withdrawal."),
        { status: 401 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    // The wallet is cookie-authenticated: do not initiate payouts for
    // untrusted or origin-less browser mutations.
    if (!isTrustedMutationOrigin(req)) {
      const res = NextResponse.json(
        createErrorResponse("FORBIDDEN", "Untrusted mutation origin."),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const idempotencyKey = (req.headers.get("idempotency-key") || req.headers.get("x-idempotency-key") || "").trim();
    if (idempotencyKey.length < 8 || idempotencyKey.length > 200) {
      const res = NextResponse.json(
        createErrorResponse("IDEMPOTENCY_KEY_REQUIRED", "Provide a valid Idempotency-Key so a retry cannot create a second withdrawal."),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

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
    const result = await WalletService.executeWithdrawal(
      auth.userId,
      withdrawAmount,
      bankAccountId,
      idempotencyKey
    );

    if (result.status === "FAILED" || result.status === "REVERSED") {
      const res = NextResponse.json(
        createErrorResponse("WITHDRAWAL_NOT_COMPLETED", "The withdrawal was reversed and the reserved funds were restored. Use a new idempotency key for a new attempt."),
        { status: 409 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const res = NextResponse.json(
      createSuccessResponse({
        transactionRef: result.transactionRef,
        amountWithdrawn: Number(withdrawAmount.toFixed(2)),
        formattedAmount: WalletService.formatNGN(Number(withdrawAmount.toFixed(2))),
        newBalance: Number(result.updatedWallet.balance),
        formattedNewBalance: WalletService.formatNGN(Number(result.updatedWallet.balance)),
        status: result.status,
        alreadyProcessed: result.alreadyProcessed,
        reconciliationRequired: result.reconciliationRequired,
        timestamp: new Date().toISOString(),
      }),
      { status: result.reconciliationRequired ? 202 : 200 }
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    console.error("Error in POST /api/wallet/withdraw:", err);
    const message = err instanceof Error ? err.message : "Failed to process bank withdrawal.";
    const status =
      message.startsWith("ACCOUNT_FROZEN") ? 403
      : message.startsWith("INSUFFICIENT_FUNDS") || message.startsWith("INVALID_AMOUNT") || message.startsWith("INVALID_BANK_ACCOUNT") ? 400
      : message.startsWith("IDEMPOTENCY_KEY_REUSED") || message.startsWith("WITHDRAWAL_IDEMPOTENCY_TERMINAL") || message.startsWith("WITHDRAWAL_STATE_CONFLICT") || message.startsWith("WITHDRAWAL_ROLLBACK_CONFLICT") ? 409
      : message.startsWith("GATEWAY_UNCONFIGURED") ? 503
      : message.startsWith("BANK_TRANSFER_FAILED") ? 502
      : 500;
    const errorCode = [
      "ACCOUNT_FROZEN",
      "INSUFFICIENT_FUNDS",
      "INVALID_AMOUNT",
      "INVALID_BANK_ACCOUNT",
      "IDEMPOTENCY_KEY_REUSED",
      "WITHDRAWAL_IDEMPOTENCY_TERMINAL",
      "WITHDRAWAL_STATE_CONFLICT",
      "WITHDRAWAL_ROLLBACK_CONFLICT",
      "GATEWAY_UNCONFIGURED",
      "BANK_TRANSFER_FAILED",
    ].find((code) => message.startsWith(code)) || "WITHDRAWAL_FAILED";
    const res = NextResponse.json(
      createErrorResponse(errorCode, message),
      { status }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
