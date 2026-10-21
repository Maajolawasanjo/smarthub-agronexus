-- Production schema alignment with prisma/schema.prisma (additive, data preserving).

-- Historical migrations were applied through Supabase; Prisma migration bookkeeping must be baselined separately.

CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED', 'ARCHIVED');

CREATE TYPE "SellerOrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED');

CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'ESCROW_LOCK', 'ESCROW_RELEASE', 'REFUND');

CREATE TYPE "TxStatus" AS ENUM ('REQUESTED', 'VALIDATED', 'SUBMITTED_TO_FLUTTERWAVE', 'PROCESSING', 'SUCCESS', 'FAILED', 'REVERSED', 'PENDING');

ALTER TABLE "User" ADD COLUMN "profileImage" TEXT;

ALTER TABLE "Product" ADD COLUMN "status" "ProductStatus" NOT NULL DEFAULT 'PENDING_APPROVAL';

ALTER TABLE "Product" ADD COLUMN "rejectionReason" TEXT;

ALTER TABLE "Product" ADD COLUMN "moderationNotes" TEXT;

ALTER TABLE "Product" ADD COLUMN "moderatedAt" TIMESTAMP(3);

ALTER TABLE "Product" ADD COLUMN "moderatedById" TEXT;

ALTER TABLE "Product" ADD COLUMN "moq" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "Product" ADD COLUMN "grade" TEXT;

ALTER TABLE "Product" ADD COLUMN "condition" TEXT;

ALTER TABLE "Product" ADD COLUMN "packaging" TEXT;

ALTER TABLE "Product" ADD COLUMN "packageSize" TEXT;

ALTER TABLE "Product" ADD COLUMN "availabilityStatus" TEXT DEFAULT 'AVAILABLE_NOW';

ALTER TABLE "Product" ADD COLUMN "availableFrom" TIMESTAMP(3);

ALTER TABLE "Product" ADD COLUMN "storageCondition" TEXT;

ALTER TABLE "Product" ADD COLUMN "storageNotes" TEXT;

ALTER TABLE "Product" ADD COLUMN "farmState" TEXT;

ALTER TABLE "Product" ADD COLUMN "farmLga" TEXT;

ALTER TABLE "Product" ADD COLUMN "farmCommunity" TEXT;

ALTER TABLE "Order" ADD COLUMN "shippingAddressId" TEXT;

ALTER TABLE "OrderItem" ADD COLUMN "sellerOrderId" TEXT;

ALTER TABLE "Review" ADD COLUMN "orderId" TEXT;

CREATE TABLE "SellerOrder" (
  "id" TEXT NOT NULL,
  "sellerOrderNumber" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "farmerProfileId" TEXT NOT NULL,
  "subtotal" DECIMAL(10,2) NOT NULL,
  "shippingFee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  "totalAmount" DECIMAL(10,2) NOT NULL,
  "status" "SellerOrderStatus" NOT NULL DEFAULT 'PENDING',
  "trackingNumber" TEXT,
  "dispatchNotes" TEXT,
  "shippedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SellerOrder_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SellerOrder_sellerOrderNumber_key" UNIQUE ("sellerOrderNumber")
);

CREATE TABLE "BuyerAddress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "label" TEXT NOT NULL DEFAULT 'Home',
  "recipientName" TEXT NOT NULL,
  "phoneNumber" TEXT NOT NULL,
  "addressLine" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "lga" TEXT NOT NULL,
  "postalCode" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BuyerAddress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Wallet" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "balance" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  "escrow" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  "pendingWithdrawal" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  "frozen" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Wallet_userId_key" UNIQUE ("userId")
);

CREATE TABLE "BankAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bankName" TEXT NOT NULL,
  "bankCode" TEXT NOT NULL,
  "accountNumber" TEXT NOT NULL,
  "accountName" TEXT NOT NULL,
  "isVerified" BOOLEAN NOT NULL DEFAULT true,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WalletTransaction" (
  "id" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "type" "TransactionType" NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "reference" TEXT NOT NULL,
  "description" TEXT,
  "status" "TxStatus" NOT NULL DEFAULT 'SUCCESS',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WalletTransaction_reference_key" UNIQUE ("reference")
);

