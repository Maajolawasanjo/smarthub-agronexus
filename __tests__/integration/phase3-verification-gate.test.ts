import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as submitPOD } from "@/app/api/deliveries/[id]/pod/route";
import { GET as getAdminUsers, PATCH as updateAdminUser } from "@/app/api/admin/users/route";
import { GET as getAdminOverview } from "@/app/api/admin/overview/route";
import { GET as getAuditLogs } from "@/app/api/admin/audit-logs/route";
import { recordAuditEvent } from "@/lib/audit";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    delivery: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    order: {
      update: vi.fn(),
      count: vi.fn().mockResolvedValue(10),
      aggregate: vi.fn().mockResolvedValue({ _sum: { totalAmount: 150000 } }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn().mockResolvedValue(25),
    },
    product: {
      count: vi.fn().mockResolvedValue(50),
    },
    verification: {
      count: vi.fn().mockResolvedValue(2),
      findMany: vi.fn().mockResolvedValue([]),
    },
    dispute: {
      count: vi.fn().mockResolvedValue(1),
      findMany: vi.fn().mockResolvedValue([]),
    },
    category: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    auditEvent: {
      create: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    notificationOutbox: {
      create: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
    },
  },
  executeWithDbRetry: vi.fn((fn) => fn()),
}));

describe("Phase 3 Verification Gate — Remediation Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("DEL-001: POD Server Authorization & GPS Validation", () => {
    it("should return 401 when caller is unauthenticated", async () => {
      vi.mocked(getSession).mockResolvedValue(null as any);
      const req = new Request("http://localhost/api/deliveries/del-123/pod", {
        method: "POST",
        body: JSON.stringify({ deliveryState: "DELIVERED" }),
      });
      const res = await submitPOD(req, { params: Promise.resolve({ id: "del-123" }) });
      expect(res.status).toBe(401);
    });

    it("should return 403 when caller is an unrelated buyer", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "buyer-999",
        email: "buyer@example.com",
        role: "BUYER",
      } as any);

      vi.mocked(prisma.delivery.findUnique).mockResolvedValue({
        id: "del-123",
        logisticsPartnerId: "driver-555",
        podDriverName: "driver@example.com",
        orderId: "ord-1",
        order: { buyer: { user: { fullName: "Jane", phoneNumber: "+234", email: "j@ex.com" } } },
      } as any);

      const req = new Request("http://localhost/api/deliveries/del-123/pod", {
        method: "POST",
        body: JSON.stringify({
          deliveryState: "DELIVERED",
          driver: { fullName: "Driver Bob" },
          evidenceMedia: { deliveryPhotoUrl: "http://img.com/p.jpg", buyerSignatureUrl: "http://img.com/s.jpg" },
          gpsSnapshot: { latitude: 6.5, longitude: 3.3 },
        }),
      });

      const res = await submitPOD(req, { params: Promise.resolve({ id: "del-123" }) });
      expect(res.status).toBe(403);
    });

    it("should return 400 when GPS coordinates are missing or invalid", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "admin-1",
        email: "admin@smarthub.ng",
        role: "ADMIN",
      } as any);

      vi.mocked(prisma.delivery.findUnique).mockResolvedValue({
        id: "del-123",
        orderId: "ord-1",
        order: { buyer: { user: { fullName: "Jane", phoneNumber: "+234", email: "j@ex.com" } } },
      } as any);

      const req = new Request("http://localhost/api/deliveries/del-123/pod", {
        method: "POST",
        body: JSON.stringify({
          deliveryState: "DELIVERED",
          driver: { fullName: "Driver Bob" },
          evidenceMedia: { deliveryPhotoUrl: "http://img.com/p.jpg", buyerSignatureUrl: "http://img.com/s.jpg" },
          gpsSnapshot: { latitude: 999, longitude: 3.3 }, // Invalid latitude > 90
        }),
      });

      const res = await submitPOD(req, { params: Promise.resolve({ id: "del-123" }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("INVALID_GPS_DATA");
    });
  });

  describe("AUD-001: Persistent Audit Event Recording", () => {
    it("should write audit record directly to prisma.auditEvent on sensitive user account status action", async () => {
      vi.mocked(prisma.auditEvent.create).mockResolvedValue({
        id: "aud-1",
        category: "USER",
        severity: "WARNING",
        action: "USER_STATUS_CHANGED",
        actorId: "admin-1",
        actorEmail: "admin@smarthub.ng",
        resourceType: "User",
        resourceId: "user-44",
        createdAt: new Date(),
      } as any);

      await recordAuditEvent({
        category: "USER",
        severity: "WARNING",
        action: "USER_STATUS_CHANGED",
        actorId: "admin-1",
        actorEmail: "admin@smarthub.ng",
        resourceType: "User",
        resourceId: "user-44",
      });

      expect(prisma.auditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          category: "USER",
          severity: "WARNING",
          action: "USER_STATUS_CHANGED",
          actorId: "admin-1",
        }),
      });
    });

    it("should persist audit record for KYC review decision (KYC_APPROVED / KYC_REJECTED)", async () => {
      await recordAuditEvent({
        category: "KYC",
        severity: "INFO",
        action: "KYC_APPROVED",
        actorId: "admin-1",
        actorEmail: "admin@smarthub.ng",
        resourceId: "farmer-prof-123",
      });

      expect(prisma.auditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          category: "KYC",
          action: "KYC_APPROVED",
          resourceId: "farmer-prof-123",
        }),
      });
    });

    it("should persist audit record for dispute resolution (DISPUTE_OPENED / DISPUTE_RESOLVED)", async () => {
      await recordAuditEvent({
        category: "DISPUTE",
        severity: "WARNING",
        action: "DISPUTE_OPENED",
        actorId: "buyer-1",
        resourceId: "ord-dispute-99",
      });

      expect(prisma.auditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          category: "DISPUTE",
          action: "DISPUTE_OPENED",
          resourceId: "ord-dispute-99",
        }),
      });
    });

    it("should persist audit record for order creation (ORDER_CREATED)", async () => {
      await recordAuditEvent({
        category: "ORDER",
        severity: "INFO",
        action: "ORDER_CREATED",
        actorId: "buyer-1",
        actorEmail: "buyer@example.com",
        resourceId: "ord-new-100",
      });

      expect(prisma.auditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          category: "ORDER",
          action: "ORDER_CREATED",
          resourceId: "ord-new-100",
        }),
      });
    });

    it("should persist audit record for escrow release (ESCROW_RELEASED)", async () => {
      await recordAuditEvent({
        category: "PAYMENT",
        severity: "INFO",
        action: "ESCROW_RELEASED",
        actorId: "buyer-1",
        resourceId: "ord-new-100",
      });

      expect(prisma.auditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          category: "PAYMENT",
          action: "ESCROW_RELEASED",
          resourceId: "ord-new-100",
        }),
      });
    });

    it("should persist audit record for proof of delivery (POD_SUBMITTED)", async () => {
      await recordAuditEvent({
        category: "DELIVERY",
        severity: "INFO",
        action: "POD_SUBMITTED",
        actorId: "driver-1",
        resourceId: "del-777",
      });

      expect(prisma.auditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          category: "DELIVERY",
          action: "POD_SUBMITTED",
          resourceId: "del-777",
        }),
      });
    });
  });

  describe("ADM-001 & ADM-002: Admin API Endpoints", () => {
    it("should return users list for authorized admin", async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: "admin-1", role: "ADMIN" } as any);
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { id: "u-1", fullName: "Alice", email: "a@x.com", role: "BUYER", isActive: true, createdAt: new Date() },
      ] as any);

      const res = await getAdminUsers();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.users.length).toBe(1);
    });

    it("should return overview aggregations including salesData, categoryData, growthData", async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: "admin-1", role: "ADMIN" } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "admin-1", role: "ADMIN" } as any);

      const res = await getAdminOverview();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.statistics).toBeDefined();
      expect(json.salesData).toBeDefined();
      expect(json.categoryData).toBeDefined();
      expect(json.growthData).toBeDefined();
    });
  });
});
