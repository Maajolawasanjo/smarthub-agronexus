CREATE TYPE "PaymentFinancialState" AS ENUM (
  'PENDING',
  'ESCROWED',
  'SETTLING',
  'SETTLED',
  'REFUNDING',
  'REFUNDED',
  'MANUAL_REVIEW'
);

ALTER TABLE "Payment"
ADD COLUMN "financialState" "PaymentFinancialState" NOT NULL DEFAULT 'PENDING';

-- Backfill existing payments conservatively. Paid orders are considered escrowed unless
-- already completed; the settlement service still verifies the actual escrow-lock ledger.
UPDATE "Payment" AS p
SET "financialState" = CASE
  -- Any incomplete/failed provider refund must block escrow release until reviewed.
  WHEN p."refundStatus" IN ('PENDING', 'FAILED', 'MANUAL_REVIEW')
    THEN 'MANUAL_REVIEW'::"PaymentFinancialState"
  -- Confirmed provider refunds and historical wallet refunds must never be re-released.
  WHEN p."refundStatus" = 'SUCCEEDED'
    THEN 'REFUNDED'::"PaymentFinancialState"
  -- Older code could commit a refund ledger before updating Payment. Freeze such
  -- records for reconciliation instead of treating them as releasable escrow.
  WHEN EXISTS (
    SELECT 1
    FROM "WalletTransaction" AS wt
    WHERE wt."reference" IN (
      'WALLET-REFUND-' || p."orderId",
      'CARD-REFUND-' || p."orderId",
      'STORE-CREDIT-' || p."orderId"
    )
      AND wt."type" = 'REFUND'
      AND wt."status" = 'SUCCESS'
  ) THEN 'MANUAL_REVIEW'::"PaymentFinancialState"
  WHEN p."paymentStatus" = 'REFUNDED' THEN 'REFUNDED'::"PaymentFinancialState"
  WHEN p."paymentStatus" = 'PAID' AND EXISTS (
    SELECT 1 FROM "Order" AS o
    WHERE o."id" = p."orderId" AND o."status" = 'COMPLETED'
  ) THEN 'SETTLED'::"PaymentFinancialState"
  WHEN p."paymentStatus" = 'PAID' THEN 'ESCROWED'::"PaymentFinancialState"
  ELSE 'PENDING'::"PaymentFinancialState"
END;