CREATE TABLE "Coupon" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "discountPct" DECIMAL(5,2) NOT NULL,
  "minSpend" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  "expiresAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Coupon_code_key" UNIQUE ("code")
);

CREATE TABLE "UserPreferences" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "countryCode" TEXT NOT NULL DEFAULT 'NG',
  "regionCode" TEXT NOT NULL DEFAULT 'LA',
  "currencyCode" TEXT NOT NULL DEFAULT 'NGN',
  "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
  "locale" TEXT NOT NULL DEFAULT 'en-NG',
  "isCustomCurrency" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserPreferences_userId_key" UNIQUE ("userId")
);

CREATE INDEX IF NOT EXISTS "Verification_reviewedById_idx" ON "Verification"("reviewedById");

CREATE INDEX IF NOT EXISTS "Product_farmerProfileId_idx" ON "Product"("farmerProfileId");

CREATE INDEX IF NOT EXISTS "Product_categoryId_idx" ON "Product"("categoryId");

CREATE INDEX IF NOT EXISTS "Product_status_idx" ON "Product"("status");

CREATE INDEX IF NOT EXISTS "Product_moderatedById_idx" ON "Product"("moderatedById");

CREATE INDEX IF NOT EXISTS "ProductImage_productId_idx" ON "ProductImage"("productId");

CREATE INDEX IF NOT EXISTS "Order_buyerId_idx" ON "Order"("buyerId");

CREATE INDEX IF NOT EXISTS "Order_shippingAddressId_idx" ON "Order"("shippingAddressId");

CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");

CREATE INDEX IF NOT EXISTS "OrderItem_productId_idx" ON "OrderItem"("productId");

CREATE INDEX IF NOT EXISTS "OrderItem_sellerOrderId_idx" ON "OrderItem"("sellerOrderId");

CREATE INDEX IF NOT EXISTS "Delivery_logisticsPartnerId_idx" ON "Delivery"("logisticsPartnerId");

CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");

CREATE INDEX IF NOT EXISTS "Review_productId_idx" ON "Review"("productId");

CREATE INDEX IF NOT EXISTS "Review_orderId_idx" ON "Review"("orderId");

CREATE INDEX IF NOT EXISTS "Dispute_orderId_idx" ON "Dispute"("orderId");

CREATE INDEX IF NOT EXISTS "Dispute_userId_idx" ON "Dispute"("userId");

CREATE INDEX IF NOT EXISTS "SellerOrder_orderId_idx" ON "SellerOrder"("orderId");

CREATE INDEX IF NOT EXISTS "SellerOrder_farmerProfileId_idx" ON "SellerOrder"("farmerProfileId");

CREATE INDEX IF NOT EXISTS "SellerOrder_status_idx" ON "SellerOrder"("status");

CREATE INDEX IF NOT EXISTS "BuyerAddress_userId_idx" ON "BuyerAddress"("userId");

CREATE INDEX IF NOT EXISTS "BankAccount_userId_idx" ON "BankAccount"("userId");

