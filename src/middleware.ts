import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "smarthub_session";

interface SessionPayload {
  userId: string;
  email: string;
  role: "BUYER" | "FARMER" | "ADMIN";
  exp: number;
}

/**
 * Decode a base64url string to a Uint8Array (Edge Runtime compatible).
 * Uses explicit new ArrayBuffer() so the result is typed as Uint8Array<ArrayBuffer>
 * (not Uint8Array<ArrayBufferLike>), which satisfies SubtleCrypto's BufferSource param.
 */
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

/**
 * Verify JWT signature using Web Crypto SubtleCrypto (HMAC-SHA256).
 * Compatible with Next.js Edge Runtime — no Node.js crypto required.
 * Returns the verified payload, or null if signature/expiry is invalid.
 */
async function verifyEdgeSessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;

    // Import key for HMAC-SHA256 verification
    const keyMaterial = new TextEncoder().encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyMaterial,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Verify the signature against header.body
    const signedData = new TextEncoder().encode(`${header}.${body}`);
    const signatureBytes = base64urlDecode(signature);
    const isValid = await crypto.subtle.verify("HMAC", cryptoKey, signatureBytes, signedData);

    if (!isValid) {
      return null; // Forged or tampered token — reject immediately
    }

    // Decode verified payload
    const payloadJson = new TextDecoder().decode(base64urlDecode(body));
    const payload: SessionPayload = JSON.parse(payloadJson);

    // Check expiry
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

  // 1. Prepare Response with Security Headers
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isFarmerRoute = pathname.startsWith("/farmer");
  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/login";

  if (!isDashboardRoute && !isFarmerRoute && !isAdminRoute) {
    return response;
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  // Use cryptographic verification — never trust a token without checking the signature
  const session = token ? await verifyEdgeSessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = session.role?.toUpperCase();

  // Role-Based Authorization Enforcement & Portal Isolation
  if (isFarmerRoute) {
    if (userRole === "BUYER") return NextResponse.redirect(new URL("/dashboard", req.url));
    if (userRole === "ADMIN") return NextResponse.redirect(new URL("/admin/overview", req.url));
    if (userRole !== "FARMER") return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isDashboardRoute) {
    if (userRole === "FARMER") return NextResponse.redirect(new URL("/farmer", req.url));
    if (userRole === "ADMIN") return NextResponse.redirect(new URL("/admin/overview", req.url));
    if (userRole !== "BUYER") return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAdminRoute && userRole !== "ADMIN") {
    if (userRole === "FARMER") return NextResponse.redirect(new URL("/farmer", req.url));
    if (userRole === "BUYER") return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/farmer/:path*",
    "/admin/:path*",
  ],
};
