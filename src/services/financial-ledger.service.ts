import {
  FinancialAccountCode,
  FinancialLedgerSource,
  Prisma,
} from "@prisma/client";

export interface FinancialLedgerLineInput {
  reference: string;
  debitAccount: FinancialAccountCode;
  debitUserId?: string | null;
  creditAccount: FinancialAccountCode;
  creditUserId?: string | null;
  amount: number;
  description?: string;
}

export interface FinancialLedgerGroupInput {
  groupReference: string;
  source: FinancialLedgerSource;
  expectedAmount: number;
  description: string;
  lines: FinancialLedgerLineInput[];
}

const USER_SCOPED_ACCOUNTS = new Set<FinancialAccountCode>([
  FinancialAccountCode.USER_AVAILABLE_LIABILITY,
  FinancialAccountCode.USER_ESCROW_LIABILITY,
]);

function toCents(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`FINANCIAL_LEDGER_INVALID_AMOUNT: ${label} must be positive and finite.`);
  }
  const cents = Math.round(value * 100);
  if (Math.abs(value * 100 - cents) > 0.000001) {
    throw new Error(`FINANCIAL_LEDGER_INVALID_AMOUNT: ${label} must have at most two decimal places.`);
  }
  return cents;
}

function validateUserScope(
  account: FinancialAccountCode,
  userId: string | null | undefined,
  side: "debit" | "credit"
) {
  const isUserScoped = USER_SCOPED_ACCOUNTS.has(account);
  if (isUserScoped && !userId) {
    throw new Error(`FINANCIAL_LEDGER_ACCOUNT_OWNER_REQUIRED: ${side} account ${account} requires a user ID.`);
  }
  if (!isUserScoped && userId) {
    throw new Error(`FINANCIAL_LEDGER_ACCOUNT_OWNER_INVALID: ${side} account ${account} cannot be assigned to a user.`);
  }
}

export async function postFinancialLedgerGroup(
  tx: Prisma.TransactionClient,
  input: FinancialLedgerGroupInput
) {
  if (!input.groupReference.trim() || !input.description.trim() || input.lines.length === 0) {
    throw new Error("FINANCIAL_LEDGER_INVALID_GROUP: A group reference, description and at least one line are required.");
  }

  const expectedCents = toCents(input.expectedAmount, "expectedAmount");
  const references = new Set<string>();
  let totalCents = 0;

  const normalizedLines = input.lines.map((line) => {
    if (!line.reference.trim() || references.has(line.reference)) {
      throw new Error("FINANCIAL_LEDGER_DUPLICATE_REFERENCE: Each ledger line must have a unique non-empty reference.");
    }
    references.add(line.reference);

    const cents = toCents(line.amount, `line ${line.reference}`);
    totalCents += cents;
    validateUserScope(line.debitAccount, line.debitUserId, "debit");
    validateUserScope(line.creditAccount, line.creditUserId, "credit");

    if (
      line.debitAccount === line.creditAccount &&
      (line.debitUserId || null) === (line.creditUserId || null)
    ) {
      throw new Error("FINANCIAL_LEDGER_NOOP_ENTRY: Debit and credit cannot target the same account owner.");
    }

    return {
      reference: line.reference,
      groupReference: input.groupReference,
      source: input.source,
      debitAccount: line.debitAccount,
      debitUserId: line.debitUserId || null,
      creditAccount: line.creditAccount,
      creditUserId: line.creditUserId || null,
      amount: cents / 100,
      currency: "NGN",
      description: line.description?.trim() || input.description,
    };
  });

  if (totalCents !== expectedCents) {
    throw new Error(
      `FINANCIAL_LEDGER_UNBALANCED_GROUP: ${input.groupReference} lines total ${(totalCents / 100).toFixed(2)} but expected ${(expectedCents / 100).toFixed(2)}.`
    );
  }

  // Idempotency is group-aware: a complete identical group is safe to replay;
  // partial or conflicting groups are quarantined instead of being silently repaired.
  const existing = await tx.financialLedgerEntry.findMany({
    where: { groupReference: input.groupReference },
    orderBy: { reference: "asc" },
  });

  if (existing.length > 0) {
    if (existing.length !== normalizedLines.length) {
      throw new Error("FINANCIAL_LEDGER_GROUP_CONFLICT: A partial ledger group already exists.");
    }

    const byReference = new Map(existing.map((entry) => [entry.reference, entry]));
    const identical = normalizedLines.every((line) => {
      const entry = byReference.get(line.reference);
      return Boolean(
        entry &&
        entry.source === input.source &&
        entry.debitAccount === line.debitAccount &&
        (entry.debitUserId || null) === line.debitUserId &&
        entry.creditAccount === line.creditAccount &&
        (entry.creditUserId || null) === line.creditUserId &&
        Math.round(Number(entry.amount) * 100) === Math.round(line.amount * 100) &&
        entry.currency === "NGN"
      );
    });

    if (!identical) {
      throw new Error("FINANCIAL_LEDGER_GROUP_CONFLICT: A group reference was reused with different financial values.");
    }
    return existing;
  }

  await tx.financialLedgerEntry.createMany({ data: normalizedLines });
  return tx.financialLedgerEntry.findMany({
    where: { groupReference: input.groupReference },
    orderBy: { reference: "asc" },
  });
}
