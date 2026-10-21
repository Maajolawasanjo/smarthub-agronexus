import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Load environment variables in the same order as Next.js:
// .env.local first, then .env fallback.
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations require a session/direct connection, not the transaction pooler.
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"] || "",
  },
});
