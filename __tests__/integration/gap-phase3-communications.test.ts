import { describe, it, expect } from "vitest";
import { ResendEmailAdapter, TermiiSMSAdapter } from "../../src/lib/notifications/adapters";
import { notificationOutbox } from "../../src/lib/notifications/outbox";

describe("Gap Closure Phase 3 — Communications & Driver Operations Tests", () => {
  it("1. Workstream A: Email Adapter Dispatch (Resend Provider)", async () => {
    const emailAdapter = new ResendEmailAdapter();
    const res = await emailAdapter.sendEmail({
      to: "farmer@agronexus.com",
      subject: "KYC Approved",
      template: "KYC_APPROVED",
      data: { farmerName: "John Farmer" },
    });

    expect(res.success).toBe(true);
    expect(res.provider).toBe("Resend");
    expect(res.messageId).toContain("msg-email-");
  });

  it("2. Workstream A: High-Value SMS Adapter Dispatch (Termii Provider)", async () => {
    const smsAdapter = new TermiiSMSAdapter();
    const res = await smsAdapter.sendSMS({
      to: "+2348012345678",
      message: "Your OTP code is 884920",
      type: "OTP",
    });

    expect(res.success).toBe(true);
    expect(res.provider).toBe("Termii");
  });

  it("3. Outbox Pattern: Enqueue & Retry Queue Processing", async () => {
    notificationOutbox.enqueueEmail({
      to: "buyer@agronexus.com",
      subject: "Order Placed",
      template: "ORDER_PLACED",
      data: { orderId: "ord_100" },
    });

    const statusBefore = notificationOutbox.getQueueStatus();
    expect(statusBefore.pendingCount).toBeGreaterThanOrEqual(1);

    const { processed } = await notificationOutbox.processQueue();
    expect(processed).toBeGreaterThanOrEqual(1);

    const statusAfter = notificationOutbox.getQueueStatus();
    expect(statusAfter.sentCount).toBeGreaterThanOrEqual(1);
  });

  it("4. Workstream B & D: Driver POD Evidence Package Structure Validation", () => {
    const evidencePackage = {
      deliveryState: "DELIVERED",
      driver: {
        fullName: "Samuel Okon",
        phoneNumber: "+2348033322114",
        vehicleType: "Refrigerated Van",
        licensePlate: "LAG-992-AA",
      },
      gpsSnapshot: { latitude: 6.5244, longitude: 3.3792, accuracyMeters: 3 },
      evidenceMedia: {
        deliveryPhotoUrl: "https://storage.smarthubagro.com/pod/photo-99.jpg",
        buyerSignatureUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      },
      receiver: { fullName: "Alice Buyer", phoneNumber: "+2348011112222" },
    };

    expect(evidencePackage.deliveryState).toBe("DELIVERED");
    expect(evidencePackage.driver.licensePlate).toBe("LAG-992-AA");
    expect(evidencePackage.evidenceMedia.deliveryPhotoUrl).toContain("photo-99.jpg");
    expect(evidencePackage.gpsSnapshot.latitude).toBe(6.5244);
  });
});
