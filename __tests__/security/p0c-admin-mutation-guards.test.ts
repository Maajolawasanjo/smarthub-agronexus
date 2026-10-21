import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const test = vi.hoisted(() => ({
  admin: vi.fn(),
  findProduct: vi.fn(),
  findVerification: vi.fn(),
  transaction: vi.fn(),
  recordAudit: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getAdminSession: test.admin,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { update: vi.fn(), findMany: vi.fn() },
    product: { findUnique: test.findProduct },
    verification: { findUnique: test.findVerification },
    $transaction: test.transaction,
  },
}));

vi.mock("@/lib/audit", () => ({
  recordAuditEvent: test.recordAudit,
}));
vi.mock("@/lib/notifications", () => ({ createNotification: vi.fn() }));
vi.mock("@/lib/logger", () => ({
  logger: { security: vi.fn(), error: vi.fn() },
}));

import { PATCH as adminUserPatch, POST as adminCreateUser } from "@/app/api/admin/users/route";
import { PUT as moderateProduct, DELETE as deleteProduct } from "@/app/api/admin/products/[id]/approve/route";
import { PUT as reviewVerification } from "@/app/api/admin/verifications/[id]/route";

const admin = {
  userId: "admin_verified",
  role: "ADMIN",
  user: { email: "admin@example.invalid" },
};

function request(method: string, route: string, origin: string | null, body: object = {}) {
  return new Request(`https://www.smarthubagrochain.online${route}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(origin ? { origin } : {}),
    },
    body: JSON.stringify(body),
  });
}

const validOrigin = "https://www.smarthubagrochain.online";
const externalOrigin = "https://malicious.example";
const productParams = { params: Promise.resolve({ id: "product_one" }) };
const verificationParams = { params: Promise.resolve({ id: "verification_one" }) };

function noSideEffects() {
  expect(test.transaction).not.toHaveBeenCalled();
  expect(test.findProduct).not.toHaveBeenCalled();
  expect(test.findVerification).not.toHaveBeenCalled();
  expect(test.recordAudit).not.toHaveBeenCalled();
}

describe("P0-C admin mutations require active admin AND same-origin request", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("APP_ORIGIN", undefined);
    vi.stubEnv("NEXT_PUBLIC_APP_URL", undefined);
    vi.resetAllMocks();
    test.admin.mockResolvedValue(admin);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("denies cross-origin admin user suspension before database writes", async () => {
    const res = await adminUserPatch(request("PATCH", "/api/admin/users", externalOrigin, {
      userId: "some_user", isActive: false,
    }));
    expect(res.status).toBe(403);
    noSideEffects();
  });

  it("denies an origin-less admin user-create request", async () => {
    const res = await adminCreateUser(request("POST", "/api/admin/users", null, {
      fullName: "Test", email: "test@example.invalid", phoneNumber: "000",
    }));
    expect(res.status).toBe(403);
    noSideEffects();
  });

  it("denies cross-origin product approval before product lookup", async () => {
    const res = await moderateProduct(request("PUT", "/api/admin/products/product_one/approve",
      externalOrigin, { action: "APPROVE" }), productParams);
    expect(res.status).toBe(403);
    noSideEffects();
  });

  it("denies cross-origin product deletion before product lookup", async () => {
    const res = await deleteProduct(request("DELETE", "/api/admin/products/product_one/approve",
      externalOrigin), productParams);
    expect(res.status).toBe(403);
    noSideEffects();
  });

  it("denies cross-origin KYC approval before record lookup", async () => {
    const res = await reviewVerification(request("PUT", "/api/admin/verifications/verification_one",
      externalOrigin, { action: "APPROVE" }), verificationParams);
    expect(res.status).toBe(403);
    noSideEffects();
  });

  it("rejects an unauthenticated same-origin admin moderation request", async () => {
    test.admin.mockResolvedValue(null);
    const res = await moderateProduct(request("PUT", "/api/admin/products/product_one/approve",
      validOrigin, { action: "APPROVE" }), productParams);
    expect(res.status).toBe(401);
    noSideEffects();
  });

  it("permits a legitimate production-origin user request through CSRF and into input validation", async () => {
    const res = await adminUserPatch(request("PATCH", "/api/admin/users", validOrigin, {}));
    expect(res.status).toBe(400);
    noSideEffects();
  });

  it("permits a legitimate production-origin KYC request into input validation", async () => {
    const res = await reviewVerification(request("PUT", "/api/admin/verifications/verification_one",
      validOrigin, { action: "INVALID" }), verificationParams);
    expect(res.status).toBe(400);
    noSideEffects();
  });
});
