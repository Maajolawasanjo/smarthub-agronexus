ALTER TABLE "WalletTransaction"
ADD COLUMN "bankAccountId" TEXT;

CREATE INDEX "WalletTransaction_bankAccountId_idx"
ON "WalletTransaction"("bankAccountId");
