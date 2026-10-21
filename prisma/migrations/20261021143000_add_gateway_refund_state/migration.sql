CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'MANUAL_REVIEW');

ALTER TABLE "Payment"
ADD COLUMN "gatewayRefundId" TEXT,
ADD COLUMN "refundStatus" "RefundStatus";

CREATE UNIQUE INDEX "Payment_gatewayRefundId_key"
ON "Payment"("gatewayRefundId");
