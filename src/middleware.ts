import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ============================================================================
// MULTI-REALM EDGE ROUTING & PRESENCE GATE (Phase 0-B)
// Model A: Independent Authenticated Role Contexts within a Shared Browser Origin
//
// Middleware is an EARLY ROUTING/PRESENCE GATE.
// It is NOT the authoritative authentication layer.
// Node.js server handlers and API routes read HttpOnly cookies directly
// and execute authoritative PostgreSQL Session verification.
// ============================================================================

const VAULT_COOKIE_NAME = "smarthub_vault_id";
const REALM_COOKIE_NAMES = {
  ADMIN: "smarthub_admin_token",
  FARMER: "smarthub_farmer_token",
  BUYER: "smarthub_buyer_token",
} as const;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Sanitize incoming request headers: Strip untrusted client-supplied internal headers
  const requestHeaders = new Headers(req.headers);
  for (const key of Array.from(requestHeaders.keys())) {
    if (key.toLowerCase().startsWith("x-internal-auth")) {
      requestHeaders.delete(key);
    }
  }

  // 2. Classify Dedicated Route Realms
  const isAdminApi = pathname.startsWith("/api/admin");
  const isFarmerApi = pathname.startsWith("/api/farmer");
  const isBuyerApi = pathname.startsWith("/api/buyer");

  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isFarmerPage = pathname.startsWith("/farmer");
  const isBuyerPage = pathname.startsWith("/dashboard");

  let requiredRealm: "ADMIN" | "FARMER" | "BUYER" | null = null;
  let isApiRoute = false;

  if (isAdminApi || isAdminPage) {
    requiredRealm = "ADMIN";
    isApiRoute = isAdminApi;
  } else if (isFarmerApi || isFarmerPage) {
    requiredRealm = "FARMER";
    isApiRoute = isFarmerApi;
  } else if (isBuyerApi || isBuyerPage) {
    requiredRealm = "BUYER";
    isApiRoute = isBuyerApi;
  }

  const attachSecurityHeaders = (res: NextResponse) => {
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set("X-XSS-Protection", "1; mode=block");
    return res;
  };

  // If public or shared route, proceed with sanitized headers
  if (!requiredRealm) {
    return attachSecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // 3. Check for realm cookie presence
  const targetCookieName = REALM_COOKIE_NAMES[requiredRealm];
  const realmToken = req.cookies.get(targetCookieName)?.value;

  // A realm cookie is a presence hint only; Node.js verifies the PostgreSQL session,
  // role, user activity and expiry before authorizing every protected operation.
  if (realmToken) {
    requestHeaders.set("x-internal-auth-realm", requiredRealm);
    const vaultId = req.cookies.get(VAULT_COOKIE_NAME)?.value;
    if (vaultId) requestHeaders.set("x-internal-auth-vault-id", vaultId);

    return attachSecurityHeaders(
      NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    );
  }

  // 4. Missing or invalid credential: 401 or redirect
  if (isApiRoute) {
    return attachSecurityHeaders(
      NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: `Authentication required for ${requiredRealm.toLowerCase()} portal.`,
          },
        },
        { status: 401 }
      )
    );
  }

  const redirectPath = requiredRealm === "ADMIN" ? "/admin/login" : "/login";
  const loginUrl = new URL(redirectPath, req.url);
  loginUrl.searchParams.set("redirect", pathname);
  return attachSecurityHeaders(NextResponse.redirect(loginUrl));
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/farmer/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/farmer/:path*",
    "/api/buyer/:path*",
  ],
};
