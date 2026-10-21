import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  getSharedSession: vi.fn(),
  executeWithdrawal: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  AuthRealm: { BUYER: "BUYER", FARMER: "FARMER", ADMIN: "ADMIN" },
  getSharedSession: mock.getSharedSession,
}));

vi.mock("@/services/wallet.service", () => ({
  WalletService: {
    executeWithdrawal: mock.executeWithdrawal,
    formatNGN: (value: number) => String(value),
  },
}));

import { POST as withdraw } from "@/app/api/wallet/withdraw/route";

const canonical = "https://www.smarthubagrochain.online";
function walletRequest(origin?: string) {
  return new Request(`${canonical}/api/wallet/withdraw`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-realm": "BUYER",
      ...(origin ? { origin } : {}),
      "idempotency-key": "test-withdrawal-key-001",
    },
    body: JSON.stringify({ amount: 2500, bankAccountId: "bank-account-1" }),
  });
}

describe("Phase 0-C: CSRF on bank withdrawal", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("APP_ORIGIN", undefined);
    vi.stubEnv("NEXT_PUBLIC_APP_URL", undefined);
    mock.getSharedSession.mockResolvedValue({ userId: "buyer_1", role: "BUYER" });
  });
  afterEach(() => vi.unstubAllEnvs());

  it("rejects an authenticated foreign-origin withdrawal before moving funds", async () => {
    const res = await withdraw(walletRequest("https://attacker.example"));
    expect(res.status).toBe(403);
    expect(mock.executeWithdrawal).not.toHaveBeenCalled();
  });

  it("rejects an authenticated origin-less withdrawal before moving funds", async () => {
    const res = await withdraw(walletRequest());
    expect(res.status).toBe(403);
    expect(mock.executeWithdrawal).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests with a valid origin", async () => {
    mock.getSharedSession.mockResolvedValue(null);
    const res = await withdraw(walletRequest(canonical));
    expect(res.status).toBe(401);
    expect(mock.executeWithdrawal).not.toHaveBeenCalled();
  });

  it("a same-origin authenticated request reaches the legitimate wallet service", async () => {
    mock.executeWithdrawal.mockResolvedValue({
      transactionRef: "test-only-reference",
      status: "PROCESSING",
      alreadyProcessed: false,
      reconciliationRequired: false,
      updatedWallet: { balance: 5000 },
    });
    const res = await withdraw(walletRequest(canonical));
    expect(res.status).toBe(200);
    expect(mock.executeWithdrawal).toHaveBeenCalledWith("buyer_1", 2500, "bank-account-1", "test-withdrawal-key-001");
  });
});
