import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ============================================================================
// MULTI-REALM EDGE ROUTING & PRESENCE GATE (V4.1-FINAL-CORRECTED)
// Model A: Independent Authenticated Role Contexts within a Shared Browser Origin
//
// Middleware is an EARLY ROUTING/PRESENCE GATE.
// It is NOT the authoritative authentication layer.
// Node.js server handlers and API routes read HttpOnly cookies directly
// and execute authoritative PostgreSQL Session verification.
// ============================================================================

const VAULT_COOKIE_NAME = "smarthub_vault_id";
const LEGACY_SESSION_COOKIE_NAME = "smarthub_session";

const REALM_COOKIE_NAMES = {
  ADMIN: "smarthub_admin_token",
  FARMER: "smarthub_farmer_token",
  BUYER: "smarthub_buyer_token",
} as const;

interface LegacyPayload {
  userId: string;
  email: string;
  role: "BUYER" | "FARMER" | "ADMIN";
  exp: number;
}

function base64urlDecode(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function verifyEdgeLegacyToken(token: string): Promise<LegacyPayload | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;

    const keyMaterial = new TextEncoder().encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyMaterial,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signedData = new TextEncoder().encode(`${header}.${body}`);
    const signatureBytes = base64urlDecode(signature);
    const isValid = await crypto.subtle.verify("HMAC", cryptoKey, signatureBytes, signedData);

    if (!isValid) return null;

    const payloadJson = new TextDecoder().decode(base64urlDecode(body));
    const payload: LegacyPayload = JSON.parse(payloadJson);

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

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
  const legacyToken = req.cookies.get(LEGACY_SESSION_COOKIE_NAME)?.value;

  // If realm token exists for the required realm, proceed to Node.js handler
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

  // If no realm token, check legacy token for rolling migration support
  if (legacyToken) {
    const legacySession = await verifyEdgeLegacyToken(legacyToken);
    if (legacySession) {
      const legacyRole = legacySession.role?.toUpperCase();

      // Role check for legacy token
      let isAuthorized = false;
      if (requiredRealm === "ADMIN") {
        isAuthorized = legacyRole === "ADMIN";
      } else if (requiredRealm === "FARMER") {
        isAuthorized = legacyRole === "FARMER" || legacyRole === "ADMIN";
      } else if (requiredRealm === "BUYER") {
        isAuthorized = legacyRole === "BUYER";
      }

      if (!isAuthorized) {
        if (isApiRoute) {
          return attachSecurityHeaders(
            NextResponse.json(
              {
                success: false,
                error: {
                  code: "FORBIDDEN",
                  message: `Privileges for ${requiredRealm.toLowerCase()} required.`,
                },
              },
              { status: 403 }
            )
          );
        }

        // Page redirects for legacy role mismatch
        if (legacyRole === "BUYER") return attachSecurityHeaders(NextResponse.redirect(new URL("/dashboard", req.url)));
        if (legacyRole === "FARMER") return attachSecurityHeaders(NextResponse.redirect(new URL("/farmer", req.url)));
        if (legacyRole === "ADMIN") return attachSecurityHeaders(NextResponse.redirect(new URL("/admin/overview", req.url)));
        return attachSecurityHeaders(NextResponse.redirect(new URL("/login", req.url)));
      }

      requestHeaders.set("x-internal-auth-realm", requiredRealm);
      return attachSecurityHeaders(
        NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
      );
    }
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
