import { FinancialAccountCode, FinancialLedgerSource, Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { postFinancialLedgerGroup } from "@/services/financial-ledger.service";

const group = {
  groupReference: "ESCROW-RELEASE-SO-1001",
  source: FinancialLedgerSource.ESCROW_RELEASE,
  expectedAmount: 1000,
  description: "Escrow release for seller order SO-1001",
  lines: [
    {
      reference: "ESCROW-RELEASE-SO-1001:FARMER",
      debitAccount: FinancialAccountCode.USER_ESCROW_LIABILITY,
      debitUserId: "buyer-user-1",
      creditAccount: FinancialAccountCode.USER_AVAILABLE_LIABILITY,
      creditUserId: "farmer-user-1",
      amount: 946.25,
      description: "Farmer payout",
    },
    {
      reference: "ESCROW-RELEASE-SO-1001:PLATFORM_FEE",
      debitAccount: FinancialAccountCode.USER_ESCROW_LIABILITY,
      debitUserId: "buyer-user-1",
      creditAccount: FinancialAccountCode.PLATFORM_FEE_REVENUE,
      amount: 50,
      description: "Platform commission",
    },
    {
      reference: "ESCROW-RELEASE-SO-1001:VAT",
      debitAccount: FinancialAccountCode.USER_ESCROW_LIABILITY,
      debitUserId: "buyer-user-1",
      creditAccount: FinancialAccountCode.VAT_PAYABLE,
      amount: 3.75,
      description: "VAT payable",
    },
  ],
};

function makeTx(existing: unknown[] = []) {
  const findMany = vi.fn()
    .mockResolvedValueOnce(existing)
    .mockResolvedValueOnce(existing.length ? existing : group.lines.map((line) => ({
      ...line,
      groupReference: group.groupReference,
      source: group.source,
      currency: "NGN",
      id: line.reference,
    })));
  const createMany = vi.fn().mockResolvedValue({ count: group.lines.length });
  return {
    tx: { financialLedgerEntry: { findMany, createMany } } as unknown as Prisma.TransactionClient,
    findMany,
    createMany,
  };
}

describe("postFinancialLedgerGroup", () => {
  it("posts an exactly balanced group with separate farmer, platform and VAT credits", async () => {
    const { tx, findMany, createMany } = makeTx();

    const result = await postFinancialLedgerGroup(tx, group);

    expect(createMany).toHaveBeenCalledTimes(1);
    expect(createMany.mock.calls[0][0].data).toHaveLength(3);
    expect(result).toHaveLength(3);
    expect(findMany).toHaveBeenCalledTimes(2);
  });

  it("rejects a group whose debit/credit pairs do not account for the full escrow amount", async () => {
    const { tx, findMany, createMany } = makeTx();
    const invalid = {
      ...group,
      lines: group.lines.slice(0, 2),
    };

    await expect(postFinancialLedgerGroup(tx, invalid))
      .rejects.toThrow("FINANCIAL_LEDGER_UNBALANCED_GROUP");
    expect(findMany).not.toHaveBeenCalled();
    expect(createMany).not.toHaveBeenCalled();
  });

  it("requires user ownership on user-liability accounts", async () => {
    const { tx, findMany, createMany } = makeTx();
    const invalid = {
      ...group,
      lines: [{
        ...group.lines[0],
        debitUserId: null,
      }],
      expectedAmount: 946.25,
    };

    await expect(postFinancialLedgerGroup(tx, invalid))
      .rejects.toThrow("FINANCIAL_LEDGER_ACCOUNT_OWNER_REQUIRED");
    expect(findMany).not.toHaveBeenCalled();
    expect(createMany).not.toHaveBeenCalled();
  });

  it("treats a complete identical group as idempotent", async () => {
    const existing = group.lines.map((line) => ({
      ...line,
      groupReference: group.groupReference,
      source: group.source,
      currency: "NGN",
      id: line.reference,
    }));
    const { tx, findMany, createMany } = makeTx(existing);

    const result = await postFinancialLedgerGroup(tx, group);

    expect(result).toHaveLength(3);
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(createMany).not.toHaveBeenCalled();
  });

  it("rejects a partial pre-existing group rather than silently filling it", async () => {
    const existing = group.lines.slice(0, 1).map((line) => ({
      ...line,
      groupReference: group.groupReference,
      source: group.source,
      currency: "NGN",
      id: line.reference,
    }));
    const { tx, findMany, createMany } = makeTx(existing);

    await expect(postFinancialLedgerGroup(tx, group))
      .rejects.toThrow("FINANCIAL_LEDGER_GROUP_CONFLICT");
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(createMany).not.toHaveBeenCalled();
  });
});
