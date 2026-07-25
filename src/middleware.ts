import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "smarthub_session";

interface SessionPayload {
  userId: string;
  email: string;
  role: "BUYER" | "FARMER" | "ADMIN";
  exp: number;
}

function parseEdgeSessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const body = parts[1];

    // Base64Url decoding compatible with Next.js Edge Runtime
    const base64 = body.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload: SessionPayload = JSON.parse(jsonPayload);

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
  const session = token ? parseEdgeSessionToken(token) : null;

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