CREATE INDEX IF NOT EXISTS "WalletTransaction_walletId_idx" ON "WalletTransaction"("walletId");

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='FarmerProfile_userId_fkey' AND conrelid='"FarmerProfile"'::regclass) THEN ALTER TABLE "FarmerProfile" ADD CONSTRAINT "FarmerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='BuyerProfile_userId_fkey' AND conrelid='"BuyerProfile"'::regclass) THEN ALTER TABLE "BuyerProfile" ADD CONSTRAINT "BuyerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Verification_farmerProfileId_fkey' AND conrelid='"Verification"'::regclass) THEN ALTER TABLE "Verification" ADD CONSTRAINT "Verification_farmerProfileId_fkey" FOREIGN KEY ("farmerProfileId") REFERENCES "FarmerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Verification_reviewedById_fkey' AND conrelid='"Verification"'::regclass) THEN ALTER TABLE "Verification" ADD CONSTRAINT "Verification_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Product_categoryId_fkey' AND conrelid='"Product"'::regclass) THEN ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Product_farmerProfileId_fkey' AND conrelid='"Product"'::regclass) THEN ALTER TABLE "Product" ADD CONSTRAINT "Product_farmerProfileId_fkey" FOREIGN KEY ("farmerProfileId") REFERENCES "FarmerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Product_moderatedById_fkey' AND conrelid='"Product"'::regclass) THEN ALTER TABLE "Product" ADD CONSTRAINT "Product_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ProductImage_productId_fkey' AND conrelid='"ProductImage"'::regclass) THEN ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Inventory_productId_fkey' AND conrelid='"Inventory"'::regclass) THEN ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Order_buyerId_fkey' AND conrelid='"Order"'::regclass) THEN ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "BuyerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Order_shippingAddressId_fkey' AND conrelid='"Order"'::regclass) THEN ALTER TABLE "Order" ADD CONSTRAINT "Order_shippingAddressId_fkey" FOREIGN KEY ("shippingAddressId") REFERENCES "BuyerAddress" ("id") ON DELETE SET NULL ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='OrderItem_orderId_fkey' AND conrelid='"OrderItem"'::regclass) THEN ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='OrderItem_productId_fkey' AND conrelid='"OrderItem"'::regclass) THEN ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='OrderItem_sellerOrderId_fkey' AND conrelid='"OrderItem"'::regclass) THEN ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_sellerOrderId_fkey" FOREIGN KEY ("sellerOrderId") REFERENCES "SellerOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Payment_orderId_fkey' AND conrelid='"Payment"'::regclass) THEN ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Delivery_logisticsPartnerId_fkey' AND conrelid='"Delivery"'::regclass) THEN ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_logisticsPartnerId_fkey" FOREIGN KEY ("logisticsPartnerId") REFERENCES "LogisticsPartner" ("id") ON DELETE SET NULL ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Delivery_orderId_fkey' AND conrelid='"Delivery"'::regclass) THEN ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Notification_userId_fkey' AND conrelid='"Notification"'::regclass) THEN ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Review_buyerId_fkey' AND conrelid='"Review"'::regclass) THEN ALTER TABLE "Review" ADD CONSTRAINT "Review_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "BuyerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Review_productId_fkey' AND conrelid='"Review"'::regclass) THEN ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Review_orderId_fkey' AND conrelid='"Review"'::regclass) THEN ALTER TABLE "Review" ADD CONSTRAINT "Review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Dispute_orderId_fkey' AND conrelid='"Dispute"'::regclass) THEN ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Dispute_userId_fkey' AND conrelid='"Dispute"'::regclass) THEN ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='SellerOrder_orderId_fkey' AND conrelid='"SellerOrder"'::regclass) THEN ALTER TABLE "SellerOrder" ADD CONSTRAINT "SellerOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='SellerOrder_farmerProfileId_fkey' AND conrelid='"SellerOrder"'::regclass) THEN ALTER TABLE "SellerOrder" ADD CONSTRAINT "SellerOrder_farmerProfileId_fkey" FOREIGN KEY ("farmerProfileId") REFERENCES "FarmerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='BuyerAddress_userId_fkey' AND conrelid='"BuyerAddress"'::regclass) THEN ALTER TABLE "BuyerAddress" ADD CONSTRAINT "BuyerAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Wallet_userId_fkey' AND conrelid='"Wallet"'::regclass) THEN ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='WalletTransaction_walletId_fkey' AND conrelid='"WalletTransaction"'::regclass) THEN ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='UserPreferences_userId_fkey' AND conrelid='"UserPreferences"'::regclass) THEN ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Session_userId_fkey' AND conrelid='"Session"'::regclass) THEN ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

ALTER TABLE "SellerOrder" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "SellerOrder" FROM anon, authenticated;

ALTER TABLE "BuyerAddress" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "BuyerAddress" FROM anon, authenticated;

ALTER TABLE "Wallet" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "Wallet" FROM anon, authenticated;

ALTER TABLE "BankAccount" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "BankAccount" FROM anon, authenticated;

ALTER TABLE "WalletTransaction" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "WalletTransaction" FROM anon, authenticated;

ALTER TABLE "Coupon" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "Coupon" FROM anon, authenticated;

ALTER TABLE "UserPreferences" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "UserPreferences" FROM anon, authenticated;
