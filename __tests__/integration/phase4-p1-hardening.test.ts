import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as validateOrder } from "@/app/api/orders/validate/route";
import { PUT as reviewVerification } from "@/app/api/admin/verifications/[id]/route";
import { recordAuditEvent } from "@/lib/audit";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  recordAuditEvent: vi.fn(),
}));

vi.mock("@/lib/events", () => ({
  publishAgroEvent: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findFirst: vi.fn(),
    },
    verification: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    farmerProfile: {
      update: vi.fn(),
    },
    $transaction: vi.fn((callbackOrArray) => {
      if (Array.isArray(callbackOrArray)) {
        return Promise.all(callbackOrArray);
      }
      return callbackOrArray(prisma);
    }),
  },
}));

describe("Phase 4 — P1 Production Hardening Integration Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("P1-1: Pre-Checkout Order Validation Integrity", () => {
    it("should validate valid available products correctly", async () => {
      (getSession as any).mockResolvedValue({ userId: "user-1", role: "BUYER" });
      (prisma.product.findFirst as any).mockResolvedValue({
        id: "prod-100",
        name: "Premium Cassava Tuber",
        price: 2500,
        isAvailable: true,
        inventory: { availableQty: 50 },
      });

      const req = new Request("http://localhost:3000/api/orders/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: "prod-100", quantity: 2 }],
        }),
      });

      const res = await validateOrder(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.isValid).toBe(true);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].productName).toBe("Premium Cassava Tuber");
      expect(data.items[0].subtotal).toBe(5000);
      expect(data.errors).toHaveLength(0);
    });

    it("should fail validation for nonexistent productId without fallback or fabrication", async () => {
      (getSession as any).mockResolvedValue({ userId: "user-1", role: "BUYER" });
      (prisma.product.findFirst as any).mockResolvedValue(null);

      const req = new Request("http://localhost:3000/api/orders/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: "nonexistent-id", quantity: 1 }],
        }),
      });

      const res = await validateOrder(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.isValid).toBe(false);
      expect(data.errors).toContain('Product "nonexistent-id" was not found in the catalog.');
      expect(data.items[0].isAvailable).toBe(false);
      expect(data.items[0].productName).not.toBe("Agro Produce Item"); // Confirm no mock fabrication
      expect(data.items[0].subtotal).toBe(0);
    });

    it("should fail validation for unavailable/deleted products", async () => {
      (getSession as any).mockResolvedValue({ userId: "user-1", role: "BUYER" });
      (prisma.product.findFirst as any).mockResolvedValue({
        id: "prod-200",
        name: "Delisted Cocoa Batch",
        price: 8000,
        isAvailable: false,
        inventory: { availableQty: 0 },
      });

      const req = new Request("http://localhost:3000/api/orders/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: "prod-200", quantity: 5 }],
        }),
      });

      const res = await validateOrder(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.isValid).toBe(false);
      expect(data.errors).toContain('"Delisted Cocoa Batch" is currently unavailable.');
    });
  });

  describe("P1-3: KYC Compliance Review Audit Trail", () => {
    it("should record AuditEvent on KYC approval via admin verifications route", async () => {
      (getSession as any).mockResolvedValue({
        userId: "admin-1",
        email: "admin@smarthub.com",
        role: "ADMIN",
      });

      (prisma.verification.findUnique as any).mockResolvedValue({
        id: "verif-123",
        farmerProfileId: "fp-456",
        farmerProfile: { userId: "farmer-789" },
      });

      const req = new Request("http://localhost:3000/api/admin/verifications/verif-123", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE", remarks: "Identity documents verified." }),
      });

      const res = await reviewVerification(req, { params: Promise.resolve({ id: "verif-123" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.status).toBe("APPROVED");
      expect(recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          category: "KYC",
          action: "KYC_APPROVED",
          actorId: "admin-1",
          actorEmail: "admin@smarthub.com",
          resourceId: "verif-123",
        })
      );
    });

    it("should record AuditEvent on KYC rejection with mandatory remarks", async () => {
      (getSession as any).mockResolvedValue({
        userId: "admin-1",
        email: "admin@smarthub.com",
        role: "ADMIN",
      });

      (prisma.verification.findUnique as any).mockResolvedValue({
        id: "verif-123",
        farmerProfileId: "fp-456",
        farmerProfile: { userId: "farmer-789" },
      });

      const req = new Request("http://localhost:3000/api/admin/verifications/verif-123", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REJECT", remarks: "Blurry document upload." }),
      });

      const res = await reviewVerification(req, { params: Promise.resolve({ id: "verif-123" }) });
      expect(res.status).toBe(200);

      expect(recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          category: "KYC",
          action: "KYC_REJECTED",
          severity: "WARNING",
          actorId: "admin-1",
          resourceId: "verif-123",
        })
      );
    });

    it("should deny non-admin authorization and prevent audit event creation", async () => {
      (getSession as any).mockResolvedValue({
        userId: "buyer-1",
        email: "buyer@smarthub.com",
        role: "BUYER",
      });

      const req = new Request("http://localhost:3000/api/admin/verifications/verif-123", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE" }),
      });

      const res = await reviewVerification(req, { params: Promise.resolve({ id: "verif-123" }) });
      expect(res.status).toBe(403);
      expect(recordAuditEvent).not.toHaveBeenCalled();
    });
  });
});
