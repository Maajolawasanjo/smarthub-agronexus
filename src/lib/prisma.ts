import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Executes a database query function with automatic backoff retry logic.
 * Protects server-side routes against transient Supabase connection pooler socket drops.
 */
export async function executeWithDbRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 300
): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      console.warn(`[DB_RETRY] Database query attempt ${attempt}/${retries} failed: ${err?.message || err}. Retrying in ${delayMs * attempt}ms...`);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs * attempt));
    }
  }
  throw lastError;
}
