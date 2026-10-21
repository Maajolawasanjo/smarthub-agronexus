import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAdminSession: vi.fn(),
  farmerUpdate: vi.fn(),
  verificationFindUnique: vi.fn(),
  verificationUpdate: vi.fn(),
  transaction: vi.fn(),
  recordAuditEvent: vi.fn(),
  publishAgroEvent: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getAdminSession: mocks.getAdminSession,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    verification: {
      findUnique: mocks.verificationFindUnique,
      update: mocks.verificationUpdate,
    },
    farmerProfile: {
      update: mocks.farmerUpdate,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { security: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  recordAuditEvent: mocks.recordAuditEvent,
}));

vi.mock("@/lib/events", () => ({
  publishAgroEvent: mocks.publishAgroEvent,
}));

import { POST as deprecatedVerify } from "@/app/api/kyc/verify/route";
import { PUT as adminReview } from "@/app/api/admin/verifications/[id]/route";

const validAdmin = {
  userId: "admin_authorized_1",
  role: "ADMIN",
  user: { id: "admin_authorized_1", email: "admin@example.invalid", role: "ADMIN" },
  session: { id: "session_admin_1" },
};

const legacyRequest = () => new Request("http://localhost:3000/api/kyc/verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    farmerProfileId: "farmer_1",
    action: "APPROVE",
  }),
});

const reviewRequest = (action: string, remarks?: string) =>
  new Request("http://localhost:3000/api/admin/verifications/verification_1", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
    body: JSON.stringify({ action, remarks }),
  });

const reviewParams = { params: Promise.resolve({ id: "verification_1" }) };

function expectNoKycMutation() {
  expect(mocks.farmerUpdate).not.toHaveBeenCalled();
  expect(mocks.verificationUpdate).not.toHaveBeenCalled();
  expect(mocks.transaction).not.toHaveBeenCalled();
  expect(mocks.recordAuditEvent).not.toHaveBeenCalled();
  expect(mocks.publishAgroEvent).not.toHaveBeenCalled();
}

describe("Phase 0-A: KYC admin authorization security containment", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getAdminSession.mockResolvedValue(null);
    mocks.transaction.mockResolvedValue([]);
    mocks.recordAuditEvent.mockResolvedValue({ id: "audit_1" });
    mocks.publishAgroEvent.mockResolvedValue(undefined);
  });

  describe("retired /api/kyc/verify mutation endpoint", () => {
    it("rejects unauthenticated requests before any KYC write", async () => {
      const res = await deprecatedVerify(legacyRequest());
      expect(res.status).toBe(403);
      expectNoKycMutation();
    });

    it.each(["BUYER", "FARMER"])("rejects %s sessions", async (role) => {
      mocks.getAdminSession.mockResolvedValue({ ...validAdmin, role });
      const res = await deprecatedVerify(legacyRequest());
      expect(res.status).toBe(403);
      expectNoKycMutation();
    });

    it("returns 410 for an authorized admin instead of reopening a second write path", async () => {
      mocks.getAdminSession.mockResolvedValue(validAdmin);
      const res = await deprecatedVerify(legacyRequest());
      const data = await res.json();
      expect(res.status).toBe(410);
      expect(JSON.stringify(data)).toContain("ENDPOINT_RETIRED");
      expectNoKycMutation();
    });

    it("fails closed when administrator session verification is unavailable", async () => {
      mocks.getAdminSession.mockRejectedValue(new Error("Session database unavailable"));
      const res = await deprecatedVerify(legacyRequest());
      expect(res.status).toBe(503);
      expectNoKycMutation();
    });
  });

  describe("canonical /api/admin/verifications/[id] approval endpoint", () => {
    it("rejects an unauthenticated approval before reading or writing a record", async () => {
      const res = await adminReview(reviewRequest("APPROVE"), reviewParams);
      expect(res.status).toBe(403);
      expect(mocks.verificationFindUnique).not.toHaveBeenCalled();
      expectNoKycMutation();
    });

    it.each(["BUYER", "FARMER"])("rejects %s attempts to approve KYC", async (role) => {
      mocks.getAdminSession.mockResolvedValue({ ...validAdmin, role });
      const res = await adminReview(reviewRequest("APPROVE"), reviewParams);
      expect(res.status).toBe(403);
      expect(mocks.verificationFindUnique).not.toHaveBeenCalled();
      expectNoKycMutation();
    });

    it("rejects an invalid action with no database writes", async () => {
      mocks.getAdminSession.mockResolvedValue(validAdmin);
      const res = await adminReview(reviewRequest("SUSPEND"), reviewParams);
      expect(res.status).toBe(400);
      expectNoKycMutation();
    });

    it("requires a rejection reason before changing farmer status", async () => {
      mocks.getAdminSession.mockResolvedValue(validAdmin);
      const res = await adminReview(reviewRequest("REJECT", ""), reviewParams);
      expect(res.status).toBe(400);
      expectNoKycMutation();
    });

    it("returns not found without mutation for unknown verification IDs", async () => {
      mocks.getAdminSession.mockResolvedValue(validAdmin);
      mocks.verificationFindUnique.mockResolvedValue(null);
      const res = await adminReview(reviewRequest("APPROVE"), reviewParams);
      expect(res.status).toBe(404);
      expectNoKycMutation();
    });

    it("authorizes the real admin flow, updating reviewer and farmer status together", async () => {
      mocks.getAdminSession.mockResolvedValue(validAdmin);
      mocks.verificationFindUnique.mockResolvedValue({
        id: "verification_1",
        farmerProfileId: "farmer_1",
        farmerProfile: {
          userId: "farmer_user_1",
          user: { email: "farmer@example.invalid" },
        },
      });
      mocks.verificationUpdate.mockResolvedValue({ id: "verification_1" });
      mocks.farmerUpdate.mockResolvedValue({ id: "farmer_1", verificationStatus: "APPROVED" });

      const res = await adminReview(reviewRequest("APPROVE", "Evidence checked"), reviewParams);

      expect(res.status).toBe(200);
      expect(mocks.verificationUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "verification_1" },
          data: expect.objectContaining({
            reviewedById: "admin_authorized_1",
            remarks: "Evidence checked",
            reviewedAt: expect.any(Date),
          }),
        })
      );
      expect(mocks.farmerUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "farmer_1" },
          data: { verificationStatus: "APPROVED" },
        })
      );
      expect(mocks.transaction).toHaveBeenCalledTimes(1);
      expect(mocks.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: "admin_authorized_1",
          resourceId: "verification_1",
          action: "KYC_APPROVED",
        })
      );
      expect(mocks.publishAgroEvent).toHaveBeenCalledWith(
        "KYC_APPROVED",
        expect.objectContaining({ userId: "farmer_user_1" })
      );
    });
  });
});
