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
    url: process.env["DATABASE_URL"] || "",
  },
});
