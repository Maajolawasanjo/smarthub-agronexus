import { beforeEach, describe, expect, it, vi } from "vitest";

const test = vi.hoisted(() => ({
  cookieJar: new Map<string, string>(),
  findSession: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => test.cookieJar.has(name) ?
      { name, value: test.cookieJar.get(name) } : undefined,
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    session: {
      findFirst: test.findSession,
    },
  },
}));

import {
  AuthRealm,
  getSession,
  getAdminSession,
  getFarmerSession,
  getBuyerSession,
  getSharedSession,
  hashSessionSecret,
  LEGACY_SESSION_COOKIE_NAME,
  REALM_COOKIE_NAMES,
} from "@/lib/session";

describe("P0-B: revocable realm-only authorization", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    test.cookieJar.clear();
  });

  it("rejects an old JWT-only browser without consulting any database user", async () => {
    test.cookieJar.set(LEGACY_SESSION_COOKIE_NAME, "old.signed.jwt");
    expect(await getSession()).toBeNull();
    expect(await getAdminSession()).toBeNull();
    expect(test.findSession).not.toHaveBeenCalled();
  });

  it("accepts a valid active admin's registry session and never reads the JWT", async () => {
    const rawToken = "test-admin-realm-secret";
    test.cookieJar.set(REALM_COOKIE_NAMES.ADMIN, rawToken);
    test.cookieJar.set(LEGACY_SESSION_COOKIE_NAME, "stale.cookie.value");
    const expiresAt = new Date(Date.now() + 3600000);
    test.findSession.mockResolvedValue({
      id: "session_admin_1",
      userId: "admin_1",
      realm: "ADMIN",
      expiresAt,
      user: { id: "admin_1", email: "admin@example.invalid", role: "ADMIN", isActive: true },
    });

    const ctx = await getAdminSession();
    const payload = await getSession();
    expect(ctx?.userId).toBe("admin_1");
    expect(payload).toMatchObject({ userId: "admin_1", role: "ADMIN" });
    expect(test.findSession).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        realm: "ADMIN",
        tokenHash: hashSessionSecret(rawToken),
        revokedAt: null,
        expiresAt: { gt: expect.any(Date) },
      }),
      include: { user: true },
    }));
  });

  it("denies suspended users even with a valid-looking registry session", async () => {
    test.cookieJar.set(REALM_COOKIE_NAMES.FARMER, "farmer-token");
    test.findSession.mockResolvedValue({
      id: "session_farmer_1",
      userId: "farmer_1",
      realm: "FARMER",
      expiresAt: new Date(Date.now() + 10000),
      user: { id: "farmer_1", email: "farmer@example.invalid", role: "FARMER", isActive: false },
    });
    expect(await getFarmerSession()).toBeNull();
    expect(await getSession()).toBeNull();
  });

  it("denies sessions after a role change", async () => {
    test.cookieJar.set(REALM_COOKIE_NAMES.ADMIN, "formerly-admin-token");
    test.findSession.mockResolvedValue({
      id: "session_old_admin",
      userId: "user_1",
      realm: "ADMIN",
      expiresAt: new Date(Date.now() + 10000),
      user: { id: "user_1", email: "user@example.invalid", role: "BUYER", isActive: true },
    });
    expect(await getAdminSession()).toBeNull();
  });

  it("denies revoked or expired tokens when the registry returns no matching active row", async () => {
    test.cookieJar.set(REALM_COOKIE_NAMES.BUYER, "revoked-buyer-token");
    test.findSession.mockResolvedValue(null);
    expect(await getBuyerSession()).toBeNull();
    expect(await getSession()).toBeNull();
  });

  it("does not fall back to a different cookie when an invalid shared realm is supplied", async () => {
    test.cookieJar.set(REALM_COOKIE_NAMES.BUYER, "active-buyer-token");
    const req = new Request("http://localhost/api/notifications", {
      headers: { "x-auth-realm": "ADMIN" },
    });
    expect(await getSharedSession(req, [AuthRealm.BUYER, AuthRealm.FARMER])).toBeNull();
    expect(test.findSession).not.toHaveBeenCalled();
  });
});
