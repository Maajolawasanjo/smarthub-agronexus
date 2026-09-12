/**
 * Phase 4: Checkout & Logistics Integration
 *
 * REMEDIATION NOTE (P0-4): Previously 34 tautological assertions on inline closures.
 * Replaced with real integration tests focused on checkout and settlement math.
 *
 * Coverage targets:
 *   - Order escrow release via WalletService.executeEscrowRelease
 *   - Delivery confirmation flow
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { WalletService } from "@/services/wallet.service";
import { calculateSettlement } from "@/lib/settlement";

vi.mock("@/lib/events", () => ({
  publishAgroEvent: vi.fn().mockResolvedValue(true),
}));

describe("Phase 4: Checkout & Logistics", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("CHECKOUT-01: Escrow release settlement math is correct", () => {
    it("calculateSettlement on subtotal gives correct payout — shipping is NOT commissioned", () => {
      const commoditySubtotal = 80000; // ₦80,000 commodity
      const shippingFee = 5000;        // ₦5,000 shipping (pass-through, not commissioned)
      const totalOrderAmount = commoditySubtotal + shippingFee; // ₦85,000 total

      const { netFarmerPayout, platformFee, taxAmount } = calculateSettlement(commoditySubtotal);

      // Commission is ONLY on commodity subtotal, not on total order amount
      expect(platformFee).toBeCloseTo(4000, 1);       // 5% × ₦80,000 = ₦4,000
      expect(taxAmount).toBeCloseTo(300, 1);           // 7.5% × ₦4,000 = ₦300
      expect(netFarmerPayout).toBeCloseTo(75700, 1);  // ₦80,000 - ₦4,300 = ₦75,700

      // Shipping fee should be separate — if we wrongly used totalAmount, fee would be too high
      const wrongFee = calculateSettlement(totalOrderAmount).platformFee;
      expect(wrongFee).toBeGreaterThan(platformFee); // Wrong approach takes more from farmer
      expect(platformFee).toBeLessThan(wrongFee);    // Correct approach: lower fee
    });
  });

  describe("CHECKOUT-02: Delivery confirmation triggers escrow release", () => {
    it("WalletService.executeEscrowRelease settles SellerOrders on delivery", async () => {
      const orderId = "ord_delivery_test";
      const buyerId = "usr_buyer_delivery";
      const farmerUserId = "usr_farmer_delivery";

      const buyerWallet = { id: "w_buyer_d", userId: buyerId, balance: 0, escrow: 80000, pendingWithdrawal: 0, frozen: 0 };
      const farmerWallet = { id: "w_farmer_d", userId: farmerUserId, balance: 0, escrow: 0, pendingWithdrawal: 0, frozen: 0 };

      const walletsMap: Record<string, any> = {
        [buyerId]: buyerWallet,
        [farmerUserId]: farmerWallet,
      };

      const mockOrder = {
        id: orderId,
        orderNumber: "ORD-DELIVERY-001",
        totalAmount: 80000,
        status: "DELIVERED",
        buyer: { userId: buyerId },
        sellerOrders: [
          {
            id: "so_delivery_1",
            sellerOrderNumber: "SO-DELIVERY-001",
            farmerProfileId: "fp_delivery",
            subtotal: 75000,      // Commodity only
            shippingFee: 5000,    // Pass-through
            totalAmount: 80000,   // Full buyer-locked amount
            status: "DELIVERED",
            farmerProfile: { userId: farmerUserId, user: { fullName: "Test Farmer" } },
          },
        ],
        orderItems: [],
      };

      (vi.spyOn(prisma.wallet, "findUnique") as any).mockImplementation(async ({ where }: any) => walletsMap[where.userId] || null);
      (vi.spyOn(prisma.wallet, "create") as any).mockImplementation(async ({ data }: any) => {
        const w = { id: `w_${data.userId}`, userId: data.userId, balance: 0, escrow: 0, pendingWithdrawal: 0, frozen: 0 };
        walletsMap[data.userId] = w;
        return w;
      });
      vi.spyOn(prisma.order, "findUnique").mockResolvedValue(mockOrder as any);
      (vi.spyOn(prisma.wallet, "update") as any).mockImplementation(async ({ where, data }: any) => {
        const w = Object.values(walletsMap).find((wal: any) => wal.id === where.id || wal.userId === where.userId);
        if (w) {
          if (data.balance?.increment) (w as any).balance += data.balance.increment;
          if (data.escrow?.decrement) (w as any).escrow = Math.max(0, (w as any).escrow - data.escrow.decrement);
        }
        return w;
      });
      vi.spyOn(prisma.sellerOrder, "update").mockResolvedValue({ id: "so_updated" } as any);
      vi.spyOn(prisma.order, "update").mockResolvedValue({ id: orderId } as any);
      (vi.spyOn(prisma.walletTransaction, "create") as any).mockResolvedValue({ id: "tx_ok" } as any);
      vi.spyOn(prisma, "$transaction").mockImplementation(async (arg: any) => {
        if (Array.isArray(arg)) return Promise.all(arg);
        return arg({});
      });

      const result = await WalletService.executeEscrowRelease(orderId);

      expect(result.success).toBe(true);
      expect(result.settledSellerOrdersCount).toBe(1);
      // Commission is on subtotal (₦75,000): net = ₦75,000 × 0.94625 = ₦70,968.75
      expect(farmerWallet.balance).toBeCloseTo(70968.75, 1);
      // Buyer escrow fully drained (₦80,000 total released)
      expect(buyerWallet.escrow).toBe(0);
    });
  });
});
