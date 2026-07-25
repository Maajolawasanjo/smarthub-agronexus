const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  limitWindowSeconds: number = 60,
  maxRequests: number = 60
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const windowMs = limitWindowSeconds * 1000;
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetAt) {
    const resetAt = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}
