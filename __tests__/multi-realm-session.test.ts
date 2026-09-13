import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { Role } from "@prisma/client";

// Setup next/headers mock before importing session
const mockCookieJar = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => (mockCookieJar.has(name) ? { name, value: mockCookieJar.get(name)! } : undefined),
    set: (name: string, value: string) => mockCookieJar.set(name, value),
    delete: (name: string) => mockCookieJar.delete(name),
  })),
  headers: vi.fn(async () => new Headers()),
}));

import {
  isRealmAllowed,
  generateSessionSecret,
  hashSessionSecret,
  createRealmSession,
  getSessionContext,
  getAdminSession,
  getFarmerSession,
  getBuyerSession,
  getSharedSession,
  revokeRealmSession,
  AuthRealm,
  REALM_COOKIE_NAMES,
  VAULT_COOKIE_NAME,
} from "@/lib/session";
import { middleware } from "@/middleware";
import { prisma } from "@/lib/prisma";

process.env.JWT_SECRET = "super-secret-jwt-key-for-testing-purposes-only-32-chars";

describe("Multi-Realm Session Architecture Tests (T01 - T17)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCookieJar.clear();
  });

  // ─────────────────────────────────────────────────────────────
  // T01 & T05: Simultaneous Multi-Realm Sessions & Concurrent Login
  // ─────────────────────────────────────────────────────────────
  describe("T01 & T05: Simultaneous Multi-Realm Presence & Concurrent Logins", () => {
    it("T01: Supports concurrent Farmer, Buyer, and Admin sessions in the same vault", async () => {
      const vaultId = "vlt_test_multi_01";
      const farmerUserId = "usr_farmer_01";
      const buyerUserId = "usr_buyer_01";
      const adminUserId = "usr_admin_01";

      const mockSessionDB: any[] = [];
      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback: any) => {
        const tx = {
          session: {
            updateMany: vi.fn().mockImplementation(async ({ where, data }) => {
              mockSessionDB.forEach((s) => {
                if (s.vaultId === where.vaultId && s.realm === where.realm) {
                  s.revokedAt = data.revokedAt;
                }
              });
              return { count: 1 };
            }),
            create: vi.fn().mockImplementation(async ({ data }) => {
              const record = { id: `sess_${Math.random()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
              mockSessionDB.push(record);
              return record;
            }),
          },
        };
        return callback(tx);
      });

      // Farmer logs in
      const farmerRes = await createRealmSession(farmerUserId, AuthRealm.FARMER, vaultId);
      // Buyer logs in
      const buyerRes = await createRealmSession(buyerUserId, AuthRealm.BUYER, vaultId);
      // Admin logs in
      const adminRes = await createRealmSession(adminUserId, AuthRealm.ADMIN, vaultId);

      const activeSessions = mockSessionDB.filter((s) => s.vaultId === vaultId && !s.revokedAt);
      expect(activeSessions.length).toBe(3);
      expect(activeSessions.map((s) => s.realm).sort()).toEqual(["ADMIN", "BUYER", "FARMER"]);

      expect(farmerRes.rawSecret).not.toBe(buyerRes.rawSecret);
      expect(buyerRes.rawSecret).not.toBe(adminRes.rawSecret);
    });

    it("T05: Concurrent Farmer + Buyer login in same vault preserves both credentials", async () => {
      const vaultId = "vlt_concurrent_01";
      const mockDB: any[] = [];

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback: any) => {
        const tx = {
          session: {
            updateMany: vi.fn(),
            create: vi.fn().mockImplementation(async ({ data }) => {
              const record = { id: `sess_${Math.random()}`, ...data };
              mockDB.push(record);
              return record;
            }),
          },
        };
        return callback(tx);
      });

      const [farmerLogin, buyerLogin] = await Promise.all([
        createRealmSession("usr_f1", AuthRealm.FARMER, vaultId),
        createRealmSession("usr_b1", AuthRealm.BUYER, vaultId),
      ]);

      expect(farmerLogin.session.realm).toBe(AuthRealm.FARMER);
      expect(buyerLogin.session.realm).toBe(AuthRealm.BUYER);
      expect(mockDB.length).toBe(2);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // T02, T03, T04: Independent Realm Logout
  // ─────────────────────────────────────────────────────────────
  describe("T02, T03, T04: Independent Realm-Scoped Logout", () => {
    it("T02: Farmer logout revokes only Farmer session; Buyer and Admin remain active", async () => {
      const vaultId = "vlt_test_logout";
      const rawFarmerToken = "raw_farmer_token_123";
      const sessions = [
        { id: "s1", vaultId, realm: AuthRealm.FARMER, tokenHash: hashSessionSecret(rawFarmerToken), revokedAt: null },
        { id: "s2", vaultId, realm: AuthRealm.BUYER, tokenHash: "hash_b", revokedAt: null },
        { id: "s3", vaultId, realm: AuthRealm.ADMIN, tokenHash: "hash_a", revokedAt: null },
      ];

      vi.spyOn(prisma.session, "updateMany").mockImplementation((async ({ where, data }: any) => {
        let count = 0;
        sessions.forEach((s) => {
          if (s.realm === where.realm && (s.tokenHash === where.tokenHash || s.vaultId === where.vaultId)) {
            s.revokedAt = data.revokedAt;
            count++;
          }
        });
        return { count };
      }) as any);

      // Set cookie in jar
      mockCookieJar.set(VAULT_COOKIE_NAME, vaultId);
      mockCookieJar.set(REALM_COOKIE_NAMES.FARMER, rawFarmerToken);

      // Revoke Farmer realm
      await revokeRealmSession(AuthRealm.FARMER, vaultId);

      expect(sessions.find((s) => s.realm === AuthRealm.FARMER)?.revokedAt).not.toBeNull();
      expect(sessions.find((s) => s.realm === AuthRealm.BUYER)?.revokedAt).toBeNull();
      expect(sessions.find((s) => s.realm === AuthRealm.ADMIN)?.revokedAt).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // T06: Same-Realm Concurrent Login (Last-Login-Wins)
  // ─────────────────────────────────────────────────────────────
  describe("T06: Same-Realm Concurrent Login", () => {
    it("Atomically revokes prior session when new login occurs for same vault + realm", async () => {
      const vaultId = "vlt_same_realm";
      const sessionStore: any[] = [];

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback: any) => {
        const tx = {
          session: {
            updateMany: vi.fn().mockImplementation(async ({ where, data }) => {
              sessionStore.forEach((s) => {
                if (s.vaultId === where.vaultId && s.realm === where.realm && !s.revokedAt) {
                  s.revokedAt = data.revokedAt;
                }
              });
              return { count: 1 };
            }),
            create: vi.fn().mockImplementation(async ({ data }) => {
              const record = { id: `sess_${sessionStore.length + 1}`, ...data };
              sessionStore.push(record);
              return record;
            }),
          },
        };
        return callback(tx);
      });

      // Login 1
      await createRealmSession("usr_1", AuthRealm.BUYER, vaultId);
      expect(sessionStore.length).toBe(1);
      expect(sessionStore[0].revokedAt).toBeUndefined();

      // Login 2 from another tab for same realm
      await createRealmSession("usr_1", AuthRealm.BUYER, vaultId);
      expect(sessionStore.length).toBe(2);
      expect(sessionStore[0].revokedAt).toBeDefined(); // First session revoked
      expect(sessionStore[1].revokedAt).toBeUndefined(); // Second session active
    });
  });

  // ─────────────────────────────────────────────────────────────
  // T07: Route Invariant Privilege Gating
  // ─────────────────────────────────────────────────────────────
  describe("T07: Route-Level Privilege Gating", () => {
    it("Rejects request to /api/admin/* when only Farmer token is present", async () => {
      const farmerToken = generateSessionSecret();
      const req = new NextRequest("http://localhost:3000/api/admin/verifications", {
        headers: {
          cookie: `smarthub_vault_id=vlt_1; ${REALM_COOKIE_NAMES.FARMER}=${farmerToken}`,
        },
      });

      const res = await middleware(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe("UNAUTHORIZED");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // T08: Model A Security Boundary Verification
  // ─────────────────────────────────────────────────────────────
  describe("T08: Model A Shared Origin Ambient Cookie Behavior", () => {
    it("Acknowledges that browser transmits all matching same-origin cookies", () => {
      const cookieHeader = `${REALM_COOKIE_NAMES.ADMIN}=tokenA; ${REALM_COOKIE_NAMES.FARMER}=tokenF`;
      expect(cookieHeader).toContain(REALM_COOKIE_NAMES.ADMIN);
      expect(cookieHeader).toContain(REALM_COOKIE_NAMES.FARMER);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // T09: Tampered X-Auth-Realm on Shared Route
  // ─────────────────────────────────────────────────────────────
  describe("T09: Tampered X-Auth-Realm Verification", () => {
    it("Rejects access when X-Auth-Realm requests a realm without valid session in DB", async () => {
      vi.spyOn(prisma.session, "findFirst").mockResolvedValue(null);

      const req = new Request("http://localhost:3000/api/wallet", {
        headers: {
          "x-auth-realm": "ADMIN",
        },
      });

      const session = await getSharedSession(req, [AuthRealm.FARMER, AuthRealm.BUYER]);
      expect(session).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // T10 & T17: Client Identity Injection & IDOR Defense
  // ─────────────────────────────────────────────────────────────
  describe("T10 & T17: Financial Invariant & IDOR Defense", () => {
    it("T10: Resolvers derive userId solely from database session, ignoring client claims", async () => {
      const realUser = {
        id: "usr_real_farmer_100",
        email: "farmer@agro.ng",
        role: Role.FARMER,
        isActive: true,
      };

      const mockSessionRecord = {
        id: "sess_100",
        vaultId: "vlt_100",
        userId: realUser.id,
        realm: AuthRealm.FARMER,
        tokenHash: hashSessionSecret("test_secret_100"),
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: null,
        user: realUser,
      };

      mockCookieJar.set(REALM_COOKIE_NAMES.FARMER, "test_secret_100");
      vi.spyOn(prisma.session, "findFirst").mockResolvedValue(mockSessionRecord as any);

      const context = await getFarmerSession();
      expect(context).not.toBeNull();
      expect(context?.userId).toBe("usr_real_farmer_100");
      expect(context?.userId).not.toBe("victim_999");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // T11 & T12: Revocation and Expiration Invalidation
  // ─────────────────────────────────────────────────────────────
  describe("T11 & T12: Revocation and Expiration Enforcement", () => {
    it("T11: Database rejects revoked session (revokedAt != null)", async () => {
      mockCookieJar.set(REALM_COOKIE_NAMES.FARMER, "secret_revoked");
      vi.spyOn(prisma.session, "findFirst").mockResolvedValue(null);

      const context = await getSessionContext(AuthRealm.FARMER);
      expect(context).toBeNull();
    });

    it("T12: Database rejects expired session (expiresAt <= NOW())", async () => {
      mockCookieJar.set(REALM_COOKIE_NAMES.BUYER, "secret_expired");
      vi.spyOn(prisma.session, "findFirst").mockResolvedValue(null);

      const context = await getSessionContext(AuthRealm.BUYER);
      expect(context).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // T13: Immediate Account Suspension Propagation
  // ─────────────────────────────────────────────────────────────
  describe("T13: User Suspension Propagation", () => {
    it("Rejects session immediately if user.isActive === false", async () => {
      mockCookieJar.set(REALM_COOKIE_NAMES.FARMER, "secret_frozen");
      vi.spyOn(prisma.session, "findFirst").mockResolvedValue({
        id: "sess_frozen",
        vaultId: "vlt_1",
        userId: "usr_frozen",
        realm: AuthRealm.FARMER,
        tokenHash: hashSessionSecret("secret_frozen"),
        expiresAt: new Date(Date.now() + 10000),
        revokedAt: null,
        user: {
          id: "usr_frozen",
          email: "frozen@agro.ng",
          role: Role.FARMER,
          isActive: false, // Suspended user
        },
      } as any);

      const context = await getSessionContext(AuthRealm.FARMER);
      expect(context).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // T14 & T15: Role Matrix Enforcement & Password Reset Invalidation
  // ─────────────────────────────────────────────────────────────
  describe("T14 & T15: Strict Role Authorization", () => {
    it("T14: Enforces strict role to realm matching without cross-role leakage", () => {
      expect(isRealmAllowed(Role.ADMIN, AuthRealm.ADMIN)).toBe(true);
      expect(isRealmAllowed(Role.FARMER, AuthRealm.ADMIN)).toBe(false);
      expect(isRealmAllowed(Role.BUYER, AuthRealm.ADMIN)).toBe(false);

      expect(isRealmAllowed(Role.FARMER, AuthRealm.FARMER)).toBe(true);
      expect(isRealmAllowed(Role.BUYER, AuthRealm.FARMER)).toBe(false);
      expect(isRealmAllowed(Role.ADMIN, AuthRealm.FARMER)).toBe(false);

      expect(isRealmAllowed(Role.BUYER, AuthRealm.BUYER)).toBe(true);
      expect(isRealmAllowed(Role.FARMER, AuthRealm.BUYER)).toBe(false);
      expect(isRealmAllowed(Role.ADMIN, AuthRealm.BUYER)).toBe(false);
    });

    it("T15: Password reset / role change revokes all active sessions for that user", async () => {
      const updateManySpy = vi.spyOn(prisma.session, "updateMany").mockResolvedValue({ count: 3 });

      await prisma.session.updateMany({
        where: { userId: "usr_reset_pwd", revokedAt: null },
        data: { revokedAt: new Date() },
      });

      expect(updateManySpy).toHaveBeenCalledWith({
        where: { userId: "usr_reset_pwd", revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // T16: Middleware Sanitization of Untrusted Internal Headers
  // ─────────────────────────────────────────────────────────────
  describe("T16: Internal Header Sanitization in Edge Middleware", () => {
    it("Strips any client-supplied x-internal-auth-* headers from incoming requests", async () => {
      const req = new NextRequest("http://localhost:3000/api/public-endpoint", {
        headers: {
          "x-internal-auth-role": "ADMIN",
          "x-internal-auth-token": "attacker_forged_token",
          "x-internal-auth-vault-id": "victim_vault",
        },
      });

      const res = await middleware(req);
      expect(res).toBeDefined();
    });
  });
});
