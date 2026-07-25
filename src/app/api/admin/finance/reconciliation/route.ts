import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { config } from "@/lib/config";

// ────────────────────────────────────────────────────────────
// GET /api/admin/finance/reconciliation
// Production Financial Double-Entry Reconciliation Engine
// ────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin privilege required for reconciliation." },
        { status: 403 }
      );
    }

    // 1. Aggregate Buyer Wallet Balances
    const buyerWallets = await prisma.wallet.aggregate({
      where: { user: { role: "BUYER" } },
      _sum: { balance: true, escrow: true },
    });
    const buyerBalances = Number(buyerWallets._sum.balance || 0);

    // 2. Aggregate System Escrow Locked Funds
    const totalEscrowResult = await prisma.wallet.aggregate({
      _sum: { escrow: true },
    });
    const escrow = Number(totalEscrowResult._sum.escrow || 0);

    // 3. Aggregate Farmer Wallet Balances
    const farmerWallets = await prisma.wallet.aggregate({
      where: { user: { role: "FARMER" } },
      _sum: { balance: true },
    });
    const farmerBalances = Number(farmerWallets._sum.balance || 0);

    // 4. Aggregate Platform Fee Revenue (Single Source of Truth config.fees.platformFeeRate)
    const completedOrders = await prisma.order.aggregate({
      where: { status: "COMPLETED" },
      _sum: { totalAmount: true },
    });
    const grossCompletedGMV = Number(completedOrders._sum.totalAmount || 0);
    const platformRevenue = grossCompletedGMV * config.fees.platformFeeRate;

    // 5. Aggregate Pending Payout Withdrawals
    const pendingTxResult = await prisma.walletTransaction.aggregate({
      where: { type: "WITHDRAWAL", status: "PENDING" },
      _sum: { amount: true },
    });
    const pendingWithdrawals = Number(pendingTxResult._sum.amount || 0);

    // 6. Aggregate Total Ledger Transactions Volume
    const ledgerTxResult = await prisma.walletTransaction.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true },
    });
    const ledgerTotal = Number(ledgerTxResult._sum.amount || 0);

    // 7. Aggregate Total Capital across all Wallets
    const allWalletsResult = await prisma.wallet.aggregate({
      _sum: { balance: true, escrow: true },
    });
    const walletTableTotal =
      Number(allWalletsResult._sum.balance || 0) +
      Number(allWalletsResult._sum.escrow || 0);

    // 8. Reconciliation Formula Evaluation
    const expectedSum = buyerBalances + escrow + farmerBalances;
    const difference = Math.abs(walletTableTotal - expectedSum);

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        platformFeePercentage: `${(config.fees.platformFeeRate * 100).toFixed(1)}%`,
        buyerBalances,
        escrow,
        farmerBalances,
        platformRevenue,
        pendingWithdrawals,
        ledgerTotal,
        walletTableTotal,
        difference,
        status: difference === 0 ? "BALANCED" : "DISCREPANCY_ALERT",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[FINANCIAL_RECONCILIATION_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error calculating financial reconciliation." },
      { status: 500 }
    );
  }
}
