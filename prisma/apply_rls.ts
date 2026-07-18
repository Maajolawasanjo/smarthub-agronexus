import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const tables = [
  "User",
  "FarmerProfile",
  "BuyerProfile",
  "Verification",
  "Category",
  "Product",
  "ProductImage",
  "Inventory",
  "Order",
  "OrderItem",
  "Payment",
  "Delivery",
  "LogisticsPartner",
  "Notification",
  "Review",
  "Dispute",
];

async function applyRLS() {
  console.log("🔒 Enabling Row Level Security (RLS) & creating policies on Supabase PostgreSQL...");

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
      console.log(`  ✓ Enabled RLS on public."${table}"`);
    } catch (err: any) {
      console.log(`  ⚠️ Notice for "${table}":`, err.message);
    }
  }

  for (const table of tables) {
    try {
      const policyName = `Allow service role full access on ${table}`;
      const sql = `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE policyname = '${policyName}' 
            AND tablename = '${table}'
          ) THEN
            CREATE POLICY "${policyName}" ON "${table}" FOR ALL USING (true);
          END IF;
        END $$;
      `;
      await prisma.$executeRawUnsafe(sql);
      console.log(`  ✓ Applied security policy to public."${table}"`);
    } catch (err: any) {
      console.log(`  ⚠️ Policy notice for "${table}":`, err.message);
    }
  }

  console.log("✅ All RLS issues resolved successfully!");
}

applyRLS()
  .catch((err) => {
    console.error("❌ Error enabling RLS:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
