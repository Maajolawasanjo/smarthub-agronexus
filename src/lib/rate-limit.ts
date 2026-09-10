import { prisma } from "@/lib/prisma";

/**
 * DB-backed rate limiter using the AuditEvent table.
 * Works correctly across all serverless instances and survives restarts.
 * Each allowed request logs a lightweight rate_limit action entry.
 * Uses a sliding window count within the last N seconds.
 */
export async function checkRateLimit(
  identifier: string,
  limitWindowSeconds: number = 60,
  maxRequests: number = 60
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const windowStart = new Date(Date.now() - limitWindowSeconds * 1000);
  const resetAt = Date.now() + limitWindowSeconds * 1000;

  // Count existing requests from this identifier in the current window
  const recentCount = await prisma.auditEvent.count({
    where: {
      action: "RATE_LIMIT_REQUEST",
      ipAddress: identifier,
      createdAt: { gte: windowStart },
    },
  });

  if (recentCount >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt };
  }

  // Log this request (non-blocking — fire and forget is safe here since
  // even if the write is slightly delayed the count is approximate by design)
  prisma.auditEvent.create({
    data: {
      action: "RATE_LIMIT_REQUEST",
      category: "SYSTEM",
      severity: "INFO",
      ipAddress: identifier,
    },
  }).catch(() => { /* Soft fail — rate limit logging must never crash the API route */ });

  const remaining = maxRequests - recentCount - 1;
  return { allowed: true, remaining: Math.max(0, remaining), resetAt };
}
