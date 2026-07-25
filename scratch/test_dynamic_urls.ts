import { PrismaClient } from "../src/generated/prisma/client";

const project_ref = "jlzjyulcvqsdiqrxrrgo";
const db_pass = "Smarthub-agrochain";

const regions = [
  "eu-west-1", "eu-central-1", "eu-west-2", "eu-west-3", "eu-north-1",
  "us-east-1", "us-east-2", "us-west-1", "us-west-2", "ca-central-1",
  "ap-south-1", "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2", "sa-east-1"
];

async function scan() {
  for (const r of regions) {
    const host = `aws-0-${r}.pooler.supabase.com`;
    for (const port of [6543, 5432]) {
      const url = `postgresql://postgres.${project_ref}:${db_pass}@${host}:${port}/postgres?sslmode=require`;
      const prisma = new PrismaClient({ datasources: { db: { url } } });
      try {
        const count = await prisma.user.count();
        console.log(`\n=============================================`);
        console.log(`SUCCESS MATCH FOUND! ${host}:${port}`);
        console.log(`User Count in Database: ${count}`);
        console.log(`DATABASE_URL="${url}"`);
        console.log(`=============================================\n`);
        await prisma.$disconnect();
        return;
      } catch (err: any) {
        const msg = err?.message?.split("\n")?.[0] || String(err);
        console.log(`Host ${host}:${port} => ${msg}`);
      } finally {
        await prisma.$disconnect();
      }
    }
  }
}

scan();
