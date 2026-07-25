import { NextResponse } from "next/server";
import { prisma, executeWithDbRetry } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { WalletService } from "@/services/wallet.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// GET /api/admin/finance — Authoritative SQL Aggregation for Financial Operations
export async function GET(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      const res = NextResponse.json(
        createErrorResponse("FORBIDDEN", "Admin authorization required to view platform finance."),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const financeSummary = await executeWithDbRetry(async () => {
      // 1. Aggregate All Wallet Balances from PostgreSQL
      const walletAgg = await prisma.wallet.aggregate({
        _sum: {
          balance: true,
          escrow: true,
          pendingWithdrawal: true,
          frozen: true,
        },
        _count: { id: true },
      });

      const totalBalanceFloat = Number(walletAgg._sum.balance || 0);
      const totalEscrowHoldings = Number(walletAgg._sum.escrow || 0);
      const totalPendingWithdrawals = Number(walletAgg._sum.pendingWithdrawal || 0);
      const totalFrozenDisputeFunds = Number(walletAgg._sum.frozen || 0);
      const totalWalletsCount = walletAgg._count.id;

      // 2. Aggregate Platform Revenue (2.5% fee retained on ESCROW_RELEASE transactions)
      const releaseTxns = await prisma.walletTransaction.findMany({
        where: { type: "ESCROW_RELEASE", status: "SUCCESS" },
      });

      // Each ESCROW_RELEASE amount = totalOrder * 0.975. So platform fee = amount / 0.975 * 0.025
      const totalPlatformRevenue = releaseTxns.reduce((sum, tx) => {
        const farmerCredit = Number(tx.amount);
        const fee = (farmerCredit / 0.975) * 0.025;
        return sum + fee;
      }, 0);

      // 3. Aggregate Total Deposits & Total Withdrawals
      const depositAgg = await prisma.walletTransaction.aggregate({
        where: { type: "DEPOSIT", status: "SUCCESS" },
        _sum: { amount: true },
      });
      const totalDeposits = Number(depositAgg._sum.amount || 0);

      const withdrawalAgg = await prisma.walletTransaction.aggregate({
        where: { type: "WITHDRAWAL", status: "SUCCESS" },
        _sum: { amount: true },
      });
      const totalCompletedWithdrawals = Number(withdrawalAgg._sum.amount || 0);

      // 4. Fetch System-Wide Recent Ledger Transactions
      const recentTxnsRaw = await prisma.walletTransaction.findMany({
        take: 30,
        orderBy: { createdAt: "desc" },
        include: {
          wallet: {
            include: {
              user: { select: { fullName: true, email: true, role: true } },
            },
          },
        },
      });

      const recentTransactions = recentTxnsRaw.map((t) => ({
        id: t.id,
        reference: t.reference,
        type: t.type,
        amount: Number(t.amount),
        formattedAmount: WalletService.formatNGN(Number(t.amount)),
        status: t.status,
        description: t.description,
        userName: t.wallet.user.fullName || "User",
        userEmail: t.wallet.user.email,
        userRole: t.wallet.user.role,
        date: new Date(t.createdAt).toLocaleDateString("en-NG", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));

      // 5. Fetch User Wallet Balances Breakdown
      const userWalletsRaw = await prisma.wallet.findMany({
        take: 20,
        orderBy: { updatedAt: "desc" },
        include: {
          user: { select: { id: true, fullName: true, email: true, role: true } },
        },
      });

      const userWallets = userWalletsRaw.map((w) => ({
        walletId: w.id,
        userId: w.userId,
        userName: w.user.fullName || "User",
        userEmail: w.user.email,
        userRole: w.user.role,
        balance: Number(w.balance),
        formattedBalance: WalletService.formatNGN(Number(w.balance)),
        escrow: Number(w.escrow),
        formattedEscrow: WalletService.formatNGN(Number(w.escrow)),
        pendingWithdrawal: Number(w.pendingWithdrawal),
        formattedPendingWithdrawal: WalletService.formatNGN(Number(w.pendingWithdrawal)),
        frozen: Number(w.frozen),
        formattedFrozen: WalletService.formatNGN(Number(w.frozen)),
      }));

      return {
        overview: {
          totalBalanceFloat,
          formattedTotalBalanceFloat: WalletService.formatNGN(totalBalanceFloat),
          totalEscrowHoldings,
          formattedTotalEscrowHoldings: WalletService.formatNGN(totalEscrowHoldings),
          totalPendingWithdrawals,
          formattedTotalPendingWithdrawals: WalletService.formatNGN(totalPendingWithdrawals),
          totalFrozenDisputeFunds,
          formattedTotalFrozenDisputeFunds: WalletService.formatNGN(totalFrozenDisputeFunds),
          totalPlatformRevenue,
          formattedTotalPlatformRevenue: WalletService.formatNGN(totalPlatformRevenue),
          totalDeposits,
          formattedTotalDeposits: WalletService.formatNGN(totalDeposits),
          totalCompletedWithdrawals,
          formattedTotalCompletedWithdrawals: WalletService.formatNGN(totalCompletedWithdrawals),
          totalWalletsCount,
        },
        recentTransactions,
        userWallets,
      };
    });

    const res = NextResponse.json(createSuccessResponse(financeSummary));
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    console.error("Error in GET /api/admin/finance:", err);
    const res = NextResponse.json(
      createErrorResponse("FINANCE_FETCH_FAILED", err.message || "Failed to fetch admin finance data"),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
