import { describe, test, expect, vi, beforeEach } from "vitest";
import { WalletService } from "../../src/services/wallet.service";
import { prisma } from "../../src/lib/prisma";

// Mock event bus to prevent network timeout
vi.mock("@/lib/events", () => ({
  publishAgroEvent: vi.fn().mockResolvedValue(true),
}));

describe("Wallet Domain Consolidation Integration Suite", () => {
  const mockUserId = "usr_test_wallet_101";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("1. Business Rule: Single Source of Truth Wallet DTO calculation in NGN", async () => {
    vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
      id: mockUserId,
      fullName: "Test Farmer",
      email: "farmer@agronexus.com",
      phoneNumber: "+2348000000000",
      password: "hash",
      role: "FARMER",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      buyerProfile: null,
      farmerProfile: null,
    } as any);

    vi.spyOn(prisma.wallet, "findUnique").mockResolvedValue({
      id: "w_101",
      userId: mockUserId,
      balance: 150000.0 as any,
      escrow: 25000.0 as any,
      pendingWithdrawal: 0.0 as any,
      frozen: 0.0 as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.spyOn(prisma.order, "aggregate").mockResolvedValue({
      _sum: { totalAmount: 25000.0 as any },
      _count: {},
      _avg: {},
      _min: {},
      _max: {},
    });

    vi.spyOn(prisma.dispute, "findMany").mockResolvedValue([]);
    vi.spyOn(prisma.walletTransaction, "aggregate").mockResolvedValue({
      _sum: { amount: 0.0 as any },
      _count: {},
      _avg: {},
      _min: {},
      _max: {},
    });

    vi.spyOn(prisma.bankAccount, "findMany").mockResolvedValue([
      {
        id: "bank_1",
        userId: mockUserId,
        bankName: "Zenith Bank",
        bankCode: "057",
        accountNumber: "2201948201",
        accountName: "Test Farmer",
        isVerified: true,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    vi.spyOn(prisma.walletTransaction, "findMany").mockResolvedValue([
      {
        id: "tx_1",
        walletId: "w_101",
        type: "DEPOSIT",
        amount: 50000.0 as any,
        reference: "DEP-101",
        description: "Bank transfer",
        status: "SUCCESS",
        createdAt: new Date(),
      },
    ]);

    const pageData = await WalletService.getWalletPageData(mockUserId);

    expect(pageData.balances.currency).toBe("NGN");
    expect(pageData.balances.availableBalance).toBe(150000.0);
    expect(pageData.balances.formattedAvailableBalance).toBe("₦150,000.00");
    expect(pageData.fundingInstructions.supportedMethods).toContain("VIRTUAL_ACCOUNT");
    expect(pageData.linkedBanks).toHaveLength(1);
    expect(pageData.recentTransactions).toHaveLength(1);
  });

  test("2. Business Rule: Atomic Deposit Wallet Credit & Transaction Log", async () => {
    vi.spyOn(prisma.wallet, "findUnique").mockResolvedValue({
      id: "w_101",
      userId: mockUserId,
      balance: 100000.0 as any,
      escrow: 0.0 as any,
      pendingWithdrawal: 0.0 as any,
      frozen: 0.0 as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.spyOn(prisma, "$transaction").mockResolvedValue([
      { id: "w_101", userId: mockUserId, balance: 125000.0 as any, escrow: 0.0 as any },
      {
        id: "tx_dep",
        walletId: "w_101",
        type: "DEPOSIT",
        amount: 25000 as any,
        reference: "DEP-TEST-99",
        description: "Bank transfer",
        status: "SUCCESS",
        createdAt: new Date(),
      },
    ]);

    const result = await WalletService.executeDeposit(mockUserId, 25000, "DEP-TEST-99");

    expect(result.txRecord.type).toBe("DEPOSIT");
    expect(result.txRecord.amount).toBe(25000);
    expect(result.txRecord.status).toBe("SUCCESS");
  });

  test("3. Business Rule: Atomic Wallet Payment & Escrow Lock for Checkout", async () => {
    vi.spyOn(prisma.wallet, "findUnique").mockResolvedValue({
      id: "w_101",
      userId: mockUserId,
      balance: 50000.0 as any,
      escrow: 0.0 as any,
      pendingWithdrawal: 0.0 as any,
      frozen: 0.0 as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.spyOn(prisma, "$transaction").mockResolvedValue([
      { id: "w_101", userId: mockUserId, balance: 35000.0 as any, escrow: 15000.0 as any },
      {
        id: "tx_lock",
        walletId: "w_101",
        type: "ESCROW_LOCK",
        amount: 15000 as any,
        reference: "PAY-LOCK-1",
        description: "Escrow payment locked",
        status: "SUCCESS",
        createdAt: new Date(),
      },
    ]);

    const result = await WalletService.executeWalletPayment(mockUserId, 15000, "ord_test_991");

    expect(result.txRecord.type).toBe("ESCROW_LOCK");
    expect(result.txRecord.amount).toBe(15000);
  });

  test("4. Business Rule: Insufficient Funds Rejection on Withdrawal", async () => {
    vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
      id: mockUserId,
      isActive: true,
    } as any);

    vi.spyOn(prisma.wallet, "findUnique").mockResolvedValue({
      id: "w_101",
      userId: mockUserId,
      balance: 5000.0 as any,
      escrow: 0.0 as any,
      pendingWithdrawal: 0.0 as any,
      frozen: 0.0 as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      WalletService.executeWithdrawal(mockUserId, 10000, "bank_1")
    ).rejects.toThrow("INSUFFICIENT_FUNDS");
  });

  test("5. Business Rule: Suspended User Account Withdrawal Block", async () => {
    vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
      id: mockUserId,
      isActive: false, // Suspended user
    } as any);

    await expect(
      WalletService.executeWithdrawal(mockUserId, 5000, "bank_1")
    ).rejects.toThrow("ACCOUNT_FROZEN");
  });

  test("6. Business Rule: Atomic Order Refund Credit to Buyer Wallet", async () => {
    vi.spyOn(prisma.wallet, "findUnique").mockResolvedValue({
      id: "w_101",
      userId: mockUserId,
      balance: 10000.0 as any,
      escrow: 0.0 as any,
      pendingWithdrawal: 0.0 as any,
      frozen: 0.0 as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.spyOn(prisma, "$transaction").mockResolvedValue([
      { id: "w_101", userId: mockUserId, balance: 20000.0 as any, escrow: 0.0 as any },
      {
        id: "tx_ref",
        walletId: "w_101",
        type: "REFUND",
        amount: 10000 as any,
        reference: "REF-101",
        description: "Refund credited",
        status: "SUCCESS",
        createdAt: new Date(),
      },
    ]);

    const result = await WalletService.executeRefund(mockUserId, 10000, "ord_cancelled_101");

    expect(result.txRecord.type).toBe("REFUND");
    expect(result.txRecord.amount).toBe(10000);
  });
});
