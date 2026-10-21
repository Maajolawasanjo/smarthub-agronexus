import crypto from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  bankAccountFindFirst: vi.fn(),
  walletFindUnique: vi.fn(),
  walletCreate: vi.fn(),
  walletUpdateMany: vi.fn(),
  walletTransactionFindUnique: vi.fn(),
  walletTransactionCreate: vi.fn(),
  walletTransactionUpdateMany: vi.fn(),
  transaction: vi.fn(),
  publishAgroEvent: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mock.userFindUnique },
    bankAccount: { findFirst: mock.bankAccountFindFirst },
    wallet: {
      findUnique: mock.walletFindUnique,
      create: mock.walletCreate,
      updateMany: mock.walletUpdateMany,
    },
    walletTransaction: {
      findUnique: mock.walletTransactionFindUnique,
      create: mock.walletTransactionCreate,
      updateMany: mock.walletTransactionUpdateMany,
    },
    $transaction: mock.transaction,
  },
}));

vi.mock("@/lib/events", () => ({
  publishAgroEvent: mock.publishAgroEvent,
}));

import { WalletService } from "@/services/wallet.service";

const userId = "buyer-1";
const bankAccountId = "bank-1";
const key = "withdrawal-request-001";
const amount = 50;
const reference = `WD-${crypto.createHash("sha256").update(`${userId}:${key}`).digest("hex").slice(0, 32).toUpperCase()}`;

type WithdrawalRecord = {
  id: string;
  walletId: string;
  type: string;
  amount: number;
  reference: string;
  bankAccountId: string;
  status: string;
  description: string;
};

type WalletUpdateArgs = {
  where: {
    balance?: { gte?: number };
    pendingWithdrawal?: { gte?: number };
  };
  data: {
    balance?: { decrement?: number; increment?: number };
    pendingWithdrawal?: { decrement?: number; increment?: number };
  };
};

type TransactionFindArgs = { where: { reference?: string; id?: string } };
type TransactionCreateArgs = { data: Omit<WithdrawalRecord, "id"> };
type TransactionUpdateArgs = {
  where: { id?: string; status?: string | { in: string[] } };
  data: Partial<WithdrawalRecord>;
};

let wallet: { id: string; userId: string; balance: number; pendingWithdrawal: number; escrow: number };
let record: WithdrawalRecord | null;

