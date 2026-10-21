import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  findUser: vi.fn(),
  transaction: vi.fn(),
  changePassword: vi.fn(),
  revokeSessions: vi.fn(),
  compare: vi.fn(),
  hash: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSession: mocks.getSession,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mocks.findUser },
    $transaction: mocks.transaction,
  },
}));
vi.mock("bcrypt", () => ({
  default: { compare: mocks.compare, hash: mocks.hash },
}));

import { POST as changePassword } from "@/app/api/user/password/route";

const origin = "https://www.smarthubagrochain.online";
const body = { currentPassword: "valid-current-password", newPassword: "a-better-new-password" };
const request = (options?: {
  origin?: string;
  userIdCookie?: string;
  body?: Record<string, unknown>;
}) => new Request(`${origin}/api/user/password`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(options?.origin !== undefined ? { Origin: options.origin } : {}),
    ...(options?.userIdCookie ? { Cookie: `userId=${options.userIdCookie}` } : {}),
  },
  body: JSON.stringify(options?.body ?? body),
});

function noWrites() {
  expect(mocks.transaction).not.toHaveBeenCalled();
  expect(mocks.changePassword).not.toHaveBeenCalled();
  expect(mocks.revokeSessions).not.toHaveBeenCalled();
}

describe("P0-C2 password security: session identity, bcrypt and revocation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("APP_ORIGIN", undefined);
    vi.stubEnv("NEXT_PUBLIC_APP_URL", undefined);
    mocks.getSession.mockResolvedValue({ userId: "real_user_1", role: "BUYER" });
    mocks.findUser.mockResolvedValue({
      id: "real_user_1",
      isActive: true,
      password: "$2b$12$test-hashed-password",
    });
    mocks.compare.mockResolvedValue(true);
    mocks.hash.mockResolvedValue("$2b$12$replacement-hash");
    mocks.changePassword.mockResolvedValue({ count: 1 });
    mocks.revokeSessions.mockResolvedValue({ count: 3 });
    mocks.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        user: { updateMany: mocks.changePassword },
        session: { updateMany: mocks.revokeSessions },
      })
    );
  });

  afterEach(() => vi.unstubAllEnvs());

  it("denies a request without a revocable database session even with a forged userId cookie", async () => {
    mocks.getSession.mockResolvedValue(null);
    const res = await changePassword(request({ origin, userIdCookie: "victim_user_2" }));
    expect(res.status).toBe(401);
    expect(mocks.findUser).not.toHaveBeenCalled();
    noWrites();
  });

  it("never falls back to a demo user or trusts a forged userId cookie", async () => {
    const res = await changePassword(request({ origin, userIdCookie: "victim_user_2" }));
    expect(res.status).toBe(200);
    expect(mocks.findUser).toHaveBeenCalledWith({
      where: { id: "real_user_1" },
      select: { id: true, password: true, isActive: true },
    });
    expect(mocks.changePassword).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "real_user_1", isActive: true, password: "$2b$12$test-hashed-password" },
    }));
  });

  it("rejects authenticated cross-site password changes without hashing or writing", async () => {
    const res = await changePassword(request({ origin: "https://evil.example" }));
    expect(res.status).toBe(403);
    expect(mocks.findUser).not.toHaveBeenCalled();
    noWrites();
  });

  it("rejects origin-less cookie-authenticated password changes", async () => {
    const res = await changePassword(request());
    expect(res.status).toBe(403);
    noWrites();
  });

  it("does not update password when bcrypt verification fails", async () => {
    mocks.compare.mockResolvedValue(false);
    const res = await changePassword(request({ origin }));
    expect(res.status).toBe(401);
    expect(mocks.compare).toHaveBeenCalledWith(body.currentPassword, "$2b$12$test-hashed-password");
    noWrites();
  });

  it("enforces bcrypt's 72-byte limit and rejects reused passwords", async () => {
    const res = await changePassword(request({ origin, body: { ...body, newPassword: "X".repeat(73) } }));
    expect(res.status).toBe(400);
    const same = await changePassword(request({ origin, body: { ...body, newPassword: body.currentPassword } }));
    expect(same.status).toBe(400);
    noWrites();
  });

  it("hashes the new password with bcrypt cost 12 and atomically revokes sessions", async () => {
    const res = await changePassword(request({ origin }));
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(JSON.stringify(payload)).toContain("requiresReauthentication");
    expect(mocks.hash).toHaveBeenCalledWith(body.newPassword, 12);
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.changePassword).toHaveBeenCalledWith(expect.objectContaining({
      data: { password: "$2b$12$replacement-hash" },
    }));
    expect(mocks.revokeSessions).toHaveBeenCalledWith({
      where: { userId: "real_user_1", revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it("does not revoke sessions or return success for a concurrent password change", async () => {
    mocks.changePassword.mockResolvedValue({ count: 0 });
    const res = await changePassword(request({ origin }));
    expect(res.status).toBe(500);
    expect(mocks.revokeSessions).not.toHaveBeenCalled();
  });
});
