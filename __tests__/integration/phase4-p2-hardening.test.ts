import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as runReconciliationJob } from "@/app/api/jobs/reconcile/route";
import { getSession } from "@/lib/session";
import { ReconciliationService } from "@/services/reconciliation.service";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

vi.mock("@/services/reconciliation.service", () => ({
  ReconciliationService: {
    runFinancialReconciliation: vi.fn().mockResolvedValue({
      status: "BALANCED",
      summary: { totalWalletsAudited: 10, discrepanciesCount: 0 },
    }),
  },
}));

describe("Phase 4 — P2 Quality & Production Consistency Suite", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  describe("P2-4: CRON Secret Mandatory Enforcement", () => {
    it("should authenticate reconciliation job when valid CRON_SECRET bearer token is provided", async () => {
      process.env.CRON_SECRET = "super-secret-cron-token";
      (getSession as any).mockResolvedValue(null);

      const req = new Request("http://localhost:3000/api/jobs/reconcile", {
        method: "POST",
        headers: {
          Authorization: "Bearer super-secret-cron-token",
        },
      });

      const res = await runReconciliationJob(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(ReconciliationService.runFinancialReconciliation).toHaveBeenCalled();
    });

    it("should REJECT cron authentication when FLUTTERWAVE_SECRET_KEY is passed instead of CRON_SECRET", async () => {
      process.env.CRON_SECRET = "super-secret-cron-token";
      process.env.FLUTTERWAVE_SECRET_KEY = "flw_secret_key_123";
      (getSession as any).mockResolvedValue(null);

      const req = new Request("http://localhost:3000/api/jobs/reconcile", {
        method: "POST",
        headers: {
          Authorization: "Bearer flw_secret_key_123",
        },
      });

      const res = await runReconciliationJob(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("UNAUTHORIZED");
      expect(ReconciliationService.runFinancialReconciliation).not.toHaveBeenCalled();
    });

    it("should fail closed (401) if CRON_SECRET is unconfigured in process.env", async () => {
      delete process.env.CRON_SECRET;
      process.env.FLUTTERWAVE_SECRET_KEY = "flw_secret_key_123";
      (getSession as any).mockResolvedValue(null);

      const req = new Request("http://localhost:3000/api/jobs/reconcile", {
        method: "POST",
        headers: {
          Authorization: "Bearer flw_secret_key_123",
        },
      });

      const res = await runReconciliationJob(req);
      expect(res.status).toBe(401);
      expect(ReconciliationService.runFinancialReconciliation).not.toHaveBeenCalled();
    });

    it("should allow ADMIN session to trigger reconciliation without bearer token", async () => {
      process.env.CRON_SECRET = "super-secret-cron-token";
      (getSession as any).mockResolvedValue({
        userId: "admin-99",
        role: "ADMIN",
      });

      const req = new Request("http://localhost:3000/api/jobs/reconcile", {
        method: "POST",
      });

      const res = await runReconciliationJob(req);
      expect(res.status).toBe(200);
      expect(ReconciliationService.runFinancialReconciliation).toHaveBeenCalled();
    });
  });
});
