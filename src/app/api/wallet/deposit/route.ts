import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { WalletService } from "@/services/wallet.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// POST /api/wallet/deposit — Multi-Option Funding Instructions & Deposit Trigger
export async function POST(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const session = await getSession();
    if (!session?.userId) {
      const res = NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "Authentication required to fund wallet."),
        { status: 401 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const body = await req.json();
    const { amount, method = "VIRTUAL_ACCOUNT", simulateWebhook = false } = body;
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      const res = NextResponse.json(
        createErrorResponse("INVALID_AMOUNT", "Deposit amount must be greater than zero"),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    // Direct simulated instant deposit completion (for testing/demo)
    if (simulateWebhook) {
      const txRef = `DEP-SIM-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const result = await WalletService.executeDeposit(session.userId, numAmount, txRef);

      const res = NextResponse.json(
        createSuccessResponse({
          status: "SUCCESS",
          transactionRef: txRef,
          amountCredited: numAmount,
          newBalance: Number(result.updatedWallet.balance),
          message: `Wallet successfully credited with ${WalletService.formatNGN(numAmount)}`,
        })
      );
      return attachTraceHeaders(res, traceCtx);
    }

    // Return Multi-Option Funding Instructions
    const walletPageData = await WalletService.getWalletPageData(session.userId);
    const fundingInstructions = walletPageData.fundingInstructions;

    const res = NextResponse.json(
      createSuccessResponse({
        requestedAmount: numAmount,
        formattedAmount: WalletService.formatNGN(numAmount),
        method,
        fundingInstructions,
      })
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    console.error("Error in POST /api/wallet/deposit:", err);
    const res = NextResponse.json(
      createErrorResponse("DEPOSIT_FAILED", err.message || "Failed to initialize deposit instructions"),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
