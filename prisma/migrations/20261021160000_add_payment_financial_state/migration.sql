CREATE TYPE "PaymentFinancialState" AS ENUM (
  'PENDING',
  'ESCROWED',
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
  WHEN p."paymentStatus" = 'REFUNDED' THEN 'REFUNDED'::"PaymentFinancialState"
  WHEN p."paymentStatus" = 'PAID' AND EXISTS (
    SELECT 1 FROM "Order" AS o
    WHERE o."id" = p."orderId" AND o."status" = 'COMPLETED'
  ) THEN 'SETTLED'::"PaymentFinancialState"
  WHEN p."paymentStatus" = 'PAID' THEN 'ESCROWED'::"PaymentFinancialState"
  ELSE 'PENDING'::"PaymentFinancialState"
END;
