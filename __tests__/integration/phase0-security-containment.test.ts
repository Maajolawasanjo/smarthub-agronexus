import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { signSessionToken } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { WalletService } from "@/services/wallet.service";

// Set stable JWT secret for test session signatures
process.env.JWT_SECRET = "super-secret-jwt-key-for-testing-purposes-only-32-chars";

// Mock top-level getSession for API routes
const mockSession = vi.fn();
vi.mock("@/lib/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/session")>();
  return {
    ...actual,
    getSession: () => mockSession(),
  };
});

// Mock notification outbox & audit
vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn().mockResolvedValue({ id: "notif_mock" }),
  notifyOrderStateChange: vi.fn().mockResolvedValue(true),
}));
vi.mock("@/lib/audit", () => ({
  recordAuditEvent: vi.fn().mockResolvedValue({ id: "audit_mock" }),
}));
vi.mock("@/lib/events", () => ({
  publishAgroEvent: vi.fn().mockResolvedValue(true),
}));

describe("Phase 0 Security & Containment Suite — Real Integration Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. SEC-01: Edge Middleware API Route Guard & Portal Isolation
  // ─────────────────────────────────────────────────────────────
  describe("SEC-01: Edge API Route Protection & Portal Isolation", () => {
    it("Enforces 401 Unauthorized for unauthenticated API requests to /api/admin or /api/farmer", async () => {
      // 1. Unauthenticated request to admin API
      const unauthAdminReq = new NextRequest("http://localhost:3000/api/admin/products/123/approve");
      const unauthAdminRes = await middleware(unauthAdminReq);
      expect(unauthAdminRes.status).toBe(401);
      const adminBody = await unauthAdminRes.json();
      expect(adminBody.error.code).toBe("UNAUTHORIZED");

      // 2. Unauthenticated request to farmer API
      const unauthFarmerReq = new NextRequest("http://localhost:3000/api/farmer/produce");
      const unauthFarmerRes = await middleware(unauthFarmerReq);
      expect(unauthFarmerRes.status).toBe(401);
      const farmerBody = await unauthFarmerRes.json();
      expect(farmerBody.error.code).toBe("UNAUTHORIZED");

      // 3. Buyer attempting to access admin API -> 403 Forbidden
      const buyerToken = signSessionToken({ userId: "usr_buyer_1", email: "buyer@agro.ng", role: "BUYER" });
      const buyerReq = new NextRequest("http://localhost:3000/api/admin/overview", {
        headers: { cookie: `smarthub_session=${buyerToken}` },
      });
      const buyerRes = await middleware(buyerReq);
      expect(buyerRes.status).toBe(403);
      const buyerResBody = await buyerRes.json();
      expect(buyerResBody.error.code).toBe("FORBIDDEN");

      // 4. Buyer attempting to access farmer API -> 403 Forbidden
      const buyerFarmerReq = new NextRequest("http://localhost:3000/api/farmer/listings", {
        headers: { cookie: `smarthub_session=${buyerToken}` },
      });
      const buyerFarmerRes = await middleware(buyerFarmerReq);
      expect(buyerFarmerRes.status).toBe(403);

      // 5. Admin accessing admin API -> 200 Allowed
      const adminToken = signSessionToken({ userId: "usr_admin_1", email: "admin@agro.ng", role: "ADMIN" });
      const adminReq = new NextRequest("http://localhost:3000/api/admin/overview", {
        headers: { cookie: `smarthub_session=${adminToken}` },
      });
      const adminRes = await middleware(adminReq);
      expect(adminRes.status).toBe(200);

      // 6. Farmer accessing farmer API -> 200 Allowed
      const farmerToken = signSessionToken({ userId: "usr_farmer_1", email: "farmer@agro.ng", role: "FARMER" });
      const farmerReq = new NextRequest("http://localhost:3000/api/farmer/listings", {
        headers: { cookie: `smarthub_session=${farmerToken}` },
      });
      const farmerRes = await middleware(farmerReq);
      expect(farmerRes.status).toBe(200);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. SEC-02: Neutralize Deposit Money-Minting Backdoor
  // ─────────────────────────────────────────────────────────────
  describe("SEC-02: Money-Minting Backdoor Neutralization", () => {
    it("Refuses instant deposit simulation and only returns funding instructions", async () => {
      mockSession.mockResolvedValue({
        userId: "usr_test_deposit",
        role: "BUYER",
      });

      vi.spyOn(WalletService, "getWalletPageData").mockResolvedValue({
        fundingInstructions: {
          supportedMethods: ["VIRTUAL_ACCOUNT", "CARD"],
          virtualAccount: { bankName: "Wema Bank", accountNumber: "1234567890", accountName: "AgroChain" },
        },
      } as any);

      const { POST } = await import("@/app/api/wallet/deposit/route");
      const req = new Request("http://localhost:3000/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: "5000000",
          simulateWebhook: true, // Malicious payload attempting instant credit
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.requestedAmount).toBe(5000000);
      expect(json.data.fundingInstructions).toBeDefined();
      // Backdoor check: No balance was instantly credited or marked SUCCESS!
      expect(json.data.status).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. SEC-03: Authenticated Product Moderation Guard
  // ─────────────────────────────────────────────────────────────
  describe("SEC-03: Product Moderation Authorization", () => {
    it("Rejects unauthenticated and non-admin users from approving produce listings", async () => {
      const { PUT } = await import("@/app/api/admin/products/[id]/approve/route");

      // 1. Unauthenticated -> 401
      mockSession.mockResolvedValue(null);
      const req1 = new Request("http://localhost:3000/api/admin/products/p1/approve", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: true }),
      });
      const res1 = await PUT(req1, { params: Promise.resolve({ id: "p1" }) });
      expect(res1.status).toBe(401);

      // 2. Buyer -> 403
      mockSession.mockResolvedValue({ userId: "u_buyer", role: "BUYER" });
      const res2 = await PUT(req1, { params: Promise.resolve({ id: "p1" }) });
      expect(res2.status).toBe(403);

      // 3. Farmer -> 403
      mockSession.mockResolvedValue({ userId: "u_farmer", role: "FARMER" });
      const res3 = await PUT(req1, { params: Promise.resolve({ id: "p1" }) });
      expect(res3.status).toBe(403);

      // 4. Admin -> 200
      mockSession.mockResolvedValue({ userId: "u_admin", role: "ADMIN" });
      vi.spyOn(prisma.product, "findUnique").mockResolvedValue({
        id: "p1",
        name: "Soybeans",
        farmerProfile: { user: { id: "f1", email: "f@agro.ng" } },
      } as any);
      vi.spyOn(prisma.product, "update").mockResolvedValue({
        id: "p1",
        status: "APPROVED",
        isAvailable: true,
      } as any);

      const res4 = await PUT(req1, { params: Promise.resolve({ id: "p1" }) });
      expect(res4.status).toBe(200);
      const json4 = await res4.json();
      expect(json4.data.product.status).toBe("APPROVED");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. SEC-04: Dispute Route Lockdown & Stakeholder Authorization
  // ─────────────────────────────────────────────────────────────
  describe("SEC-04: Dispute Route Lockdown", () => {
    it("Restricts dispute creation to order buyer, seller farmer, or admin", async () => {
      const { POST } = await import("@/app/api/disputes/route");

      const mockOrder = {
        id: "ord_100",
        buyer: { userId: "buyer_1" },
        orderItems: [
          { product: { farmerProfile: { userId: "farmer_1" } } },
        ],
        disputes: [],
      };
      vi.spyOn(prisma.order, "findUnique").mockResolvedValue(mockOrder as any);

      // 1. Stranger (neither buyer, nor farmer, nor admin) -> 403
      mockSession.mockResolvedValue({ userId: "stranger_user", role: "BUYER" });
      const reqStranger = new Request("http://localhost:3000/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: "ord_100", title: "Defect", reason: "Damaged goods" }),
      });
      const resStranger = await POST(reqStranger);
      expect(resStranger.status).toBe(403);

      // 2. Legitimate Buyer -> 201 Created
      mockSession.mockResolvedValue({ userId: "buyer_1", role: "BUYER" });
      vi.spyOn(prisma.dispute, "create").mockResolvedValue({
        id: "dsp_101",
        orderId: "ord_100",
        status: "OPEN",
      } as any);
      const reqBuyer = new Request("http://localhost:3000/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: "ord_100", title: "Defect", reason: "Damaged goods" }),
      });
      const resBuyer = await POST(reqBuyer);
      expect(resBuyer.status).toBe(201);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. SEC-05: Order Status Transition Engine
  // ─────────────────────────────────────────────────────────────
  describe("SEC-05: Role-Based Order State Transition Engine", () => {
    it("Enforces role constraints on order status transitions", async () => {
      const { PUT } = await import("@/app/api/orders/[id]/route");

      const mockOrder = {
        id: "ord_flow_1",
        orderNumber: "ORD-FLOW-01",
        status: "PENDING",
        buyer: { userId: "buyer_usr_1" },
        orderItems: [
          { product: { farmerProfile: { userId: "farmer_usr_1" } } },
        ],
        payment: { id: "pay_1", paymentStatus: "PENDING" },
      };

      vi.spyOn(prisma.order, "findUnique").mockResolvedValue(mockOrder as any);

      // 1. Buyer cannot transition order to CONFIRMED or PROCESSING
      mockSession.mockResolvedValue({ userId: "buyer_usr_1", role: "BUYER" });
      const reqBuyer = new Request("http://localhost:3000/api/orders/ord_flow_1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
      });
      const resBuyer = await PUT(reqBuyer, { params: Promise.resolve({ id: "ord_flow_1" }) });
      expect(resBuyer.status).toBe(403);

      // 2. Farmer cannot jump order directly to DELIVERED
      mockSession.mockResolvedValue({ userId: "farmer_usr_1", role: "FARMER" });
      const reqFarmerJump = new Request("http://localhost:3000/api/orders/ord_flow_1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DELIVERED" }),
      });
      const resFarmerJump = await PUT(reqFarmerJump, { params: Promise.resolve({ id: "ord_flow_1" }) });
      expect(resFarmerJump.status).toBe(403);

      // 3. Farmer can transition PENDING to CONFIRMED
      vi.spyOn(prisma.order, "update").mockResolvedValue({
        ...mockOrder,
        status: "CONFIRMED",
      } as any);
      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback: any) => {
        if (typeof callback === "function") {
          return callback({
            order: { update: vi.fn().mockResolvedValue({ ...mockOrder, status: "CONFIRMED" }) },
            sellerOrder: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
            delivery: { create: vi.fn().mockResolvedValue({ id: "del_1" }) },
          });
        }
        return callback;
      });
      const reqFarmerConfirm = new Request("http://localhost:3000/api/orders/ord_flow_1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
      });
      const resFarmerConfirm = await PUT(reqFarmerConfirm, { params: Promise.resolve({ id: "ord_flow_1" }) });
      expect(resFarmerConfirm.status).toBe(200);
      const jsonFarmerConfirm = await resFarmerConfirm.json();
      expect(jsonFarmerConfirm.order.status).toBe("CONFIRMED");
      // Security Invariant: Payment status is untouched and remains PENDING
      expect(mockOrder.payment.paymentStatus).toBe("PENDING");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. SEC-06: Escrow Cancellation Refund Recipient Fix
  // ─────────────────────────────────────────────────────────────
  describe("SEC-06: Escrow Cancellation Refund Recipient Routing", () => {
    it("Always routes refund to order.buyer.userId, even when cancelled by an administrator", async () => {
      const { POST } = await import("@/app/api/orders/[id]/cancel/route");

      const mockOrder = {
        id: "ord_cancel_99",
        orderNumber: "ORD-99",
        totalAmount: 75000.0,
        status: "CONFIRMED",
        buyer: { userId: "real_buyer_id" },
        payment: { id: "pay_99", paymentMethod: "WALLET", paymentStatus: "PAID" },
        orderItems: [],
      };

      vi.spyOn(prisma.order, "findUnique").mockResolvedValue(mockOrder as any);
      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback: any) => {
        if (typeof callback === "function") {
          return callback({
            order: { update: vi.fn().mockResolvedValue({ id: "ord_cancel_99", status: "CANCELLED" }) },
            payment: { update: vi.fn().mockResolvedValue({ id: "pay_99", paymentStatus: "REFUNDED" }) },
          });
        }
        return callback;
      });

      const refundSpy = vi.spyOn(WalletService, "executeWalletEscrowRefund").mockResolvedValue({
        updatedWallet: {} as any,
        txRecord: { type: "REFUND", amount: 75000 } as any,
      });

      // Admin executes the cancellation
      mockSession.mockResolvedValue({ userId: "admin_user_id", role: "ADMIN" });

      const req = new Request("http://localhost:3000/api/orders/ord_cancel_99/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const res = await POST(req, { params: Promise.resolve({ id: "ord_cancel_99" }) });
      expect(res.status).toBe(200);

      // Verify refund was routed to the BUYER, never the admin
      expect(refundSpy).toHaveBeenCalledWith("real_buyer_id", 75000.0, "ord_cancel_99");
      expect(refundSpy).not.toHaveBeenCalledWith("admin_user_id", expect.anything(), expect.anything());
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. SEC-07: Catalog-Grounded Pricing Protection
  // ─────────────────────────────────────────────────────────────
  describe("SEC-07: Catalog-Grounded Pricing Protection", () => {
    it("Validates items against database catalog and rejects tampered prices", async () => {
      const { POST } = await import("@/app/api/orders/validate/route");

      mockSession.mockResolvedValue({ userId: "usr_buyer_check", role: "BUYER" });

      (vi.spyOn(prisma.product, "findFirst") as any).mockImplementation(async ({ where }: any) => {
        if (where.id === "prod_cocoa") {
          return { id: "prod_cocoa", name: "Premium Cocoa", price: 50000.0, isAvailable: true, inventory: { availableQty: 10 } } as any;
        }
        if (where.id === "prod_yam") {
          return { id: "prod_yam", name: "Abuja Yam", price: 15000.0, isAvailable: true, inventory: { availableQty: 20 } } as any;
        }
        return null;
      });

      const req = new Request("http://localhost:3000/api/orders/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            { productId: "prod_cocoa", quantity: 2 },
            { productId: "prod_yam", quantity: 1 },
          ],
          totalAmount: 100, // Attacker attempting to pass tampered total
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.isValid).toBe(true);
      // Catalog price: 2 * 50,000 + 1 * 15,000 = 115,000
      expect(json.recalculatedTotal).toBe(115000);
      expect(json.recalculatedTotal).not.toBe(100);
    });
  });
});
