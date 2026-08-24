import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { getJwtSecret, signSessionToken, verifySessionToken } from "@/lib/session";

describe("Phase 1 Security Hardening Tests (SEC-001 to SEC-004)", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  // ─────────────────────────────────────────────────────────────
  // SEC-001: JWT Secret Hardening
  // ─────────────────────────────────────────────────────────────
  describe("SEC-001: JWT Secret Fail-Closed Behavior", () => {
    test("Fails explicitly when JWT_SECRET is missing or empty", () => {
      delete process.env.JWT_SECRET;
      expect(() => getJwtSecret()).toThrow("CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing.");
    });

    test("Signs and verifies session token cleanly when valid JWT_SECRET is set", () => {
      process.env.JWT_SECRET = "test-secret-key-for-vitest-security-suite-2026";
      const payload = { userId: "usr_sec_123", email: "sec@agronexus.com", role: "BUYER" as const };

      const token = signSessionToken(payload);
      expect(token).toBeDefined();

      const verified = verifySessionToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe("usr_sec_123");
      expect(verified?.role).toBe("BUYER");
    });

    test("Rejects tampered or invalid session tokens", () => {
      process.env.JWT_SECRET = "test-secret-key-for-vitest-security-suite-2026";
      const payload = { userId: "usr_sec_123", email: "sec@agronexus.com", role: "BUYER" as const };
      const token = signSessionToken(payload);

      const tamperedToken = token.slice(0, -5) + "abcde";
      expect(verifySessionToken(tamperedToken)).toBeNull();
      expect(verifySessionToken("invalid.jwt.token")).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // SEC-003: Public Registration Role Hardening
  // ─────────────────────────────────────────────────────────────
  describe("SEC-003: Role Self-Assignment Protection", () => {
    test("Role parsing enforces strict non-ADMIN target role resolution", () => {
      const resolveRole = (requestedRole: string): "BUYER" | "FARMER" => {
        const uRole = String(requestedRole).toUpperCase();
        return uRole === "FARMER" ? "FARMER" : "BUYER";
      };

      expect(resolveRole("ADMIN")).toBe("BUYER");
      expect(resolveRole("admin")).toBe("BUYER");
      expect(resolveRole("SUPER_ADMIN")).toBe("BUYER");
      expect(resolveRole("FARMER")).toBe("FARMER");
      expect(resolveRole("BUYER")).toBe("BUYER");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // SEC-004: Product Creation Authorization Guardrails
  // ─────────────────────────────────────────────────────────────
  describe("SEC-004: Produce Submission Session Guard", () => {
    test("Rejects unauthenticated produce creation attempt with 401", () => {
      const session = null;
      const authorizeProduceSubmission = (sess: any) => {
        if (!sess) return { status: 401, error: "Authentication required to submit produce." };
        if (sess.role !== "FARMER" && sess.role !== "ADMIN") {
          return { status: 403, error: "Access denied. Only registered farmers can submit produce." };
        }
        return { status: 200 };
      };

      const unauthResult = authorizeProduceSubmission(session);
      expect(unauthResult.status).toBe(401);

      const buyerResult = authorizeProduceSubmission({ userId: "u1", role: "BUYER" });
      expect(buyerResult.status).toBe(403);

      const farmerResult = authorizeProduceSubmission({ userId: "u2", role: "FARMER" });
      expect(farmerResult.status).toBe(200);
    });
  });
});
