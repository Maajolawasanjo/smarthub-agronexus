import crypto from "crypto";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "smarthub-agrochain-production-secret-key-2026";
export const SESSION_COOKIE_NAME = "smarthub_session";

export interface SessionPayload {
  userId: string;
  email: string;
  role: "BUYER" | "FARMER" | "ADMIN";
  exp: number;
}

/**
 * Sign a payload using HMAC SHA-256 JWT string
 */
export function signSessionToken(payload: Omit<SessionPayload, "exp">, expiresInDays = 7): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60;
  const fullPayload: SessionPayload = { ...payload, exp };

  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${signature}`;
}

/**
 * Verify JWT signature and expiration
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;

    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");

    if (signature !== expectedSignature) return null;

    const payload: SessionPayload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Helper to set secure session HTTP-only cookie
 */
export async function setSessionCookie(payload: Omit<SessionPayload, "exp">) {
  const token = signSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
  return token;
}

/**
 * Helper to clear session cookie
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Get current session payload from request cookies
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
