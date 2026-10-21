ALTER TABLE "Payment"
ADD COLUMN "gatewayTransactionId" TEXT;

CREATE UNIQUE INDEX "Payment_gatewayTransactionId_key"
ON "Payment"("gatewayTransactionId");
