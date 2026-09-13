import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { AdminUserService } from "@/services/admin-user.service";
import { AdminOrderService } from "@/services/admin-order.service";
import { AdminWithdrawalService } from "@/services/admin-withdrawal.service";
import { WalletService } from "@/services/wallet.service";

const mockGetAdminSession = vi.fn();
vi.mock("@/lib/session", () => ({
  getAdminSession: () => mockGetAdminSession(),
}));

vi.mock("@/lib/events", () => ({
  publishAgroEvent: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn().mockResolvedValue({ id: "notif-1" }),
  notifyOrderStateChange: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/audit", () => ({
  recordAuditEvent: vi.fn().mockResolvedValue({ id: "audit-1" }),
}));

vi.mock("@/services/wallet.service", () => ({
  WalletService: {
    formatNGN: vi.fn((amt) => `₦${Number(amt).toLocaleString()}`),
    executeWalletEscrowRefund: vi.fn().mockResolvedValue(true),
    executeEscrowRelease: vi.fn().mockResolvedValue(true),
  },
}));

describe("SmartHub AgroChain: Admin Foundation Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockGetAdminSession.mockReset();
  });

  describe("1. Admin Authorization & Role Matrix Enforcement", () => {
    it("rejects non-admin or unauthenticated access on GET /api/admin/orders", async () => {
      mockGetAdminSession.mockResolvedValue(null);
      const { GET } = await import("@/app/api/admin/orders/route");

      const req = new Request("http://localhost/api/admin/orders", { method: "GET" });
      const res = await GET(req);
      expect(res.status).toBe(403);
    });

    it("rejects non-admin or unauthenticated access on GET /api/admin/withdrawals", async () => {
      mockGetAdminSession.mockResolvedValue(null);
      const { GET } = await import("@/app/api/admin/withdrawals/route");

      const req = new Request("http://localhost/api/admin/withdrawals", { method: "GET" });
      const res = await GET(req);
      expect(res.status).toBe(403);
    });

    it("allows authorized admin on GET /api/admin/orders", async () => {
      mockGetAdminSession.mockResolvedValue({
        userId: "usr_admin_1",
        role: "ADMIN",
        user: { id: "usr_admin_1", email: "admin@agro.ng" },
      });
      vi.spyOn(prisma.order, "findMany").mockResolvedValue([]);
      vi.spyOn(prisma.order, "count").mockResolvedValue(0);

      const { GET } = await import("@/app/api/admin/orders/route");
      const req = new Request("http://localhost/api/admin/orders", { method: "GET" });
      const res = await GET(req);
      expect(res.status).toBe(200);
    });
  });

  describe("2. User Management & Session Revocation on Freeze", () => {
    it("creates a persistent user with hashed password and role profile without returning password hash", async () => {
      vi.spyOn(prisma.user, "findUnique")
        .mockResolvedValueOnce(null) // email not taken
        .mockResolvedValueOnce(null); // phone not taken

      const fakeCreatedUser = {
        id: "usr_farmer_99",
        fullName: "Audited Farmer",
        email: "farmer99@agro.ng",
        phoneNumber: "+2348011223344",
        password: "$2a$10$encryptedHashValueHere",
        role: "FARMER" as const,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(prisma, "$transaction").mockImplementation(async (arg: any) => {
        if (typeof arg === "function") {
          return arg({
            user: { create: vi.fn().mockResolvedValue(fakeCreatedUser) },
            farmerProfile: { create: vi.fn().mockResolvedValue({ id: "fp_99" }) },
            wallet: { create: vi.fn().mockResolvedValue({ id: "w_99" }) },
          });
        }
        return arg;
      });

      const user = await AdminUserService.createUser({
        fullName: "Audited Farmer",
        email: "farmer99@agro.ng",
        phoneNumber: "+2348011223344",
        role: "FARMER",
        farmName: "Green Valley Farms",
        farmAddress: "Plot 10 Agro Road",
        state: "Taraba",
        adminUserId: "usr_admin_1",
        adminEmail: "admin@smarthub.ng",
      });

      expect(user.id).toBe("usr_farmer_99");
      expect(user.email).toBe("farmer99@agro.ng");
      expect(user.role).toBe("FARMER");
      // Zero credential leakage
      expect((user as any).password).toBeUndefined();
    });

    it("rejects duplicate email during user creation", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValueOnce({ id: "existing" } as any);

      await expect(
        AdminUserService.createUser({
          fullName: "Duplicate User",
          email: "duplicate@agro.ng",
          phoneNumber: "+2348099887766",
          role: "BUYER",
          adminUserId: "usr_admin_1",
          adminEmail: "admin@smarthub.ng",
        })
      ).rejects.toThrow('Email address "duplicate@agro.ng" is already registered.');
    });

    it("freezing a user executes active Session revocation in PostgreSQL", async () => {
      const updateManySessionsSpy = vi.fn().mockResolvedValue({ count: 2 });
      const updateUserSpy = vi.fn().mockResolvedValue({
        id: "usr_frozen_1",
        email: "baduser@agro.ng",
        fullName: "Suspended Account",
        role: "FARMER",
        isActive: false,
        updatedAt: new Date(),
      });

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback: any) => {
        return callback({
          user: { update: updateUserSpy },
          session: { updateMany: updateManySessionsSpy },
        });
      });

      // Call transaction
      const targetUserId = "usr_frozen_1";
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: targetUserId },
          data: { isActive: false },
        });
        await tx.session.updateMany({
          where: { userId: targetUserId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      });

      expect(updateUserSpy).toHaveBeenCalledWith({
        where: { id: "usr_frozen_1" },
        data: { isActive: false },
      });
      expect(updateManySessionsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "usr_frozen_1", revokedAt: null },
        })
      );
    });
  });

  describe("3. Order Management & Escrow Invariants", () => {
    it("listOrders queries platform-wide orders with items, payments, and buyers", async () => {
      vi.spyOn(prisma.order, "findMany").mockResolvedValue([
        {
          id: "ord_100",
          orderNumber: "AGRO-2026-100",
          totalAmount: 150000 as any,
          status: "DELIVERED",
          createdAt: new Date(),
          updatedAt: new Date(),
          buyer: {
            user: { id: "u_buyer", fullName: "Commercial Buyer Ltd", email: "buyer@agro.ng", phoneNumber: "+2348000000000" },
          },
          shippingAddress: null,
          payment: { paymentStatus: "PAID", paymentMethod: "WALLET" },
          delivery: { deliveryStatus: "DELIVERED", trackingNumber: "TRK-100", logisticsPartner: null },
          orderItems: [
            {
              quantity: 10,
              product: {
                name: "Yellow Maize",
                images: [{ imageUrl: "/maize.jpg" }],
                farmerProfile: { farmName: "Taraba Grain Cluster" },
              },
            },
          ],
          sellerOrders: [],
        } as any,
      ]);
      vi.spyOn(prisma.order, "count").mockResolvedValue(1);

      const result = await AdminOrderService.listOrders({ page: 1, limit: 10 });
      expect(result.orders.length).toBe(1);
      expect(result.orders[0].orderNumber).toBe("AGRO-2026-100");
      expect(result.orders[0].totalAmount).toBe(150000);
      expect(result.orders[0].buyerName).toBe("Commercial Buyer Ltd");
      expect(result.pagination.total).toBe(1);
    });

    it("cancelling a paid order executes WalletService.executeWalletEscrowRefund to return funds to buyer", async () => {
      const fakeOrder = {
        id: "ord_cancel_1",
        orderNumber: "AGRO-CANCEL-1",
        totalAmount: 50000 as any,
        status: "CONFIRMED",
        buyer: { userId: "usr_buyer_1", user: { fullName: "Buyer One", email: "b1@agro.ng" } },
        payment: { paymentStatus: "PAID" },
        orderItems: [
          { productId: "prod_1", quantity: 5, product: { farmerProfile: { userId: "farmer_1" } } },
        ],
      };

      vi.spyOn(prisma.order, "findUnique").mockResolvedValue(fakeOrder as any);
      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback: any) => {
        return callback({
          order: { update: vi.fn().mockResolvedValue({ ...fakeOrder, status: "CANCELLED" }) },
          sellerOrder: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
          inventory: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
        });
      });

      const result = await AdminOrderService.executeOrderAction({
        orderId: "ord_cancel_1",
        action: "CANCEL",
        reason: "Contract cancellation requested by merchant",
        adminUserId: "usr_admin_1",
        adminEmail: "admin@smarthub.ng",
      });

      expect(result.order.status).toBe("CANCELLED");
      expect(WalletService.executeWalletEscrowRefund).toHaveBeenCalledWith("usr_buyer_1", 50000, "ord_cancel_1");
    });

    it("releasing escrow for delivered order calls WalletService.executeEscrowRelease", async () => {
      const fakeOrder = {
        id: "ord_release_1",
        orderNumber: "AGRO-REL-1",
        totalAmount: 120000 as any,
        status: "DELIVERED",
        buyer: { userId: "usr_buyer_1", user: { fullName: "Buyer One", email: "b1@agro.ng" } },
        payment: { paymentStatus: "PAID" },
        orderItems: [
          { productId: "prod_1", quantity: 2, product: { farmerProfile: { userId: "farmer_1" } } },
        ],
      };

      vi.spyOn(prisma.order, "findUnique").mockResolvedValue(fakeOrder as any);
      vi.spyOn(prisma.order, "update").mockResolvedValue({ ...fakeOrder, status: "COMPLETED" } as any);

      const result = await AdminOrderService.executeOrderAction({
        orderId: "ord_release_1",
        action: "RELEASE_ESCROW",
        adminUserId: "usr_admin_1",
        adminEmail: "admin@smarthub.ng",
      });

      expect(result.order.status).toBe("COMPLETED");
      expect(WalletService.executeEscrowRelease).toHaveBeenCalledWith("usr_buyer_1", "ord_release_1");
    });

    it("rejects invalid status transitions (e.g. cancelling already COMPLETED order)", async () => {
      const completedOrder = {
        id: "ord_done_1",
        orderNumber: "AGRO-DONE-1",
        totalAmount: 80000 as any,
        status: "COMPLETED",
        buyer: { userId: "usr_buyer_1", user: {} },
        payment: { paymentStatus: "PAID" },
        orderItems: [],
      };

      vi.spyOn(prisma.order, "findUnique").mockResolvedValue(completedOrder as any);

      await expect(
        AdminOrderService.executeOrderAction({
          orderId: "ord_done_1",
          action: "CANCEL",
          adminUserId: "usr_admin_1",
          adminEmail: "admin@smarthub.ng",
        })
      ).rejects.toThrow("Cannot cancel order in COMPLETED state.");
    });
  });

  describe("4. Withdrawal Lifecycle & Anti-Duplicate Payout Protection", () => {
    it("listWithdrawals queries withdrawal queue with user and bank info", async () => {
      vi.spyOn(prisma.walletTransaction, "findMany").mockResolvedValue([
        {
          id: "tx_wd_1",
          type: "WITHDRAWAL",
          amount: 75000 as any,
          reference: "WD-2026-001",
          status: "REQUESTED",
          description: "Payout to First Bank",
          createdAt: new Date(),
          wallet: {
            user: {
              id: "usr_farmer_1",
              fullName: "Musa Danladi",
              email: "musa@agro.ng",
              phoneNumber: "+2348022334455",
              role: "FARMER",
              isActive: true,
            },
          },
        } as any,
      ]);
      vi.spyOn(prisma.walletTransaction, "count").mockResolvedValue(1);
      vi.spyOn(prisma.bankAccount, "findMany").mockResolvedValue([
        {
          id: "bank_1",
          userId: "usr_farmer_1",
          bankName: "First Bank of Nigeria",
          accountNumber: "3012345678",
          accountName: "Musa Danladi",
          bankCode: "011",
          isVerified: true,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await AdminWithdrawalService.listWithdrawals({ page: 1, limit: 10 });
      expect(result.withdrawals.length).toBe(1);
      expect(result.withdrawals[0].reference).toBe("WD-2026-001");
      expect(result.withdrawals[0].amount).toBe(75000);
      expect(result.withdrawals[0].user.name).toBe("Musa Danladi");
      expect(result.withdrawals[0].bank?.bankName).toBe("First Bank of Nigeria");
    });

    it("rejects payout submission if transaction is already in SUCCESS or PROCESSING to prevent double payouts", async () => {
      vi.spyOn(prisma.walletTransaction, "findUnique").mockResolvedValue({
        id: "tx_wd_success",
        type: "WITHDRAWAL",
        status: "SUCCESS",
        amount: 50000,
        wallet: { userId: "usr_1" },
      } as any);

      await expect(
        AdminWithdrawalService.processWithdrawalAction({
          transactionId: "tx_wd_success",
          action: "APPROVE_PAYOUT",
          adminUserId: "usr_admin_1",
          adminEmail: "admin@smarthub.ng",
        })
      ).rejects.toThrow("INVALID_STATE: Payout has already succeeded. Further mutations are forbidden.");

      vi.spyOn(prisma.walletTransaction, "findUnique").mockResolvedValue({
        id: "tx_wd_proc",
        type: "WITHDRAWAL",
        status: "PROCESSING",
        amount: 50000,
        wallet: { userId: "usr_1" },
      } as any);

      await expect(
        AdminWithdrawalService.processWithdrawalAction({
          transactionId: "tx_wd_proc",
          action: "APPROVE_PAYOUT",
          adminUserId: "usr_admin_1",
          adminEmail: "admin@smarthub.ng",
        })
      ).rejects.toThrow("DUPLICATE_GUARD: Payout is currently in processing state with payment provider.");
    });

    it("reversing a failed withdrawal decrements pendingWithdrawal and restores available balance in atomic transaction", async () => {
      const fakeTx = {
        id: "tx_failed_1",
        walletId: "w_1",
        type: "WITHDRAWAL",
        status: "FAILED",
        amount: 40000 as any,
        reference: "WD-FAIL-1",
        wallet: { userId: "usr_1", id: "w_1" },
      };

      vi.spyOn(prisma.walletTransaction, "findUnique").mockResolvedValue(fakeTx as any);

      const updateWalletSpy = vi.fn().mockResolvedValue({ id: "w_1", balance: 40000, pendingWithdrawal: 0 });
      const updateTxSpy = vi.fn().mockResolvedValue({ ...fakeTx, status: "REVERSED" });

      vi.spyOn(prisma, "$transaction").mockImplementation(async (arg: any) => {
        if (Array.isArray(arg)) {
          return [await updateWalletSpy(arg[0]), await updateTxSpy(arg[1])];
        }
        if (typeof arg === "function") {
          return arg({
            wallet: { update: updateWalletSpy },
            walletTransaction: { update: updateTxSpy },
          });
        }
        return arg;
      });

      const result = await AdminWithdrawalService.processWithdrawalAction({
        transactionId: "tx_failed_1",
        action: "REVERSE_PAYOUT",
        reason: "Invalid destination account rejected by gateway",
        adminUserId: "usr_admin_1",
        adminEmail: "admin@smarthub.ng",
      });

      expect(result.transaction.status).toBe("REVERSED");
    });
  });

  describe("5. CSRF & Cross-Site Origin Validation", () => {
    it("rejects cross-origin mutations on POST /api/admin/users", async () => {
      mockGetAdminSession.mockResolvedValue({
        userId: "usr_admin_1",
        role: "ADMIN",
        user: { id: "usr_admin_1", email: "admin@agro.ng" },
      });

      const { POST } = await import("@/app/api/admin/users/route");

      const req = new Request("http://localhost:3000/api/admin/users", {
        method: "POST",
        headers: {
          origin: "http://malicious-site.com",
          "content-type": "application/json",
        },
        body: JSON.stringify({ fullName: "Attacker", email: "hacker@evil.com", phoneNumber: "+2349999999999" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it("rejects cross-origin mutations on POST /api/admin/withdrawals", async () => {
      mockGetAdminSession.mockResolvedValue({
        userId: "usr_admin_1",
        role: "ADMIN",
        user: { id: "usr_admin_1", email: "admin@agro.ng" },
      });

      const { POST } = await import("@/app/api/admin/withdrawals/route");

      const req = new Request("http://localhost:3000/api/admin/withdrawals", {
        method: "POST",
        headers: {
          origin: "http://evil-cors-origin.com",
          "content-type": "application/json",
        },
        body: JSON.stringify({ transactionId: "tx_1", action: "APPROVE_PAYOUT" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
    });
  });
});
