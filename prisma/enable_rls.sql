-- Enable Row Level Security (RLS) on all public tables
ALTER TABLE IF EXISTS "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "FarmerProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "BuyerProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Verification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ProductImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Inventory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Delivery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "LogisticsPartner" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Dispute" ENABLE ROW LEVEL SECURITY;

-- Allow full access to backend server connection role (Postgres / Service Role)
DO $$
BEGIN
  -- User
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role full access' AND tablename = 'User') THEN
    CREATE POLICY "Allow service role full access" ON "User" FOR ALL USING (true);
  END IF;

  -- FarmerProfile
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role full access' AND tablename = 'FarmerProfile') THEN
    CREATE POLICY "Allow service role full access" ON "FarmerProfile" FOR ALL USING (true);
  END IF;

  -- BuyerProfile
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role full access' AND tablename = 'BuyerProfile') THEN
    CREATE POLICY "Allow service role full access" ON "BuyerProfile" FOR ALL USING (true);
  END IF;

  -- Verification
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role full access' AND tablename = 'Verification') THEN
    CREATE POLICY "Allow service role full access" ON "Verification" FOR ALL USING (true);
  END IF;

  -- Category
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role full access' AND tablename = 'Category') THEN
    CREATE POLICY "Allow service role full access" ON "Category" FOR ALL USING (true);
  END IF;

  -- Product
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role full access' AND tablename = 'Product') THEN
    CREATE POLICY "Allow service role full access" ON "Product" FOR ALL USING (true);
  END IF;

  -- ProductImage
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role full access' AND tablename = 'ProductImage') THEN
    CREATE POLICY "Allow service role full access" ON "ProductImage" FOR ALL USING (true);
  END IF;

  -- Inventory
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role full access' AND tablename = 'Inventory') THEN
    CREATE POLICY "Allow service role full access" ON "Inventory" FOR ALL USING (true);
  END IF;

  -- Order
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role full access' AND tablename = 'Order') THEN
    CREATE POLICY "Allow service role full access" ON "Order" FOR ALL USING (true);
  END IF;

  -- OrderItem
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role full access' AND tablename = 'OrderItem') THEN
    CREATE POLICY "Allow service role full access" ON "OrderItem" FOR ALL USING (true);
  END IF;

  -- Payment
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role full access' AND tablename = 'Payment') THEN
    CREATE POLICY "Allow service role full access" ON "Payment" FOR ALL USING (true);
  END IF;

  -- Delivery
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role full access' AND tablename = 'Delivery') THEN
    CREATE POLICY "Allow service role full access" ON "Delivery" FOR ALL USING (true);
  END IF;

  -- LogisticsPartner
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role full access' AND tablename = 'LogisticsPartner') THEN
    CREATE POLICY "Allow service role full access" ON "LogisticsPartner" FOR ALL USING (true);
  END IF;

  -- Notification
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role full access' AND tablename = 'Notification') THEN
    CREATE POLICY "Allow service role full access" ON "Notification" FOR ALL USING (true);
  END IF;

  -- Review
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role full access' AND tablename = 'Review') THEN
    CREATE POLICY "Allow service role full access" ON "Review" FOR ALL USING (true);
  END IF;

  -- Dispute
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role full access' AND tablename = 'Dispute') THEN
    CREATE POLICY "Allow service role full access" ON "Dispute" FOR ALL USING (true);
  END IF;
END $$;
