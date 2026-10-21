import { describe, it, expect, vi, beforeEach } from "vitest";
import { WalletService } from "@/services/wallet.service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/events", () => ({
  publishAgroEvent: vi.fn().mockResolvedValue(true),
}));

describe("P0 Forensic Remediation: Multi-Vendor Settlement & Financial Invariants", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Invariant 1: Multi-Vendor SellerOrder Escrow Distribution", () => {
    it("Settles multi-vendor order: commission on commodity subtotal only, full totalAmount released from buyer escrow", async () => {
      const orderId = "ord_multi_vendor_99";
      const buyerId = "usr_buyer_100";
      const farmerAUserId = "usr_farmer_A";
      const farmerBUserId = "usr_farmer_B";

      // Buyer wallet with ₦100,000 locked in escrow (subtotal + shipping combined)
      const buyerWallet = {
        id: "w_buyer",
        userId: buyerId,
        balance: 50000.0,
        escrow: 100000.0,
        pendingWithdrawal: 0,
        frozen: 0,
      };

      // Farmer A wallet (starts with ₦10,000)
      const farmerAWallet = {
        id: "w_farmer_A",
        userId: farmerAUserId,
        balance: 10000.0,
        escrow: 0,
        pendingWithdrawal: 0,
        frozen: 0,
      };

      // Farmer B wallet (starts with ₦20,000)
      const farmerBWallet = {
        id: "w_farmer_B",
        userId: farmerBUserId,
        balance: 20000.0,
        escrow: 0,
        pendingWithdrawal: 0,
        frozen: 0,
      };

      const walletsMap: Record<string, any> = {
        [buyerId]: buyerWallet,
        [farmerAUserId]: farmerAWallet,
        [farmerBUserId]: farmerBWallet,
      };

      const mockOrder = {
        id: orderId,
        orderNumber: "ORD-MV-001",
        totalAmount: 100000.0,
        status: "DELIVERED",
        buyer: { userId: buyerId },
        payment: {
          id: "pay-mv-001",
          paymentMethod: "CARD",
          paymentStatus: "PAID",
          transactionRef: "TX-MV-001",
          amount: 100000.0,
        },
        disputes: [],
        orderItems: [],
        sellerOrders: [
          {
            id: "so_A",
            sellerOrderNumber: "SO-MV-001-A",
            farmerProfileId: "fp_A",
            subtotal: 38000.0,      // Commodity value only — used for commission
            shippingFee: 2000.0,    // Pass-through logistics cost
            totalAmount: 40000.0,   // subtotal + shippingFee — used to drain buyer escrow
            status: "DELIVERED",
            farmerProfile: {
              userId: farmerAUserId,
              user: { fullName: "Farmer Alice" },
            },
          },
          {
            id: "so_B",
            sellerOrderNumber: "SO-MV-001-B",
            farmerProfileId: "fp_B",
            subtotal: 57000.0,      // Commodity value only — used for commission
            shippingFee: 3000.0,    // Pass-through logistics cost
            totalAmount: 60000.0,   // subtotal + shippingFee — used to drain buyer escrow
            status: "DELIVERED",
            farmerProfile: {
              userId: farmerBUserId,
              user: { fullName: "Farmer Bob" },
            },
          },
        ],
      };

      // Mock prisma lookups for wallets and order
      (vi.spyOn(prisma.wallet, "findUnique") as any).mockImplementation(async ({ where }: any) => {
        return walletsMap[where.userId] || null;
      });
      (vi.spyOn(prisma.wallet, "create") as any).mockImplementation(async ({ data }: any) => {
        const w = { id: `w_${data.userId}`, userId: data.userId, balance: 0, escrow: 0, pendingWithdrawal: 0, frozen: 0 };
        walletsMap[data.userId] = w;
        return w as any;
      });
      vi.spyOn(prisma.order, "findUnique").mockResolvedValue(mockOrder as any);
      vi.spyOn(prisma.walletTransaction, "findUnique").mockResolvedValue({
        id: "tx-lock-mv",
        walletId: buyerWallet.id,
        wallet: buyerWallet,
        type: "ESCROW_LOCK",
        amount: 100000.0,
        reference: "TX-MV-001",
        status: "SUCCESS",
      } as any);

      const createdTransactions: any[] = [];
      const txWalletUpdate = vi.fn(async ({ where, data }: any) => {
        const w = Object.values(walletsMap).find((wallet: any) => wallet.id === where.id);
        if (w && data.balance?.increment) w.balance += Number(data.balance.increment);
        if (w && data.balance?.decrement) w.balance -= Number(data.balance.decrement);
        return w as any;
      });
      const txWalletUpdateMany = vi.fn(async ({ where, data }: any) => {
        const w = Object.values(walletsMap).find((wallet: any) => wallet.id === where.id);
        if (!w || Number(w.escrow) < Number(where.escrow?.gte ?? 0)) return { count: 0 };
        if (data.escrow?.decrement) w.escrow -= Number(data.escrow.decrement);
        return { count: 1 };
      });
      const txWalletTransactionCreate = vi.fn(async ({ data }: any) => {
        createdTransactions.push(data);
        return { id: `tx_${createdTransactions.length}`, ...data } as any;
      });
      const txSellerOrderUpdateMany = vi.fn(async ({ where, data }: any) => {
        const sellerOrder = mockOrder.sellerOrders.find((so: any) => so.id === where.id);
        if (!sellerOrder || sellerOrder.status !== where.status) return { count: 0 };
        Object.assign(sellerOrder, data);
        return { count: 1 };
      });
      const txMock = {
        wallet: { update: txWalletUpdate, updateMany: txWalletUpdateMany },
        walletTransaction: { create: txWalletTransactionCreate },
        sellerOrder: { updateMany: txSellerOrderUpdateMany },
      };

      vi.spyOn(prisma.sellerOrder, "count").mockResolvedValue(0 as any);
      vi.spyOn(prisma.order, "updateMany").mockResolvedValue({ count: 1 } as any);
      vi.spyOn(prisma, "$transaction").mockImplementation(async (arg: any) => {
        if (Array.isArray(arg)) return Promise.all(arg);
        return arg(txMock);
      });

      // Execute Escrow Release
      const result = await WalletService.executeEscrowRelease(orderId);

      expect(result.success).toBe(true);
      // totalGrossSettled = sum of subtotals (commissionable gross): ₦38,000 + ₦57,000 = ₦95,000
      expect(result.totalGrossSettled).toBe(95000.0);
      expect(result.settledSellerOrdersCount).toBe(2);
      expect(result.totalEscrowReleased).toBe(100000.0);

      // The ledger records both farmer credits and the buyer-side gross escrow debits.
      expect(createdTransactions).toHaveLength(4);
      const farmerCredits = createdTransactions.filter((tx) => tx.reference.startsWith("REL-"));
      const buyerDebits = createdTransactions.filter((tx) => tx.reference.startsWith("ESCROW-DRAIN-"));
      expect(farmerCredits).toHaveLength(2);
      expect(buyerDebits).toHaveLength(2);
      expect(farmerCredits[0].amount).toBeCloseTo(35957.5, 1);
      expect(farmerCredits[1].amount).toBeCloseTo(53936.25, 1);
      expect(buyerDebits.reduce((sum, tx) => sum + tx.amount, 0)).toBe(100000.0);

      // Wallet balances verification:
      // Farmer A: ₦10,000 + ₦35,957.50 = ₦45,957.50
      expect(farmerAWallet.balance).toBeCloseTo(45957.5, 1);
      // Farmer B: ₦20,000 + ₦53,936.25 = ₦73,936.25
      expect(farmerBWallet.balance).toBeCloseTo(73936.25, 1);
      // Buyer escrow: ₦100,000 - ₦100,000 (totalEscrowToRelease = ₦40,000 + ₦60,000) = ₦0
      expect(buyerWallet.escrow).toBe(0.0);
    });
  });

  describe("Invariant 2: Card Refund Never Mints Internal Wallet Balance", () => {
    it("throws CARD_REFUND_FAILED and persists REQUIRES_MANUAL_REVIEW when gateway not configured", async () => {
      const buyerId = "usr_card_buyer_55";
      const orderId = "ord_card_checkout_55";

      // Buyer wallet — initial state must not change after failed card refund
      const buyerWallet = {
        id: "w_card_buyer",
        userId: buyerId,
        balance: 5000.0,
        escrow: 0.0,
        pendingWithdrawal: 0,
        frozen: 0,
      };

      vi.spyOn(prisma.order, "findUnique").mockResolvedValue({
        id: orderId,
        totalAmount: 75000,
        buyer: { userId: buyerId },
        payment: {
          id: "pay-card-55",
          paymentMethod: "CARD",
          paymentStatus: "PAID",
          transactionRef: "TX-REF-75000",
          gatewayTransactionId: null,
          amount: 75000,
        },
      } as any);
      vi.spyOn(prisma.walletTransaction, "findUnique").mockResolvedValue(null as any);
      vi.spyOn(prisma.wallet, "findUnique").mockResolvedValue(buyerWallet as any);
      (vi.spyOn(prisma.wallet, "update") as any).mockImplementation(async ({ data }: any) => {
        // Track any balance increments — these must NOT happen on failed card refund
        if (data.balance?.increment) buyerWallet.balance += data.balance.increment;
        if (data.escrow?.decrement) buyerWallet.escrow = Math.max(0, buyerWallet.escrow - data.escrow.decrement);
        return buyerWallet as any;
      });
      const createdFlagEntry: any[] = [];
      (vi.spyOn(prisma.walletTransaction, "create") as any).mockImplementation(async ({ data }: any) => {
        createdFlagEntry.push(data);
        return { id: "tx_mock_flag", ...data };
      });

      // FLUTTERWAVE_SECRET_KEY not set in test env — expect function to throw
      delete (process.env as any).FLUTTERWAVE_SECRET_KEY;

      await expect(
        WalletService.executeGatewayCardRefund(buyerId, orderId, "TX-REF-75000", 75000)
      ).rejects.toThrow("CARD_REFUND_FAILED");

      // CRITICAL: Buyer wallet balance must NOT have increased
      expect(buyerWallet.balance).toBe(5000.0);
      expect(buyerWallet.escrow).toBe(0.0);

      // A REQUIRES_MANUAL_REVIEW ledger entry must have been persisted
      expect(createdFlagEntry.length).toBeGreaterThan(0);
      const flagEntry = createdFlagEntry[0];
      expect(flagEntry.status).toBe("FAILED");
      expect(flagEntry.description).toContain("REQUIRES_MANUAL_REVIEW");
    });

    it("rejects an escrow refund larger than the order's actual locked escrow without crediting balance", async () => {
      const buyerId = "usr_wallet_buyer_66";
      const orderId = "ord_wallet_66";

      const buyerWallet = {
        id: "w_wallet_buyer",
        userId: buyerId,
        balance: 10000.0,
        escrow: 20000.0,
        pendingWithdrawal: 0,
        frozen: 0,
      };

      vi.spyOn(prisma.order, "findUnique").mockResolvedValue({
        id: orderId,
        totalAmount: 50000,
        buyer: { userId: buyerId },
        payment: {
          id: "pay-wallet-66",
          paymentMethod: "WALLET",
          paymentStatus: "PAID",
          transactionRef: "TX-WALLET-66",
          amount: 50000,
        },
      } as any);
      vi.spyOn(prisma.wallet, "findUnique").mockResolvedValue(buyerWallet as any);
      vi.spyOn(prisma.walletTransaction, "findUnique").mockImplementation(async ({ where }: any) => {
        if (where.reference === "TX-WALLET-66") {
          return {
            id: "tx-lock-66",
            walletId: buyerWallet.id,
            wallet: buyerWallet,
            type: "ESCROW_LOCK",
            amount: 50000,
            status: "SUCCESS",
            reference: "TX-WALLET-66",
          } as any;
        }
        return null as any;
      });

      const txUpdateMany = vi.fn(async () => ({ count: 0 }));
      const txMock = {
        walletTransaction: { findUnique: vi.fn().mockResolvedValue(null) },
        wallet: { updateMany: txUpdateMany },
      };
      vi.spyOn(prisma, "$transaction").mockImplementation(async (arg: any) => arg(txMock));

      await expect(
        WalletService.executeWalletEscrowRefund(buyerId, 50000, orderId)
      ).rejects.toThrow("INSUFFICIENT_ESCROW");

      expect(txUpdateMany).toHaveBeenCalledTimes(1);
      expect(buyerWallet.escrow).toBe(20000.0);
      expect(buyerWallet.balance).toBe(10000.0);
    });

  });

  describe("Invariant 3: Production Withdrawal Fails Safely without Secret Key", () => {
    it("Reverts funds and throws explicit error if FLUTTERWAVE_SECRET_KEY is missing in production", async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalKey = process.env.FLUTTERWAVE_SECRET_KEY;

      (process.env as any).NODE_ENV = "production";
      delete process.env.FLUTTERWAVE_SECRET_KEY;

      const userId = "usr_farmer_prod_withdraw";
      const userWallet = {
        id: "w_farmer_prod",
        userId,
        balance: 50000.0,
        escrow: 0,
        pendingWithdrawal: 0,
        frozen: 0,
      };

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: userId,
        isActive: true,
      } as any);

      vi.spyOn(prisma.wallet, "findUnique").mockResolvedValue(userWallet as any);
      vi.spyOn(prisma.bankAccount, "findFirst").mockResolvedValue({
        id: "bank_prod",
        bankCode: "058",
        accountNumber: "0123456789",
        accountName: "Production Farmer",
      } as any);
      vi.spyOn(prisma.walletTransaction, "update").mockResolvedValue({
        id: "tx_failed",
      } as any);

      let reverted = false;
      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback: any) => {
        if (typeof callback === "function") {
          const txMock = {
            wallet: {
              update: vi.fn(async ({ data }: any) => {
                if (data.balance?.decrement) userWallet.balance -= data.balance.decrement;
                return userWallet;
              }),
            },
            walletTransaction: {
              create: vi.fn(async () => ({ id: "tx_init" })),
            },
          };
          return callback(txMock);
        } else if (Array.isArray(callback)) {
          // Second transaction (rollback)
          userWallet.balance = 50000;
          reverted = true;
          return [userWallet, { id: "tx_failed" }];
        }
      });

      try {
        await expect(
          WalletService.executeWithdrawal(userId, 20000, "bank_prod")
        ).rejects.toThrow("GATEWAY_UNCONFIGURED");

        // Confirmed that funds were safely reverted
        expect(reverted).toBe(true);
        expect(userWallet.balance).toBe(50000.0);
      } finally {
        (process.env as any).NODE_ENV = originalEnv;
        if (originalKey) process.env.FLUTTERWAVE_SECRET_KEY = originalKey;
      }
    });
  });
});
