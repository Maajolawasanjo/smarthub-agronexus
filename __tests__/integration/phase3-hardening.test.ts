import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { notificationOutbox } from "@/lib/notifications/outbox";

// Top-level session mock
const mockSession = vi.fn();
vi.mock("@/lib/session", () => ({
  getSession: () => mockSession(),
}));

describe("Phase 3 Hardening Integration Suite", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    const outboxStore: any[] = [];
    (vi.spyOn(prisma.notificationOutbox, "create") as any).mockImplementation(async ({ data }: any) => {
      const rec = { id: "outbox-" + (outboxStore.length + 1), ...data, attempts: 0, createdAt: new Date(), updatedAt: new Date(), availableAt: new Date() };
      outboxStore.push(rec);
      return rec as any;
    });
    (vi.spyOn(prisma.notificationOutbox, "findMany") as any).mockImplementation(async () => outboxStore as any);
    (vi.spyOn(prisma.notificationOutbox, "update") as any).mockImplementation(async ({ where, data }: any) => {
      const rec = outboxStore.find(r => r.id === where.id);
      if (rec) Object.assign(rec, data);
      return rec as any;
    });
  });

  describe("MKT-001: Farmer Verification Guard", () => {
    it("should reject produce creation if farmer verificationStatus is not APPROVED", async () => {
      mockSession.mockResolvedValue({
        userId: "user_unverified_farmer",
        role: "FARMER",
        email: "unverified@farm.ng",
      });

      vi.spyOn(prisma.farmerProfile, "findUnique").mockResolvedValue({
        id: "fp_unverified",
        userId: "user_unverified_farmer",
        farmName: "Pending Green Farm",
        verificationStatus: "PENDING",
        state: "Oyo",
        lga: "Ibadan North",
        user: { isActive: true },
      } as any);

      const { POST } = await import("@/app/api/farmer/produce/route");
      const req = new Request("http://localhost:3000/api/farmer/produce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Organic Cassava Tubers",
          price: 1500,
          stockQuantity: 100,
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.error).toContain("Verification required");
    });
  });

  describe("DEL-001: Proof of Delivery Persistence", () => {
    it("should update delivery status and store POD evidence fields in PostgreSQL", async () => {
      mockSession.mockResolvedValue({
        userId: "user_logistics_driver",
        role: "ADMIN",
      });

      vi.spyOn(prisma.delivery, "findUnique").mockResolvedValue({
        id: "del_123",
        orderId: "ord_123",
        deliveryStatus: "IN_TRANSIT",
        order: {
          orderNumber: "ORD-999",
          buyer: { user: { fullName: "Jane Buyer", email: "jane@buyer.com", phoneNumber: "+2348011112222" } },
        },
      } as any);

      vi.spyOn(prisma.delivery, "update").mockImplementation(((args: any) =>
        Promise.resolve({
          id: "del_123",
          ...args.data,
        })) as any);

      vi.spyOn(prisma.order, "update").mockResolvedValue({ id: "ord_123", status: "DELIVERED" } as any);
      vi.spyOn(prisma.user, "findFirst").mockResolvedValue(null);
      vi.spyOn(prisma.auditEvent, "create").mockResolvedValue({ id: "aud_mock" } as any);
      vi.spyOn(notificationOutbox, "processQueue").mockResolvedValue({ processed: 1, failures: 0 });

      const { POST } = await import("@/app/api/deliveries/[id]/pod/route");
      const req = new Request("http://localhost:3000/api/deliveries/del_123/pod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryState: "DELIVERED",
          driver: {
            fullName: "Sunday Driver",
            phoneNumber: "+2348099887766",
            vehicleType: "Cold Truck",
            licensePlate: "LAG-123-AA",
          },
          gpsSnapshot: {
            latitude: 6.5244,
            longitude: 3.3792,
            accuracyMeters: 3,
          },
          evidenceMedia: {
            deliveryPhotoUrl: "https://storage.smarthub.ng/pod/photo_123.jpg",
            buyerSignatureUrl: "https://storage.smarthub.ng/pod/sig_123.png",
          },
        }),
      });

      const paramsPromise = Promise.resolve({ id: "del_123" });
      const res = await POST(req, { params: paramsPromise });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(prisma.delivery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "del_123" },
          data: expect.objectContaining({
            deliveryStatus: "DELIVERED",
            podPhotoUrl: "https://storage.smarthub.ng/pod/photo_123.jpg",
            podSignatureUrl: "https://storage.smarthub.ng/pod/sig_123.png",
            podLatitude: 6.5244,
            podLongitude: 3.3792,
            podDriverName: "Sunday Driver",
            podLicensePlate: "LAG-123-AA",
          }),
        })
      );
    });
  });

  describe("NOT-001: Notification Persistence in Database Outbox", () => {
    it("should attempt to persist notification to Prisma when recipient user exists", async () => {
      vi.spyOn(prisma.user, "findFirst").mockResolvedValue({
        id: "user_test_recipient",
        email: "test@agro.ng",
        fullName: "Test User",
      } as any);

      vi.spyOn(prisma.notification, "create").mockResolvedValue({
        id: "notif_123",
        userId: "user_test_recipient",
        title: "Order Status Update",
        message: "Your order shipped",
        type: "SYSTEM_ALERT",
        isRead: false,
        createdAt: new Date(),
      } as any);

      // Mock the email adapter to return success
      const adapterMod = await import("@/lib/notifications/adapters");
      vi.spyOn(adapterMod.defaultEmailAdapter, "sendEmail").mockResolvedValue({
        success: true,
        messageId: "test-msg-id",
        provider: "Resend",
        timestamp: new Date().toISOString(),
      });

      // MUST await — enqueueEmail is async and writes to outboxStore
      await notificationOutbox.enqueueEmail({
        to: "test@agro.ng",
        subject: "Order Status Update",
        template: "ORDER_SHIPPED",
        data: { orderId: "123" },
      });

      const result = await notificationOutbox.processQueue();
      await new Promise((r) => setTimeout(r, 50));
      expect(result.processed).toBeGreaterThan(0);
      expect(prisma.notification.create).toHaveBeenCalled();
    });
  });
});
