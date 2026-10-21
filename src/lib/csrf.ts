/**
 * Browser-cookie mutation CSRF guard for SmartHub AgroChain.
 *
 * Origin is never derived from the request Host or X-Forwarded-Host (both can
 * be attacker controlled). Only operator-controlled deployment settings or
 * the known canonical production host can establish a trusted origin.
 *
 * This complements, never replaces, realm/role/ownership authorization.
 */
export const PRODUCTION_ORIGIN = "https://www.smarthubagrochain.online";
const DEVELOPMENT_ORIGIN = "http://localhost:3000";

function trustedDeploymentOrigin(): string | null {
  const production = process.env.NODE_ENV === "production";
  const configured =
    process.env.APP_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();

  // Vercel's trusted deployment URL is appropriate ONLY for a preview build.
  // Preview databases and credentials must remain isolated from production.
  const candidate = configured ||
    (production && process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : production ? PRODUCTION_ORIGIN : DEVELOPMENT_ORIGIN);

  try {
    const parsed = new URL(candidate);
    if (parsed.username || parsed.password || parsed.search || parsed.hash ||
        parsed.pathname !== "/" || !["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }
    // Never allow an http:// deployment override on a production build.
    if (production && parsed.protocol !== "https:") return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

/**
 * Require at least one browser-supplied Origin or Referer on cookie-backed
 * mutations, with every supplied source matching the trusted deployment
 * origin exactly. No prefix matching, localhost bypass or default allow.
 *
 * Requests lacking both headers are rejected instead of silently opting
 * out of CSRF protection. Nonbrowser clients must use a separate explicitly
 * authenticated API workflow (not a cookie mutation endpoint).
 */
export function isTrustedMutationOrigin(req: Request): boolean {
  const expected = trustedDeploymentOrigin();
  if (!expected) return false;

  const fetchSite = req.headers.get("sec-fetch-site")?.toLowerCase();
  if (fetchSite && !["same-origin", "none"].includes(fetchSite)) return false;

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  if (!origin && !referer) return false;

  if (origin) {
    try {
      const parsed = new URL(origin);
      if (parsed.origin !== expected || parsed.href !== parsed.origin + "/" ||
          parsed.username || parsed.password) return false;
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      const parsed = new URL(referer);
      if (parsed.origin !== expected || parsed.username || parsed.password ||
          !["http:", "https:"].includes(parsed.protocol)) return false;
    } catch {
      return false;
    }
  }

  return true;
}