function makeRecord(overrides: Partial<WithdrawalRecord> = {}): WithdrawalRecord {
  return {
    id: "withdrawal-tx-1",
    walletId: wallet.id,
    type: "WITHDRAWAL",
    amount,
    reference,
    bankAccountId,
    status: "PROCESSING",
    description: "[PROCESSING] transfer pending",
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("FLUTTERWAVE_SECRET_KEY", "test-flutterwave-secret");
  vi.stubEnv("NODE_ENV", "test");

  wallet = { id: "wallet-1", userId, balance: 200, pendingWithdrawal: 0, escrow: 0 };
  record = null;

  mock.userFindUnique.mockResolvedValue({ id: userId, isActive: true });
  mock.bankAccountFindFirst.mockResolvedValue({
    id: bankAccountId,
    userId,
    bankName: "Test Bank",
    bankCode: "011",
    accountNumber: "0000000000",
    isVerified: true,
  });
  mock.walletFindUnique.mockImplementation(async () => wallet);
  mock.walletCreate.mockResolvedValue(wallet);
  mock.walletUpdateMany.mockImplementation(async ({ where, data }: WalletUpdateArgs) => {
    if (where.balance?.gte !== undefined && wallet.balance < Number(where.balance.gte)) return { count: 0 };
    if (where.pendingWithdrawal?.gte !== undefined && wallet.pendingWithdrawal < Number(where.pendingWithdrawal.gte)) return { count: 0 };
    if (data.balance?.decrement) wallet.balance -= Number(data.balance.decrement);
    if (data.balance?.increment) wallet.balance += Number(data.balance.increment);
    if (data.pendingWithdrawal?.increment) wallet.pendingWithdrawal += Number(data.pendingWithdrawal.increment);
    if (data.pendingWithdrawal?.decrement) wallet.pendingWithdrawal -= Number(data.pendingWithdrawal.decrement);
    return { count: 1 };
  });
  mock.walletTransactionFindUnique.mockImplementation(async ({ where }: TransactionFindArgs) => {
    if (record && (where.reference === record.reference || where.id === record.id)) return record;
    return null;
  });
  mock.walletTransactionCreate.mockImplementation(async ({ data }: TransactionCreateArgs) => {
    record = { id: "withdrawal-tx-1", ...data };
    return record;
  });
  mock.walletTransactionUpdateMany.mockImplementation(async ({ where, data }: TransactionUpdateArgs) => {
    if (!record || where.id !== record.id) return { count: 0 };
    if (where.status && typeof where.status === "string" && record.status !== where.status) return { count: 0 };
    if (typeof where.status === "object" && where.status !== null && !where.status.in.includes(record.status)) return { count: 0 };
    Object.assign(record, data);
    return { count: 1 };
  });
  mock.transaction.mockImplementation(async (arg: unknown) => {
    if (typeof arg !== "function") throw new Error("Expected an interactive transaction");
    return (arg as (tx: unknown) => unknown)({
      wallet: { findUnique: mock.walletFindUnique, updateMany: mock.walletUpdateMany },
      walletTransaction: {
        findUnique: mock.walletTransactionFindUnique,
        create: mock.walletTransactionCreate,
        updateMany: mock.walletTransactionUpdateMany,
      },
    });
  });
  mock.publishAgroEvent.mockResolvedValue(undefined);
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("socket timeout")));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("withdrawal idempotency and balance conservation", () => {
  it("uses an atomic conditional debit when the balance changes after the initial read", async () => {
    mock.walletUpdateMany.mockResolvedValue({ count: 0 });

    await expect(
      WalletService.executeWithdrawal(userId, amount, bankAccountId, key)
    ).rejects.toThrow("INSUFFICIENT_FUNDS");

    expect(mock.walletUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: wallet.id, balance: { gte: amount } },
    }));
    expect(mock.walletTransactionCreate).not.toHaveBeenCalled();
    expect(wallet.balance).toBe(200);
    expect(wallet.pendingWithdrawal).toBe(0);
  });

  it("returns the existing in-flight withdrawal for the same key without submitting a second transfer", async () => {
    record = makeRecord({ status: "PROCESSING", description: "[PROCESSING] transfer pending" });

    const result = await WalletService.executeWithdrawal(userId, amount, bankAccountId, key);

    expect(result.transactionRef).toBe(reference);
    expect(result.status).toBe("PROCESSING");
    expect(result.alreadyProcessed).toBe(true);
    expect(mock.transaction).not.toHaveBeenCalled();
    expect(mock.walletTransactionCreate).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("keeps funds reserved when the gateway request times out with an unknown outcome", async () => {
    const result = await WalletService.executeWithdrawal(userId, amount, bankAccountId, key);

    expect(result.status).toBe("PROCESSING");
    expect(result.reconciliationRequired).toBe(true);
    expect(record?.status).toBe("PROCESSING");
    expect(record?.description).toContain("[MANUAL_REVIEW]");
    expect(wallet.balance).toBe(150);
    expect(wallet.pendingWithdrawal).toBe(50);
    expect(mock.walletUpdateMany).toHaveBeenCalledTimes(1);
    expect(mock.publishAgroEvent).toHaveBeenCalledWith("WITHDRAWAL_SUBMITTED", {
      userId,
      amount,
      remarks: `${reference} pending reconciliation`,
    });
  });

  it("processes a failed transfer webhook once and ignores its duplicate", async () => {
    wallet.balance = 100;
    wallet.pendingWithdrawal = 50;
    record = makeRecord({ status: "PROCESSING", amount: 50 });

    const first = await WalletService.handleTransferWebhook(reference, false, "bank rejected transfer");
    const second = await WalletService.handleTransferWebhook(reference, false, "duplicate callback");

    expect(first.status).toBe("REVERSED");
    expect(second.status).toBe("ALREADY_HANDLED");
    expect(wallet.balance).toBe(150);
    expect(wallet.pendingWithdrawal).toBe(0);
    expect(mock.walletUpdateMany).toHaveBeenCalledTimes(1);
  });
});
