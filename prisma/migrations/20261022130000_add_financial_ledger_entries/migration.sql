CREATE TYPE "FinancialAccountCode" AS ENUM (
  'GATEWAY_CLEARING_ASSET',
  'USER_AVAILABLE_LIABILITY',
  'USER_ESCROW_LIABILITY',
  'WITHDRAWAL_PAYABLE',
  'PLATFORM_FEE_REVENUE',
  'VAT_PAYABLE',
  'LOGISTICS_PAYABLE',
  'PLATFORM_SUSPENSE'
);

CREATE TYPE "FinancialLedgerSource" AS ENUM (
  'ORDER_PAYMENT',
  'WALLET_CHECKOUT',
  'WALLET_DEPOSIT',
  'ESCROW_RELEASE',
  'WALLET_REFUND',
  'CARD_REFUND',
  'STORE_CREDIT',
  'WITHDRAWAL_RESERVED',
  'WITHDRAWAL_SETTLED',
  'WITHDRAWAL_REVERSED'
);

CREATE TABLE "FinancialLedgerEntry" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "groupReference" TEXT NOT NULL,
  "source" "FinancialLedgerSource" NOT NULL,
  "debitAccount" "FinancialAccountCode" NOT NULL,
  "debitUserId" TEXT,
  "creditAccount" "FinancialAccountCode" NOT NULL,
  "creditUserId" TEXT,
  "amount" DECIMAL(14,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FinancialLedgerEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FinancialLedgerEntry_amount_positive_check" CHECK ("amount" > 0)
);

CREATE UNIQUE INDEX "FinancialLedgerEntry_reference_key"
  ON "FinancialLedgerEntry"("reference");
CREATE INDEX "FinancialLedgerEntry_groupReference_idx"
  ON "FinancialLedgerEntry"("groupReference");
CREATE INDEX "FinancialLedgerEntry_source_createdAt_idx"
  ON "FinancialLedgerEntry"("source", "createdAt");
CREATE INDEX "FinancialLedgerEntry_debitAccount_debitUserId_createdAt_idx"
  ON "FinancialLedgerEntry"("debitAccount", "debitUserId", "createdAt");
CREATE INDEX "FinancialLedgerEntry_creditAccount_creditUserId_createdAt_idx"
  ON "FinancialLedgerEntry"("creditAccount", "creditUserId", "createdAt");

ALTER TABLE "FinancialLedgerEntry"
  ADD CONSTRAINT "FinancialLedgerEntry_debitUserId_fkey"
  FOREIGN KEY ("debitUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialLedgerEntry"
  ADD CONSTRAINT "FinancialLedgerEntry_creditUserId_fkey"
  FOREIGN KEY ("creditUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
