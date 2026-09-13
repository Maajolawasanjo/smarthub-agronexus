import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AuthRealm, Role } from "@prisma/client";
import type { Session, User } from "@prisma/client";

// ============================================================================
// MULTI-REALM AUTHENTICATION ARCHITECTURE (V4.1-FINAL-CORRECTED)
// Model A: Independent Authenticated Role Contexts within a Shared Browser Origin
//
// SECURITY BOUNDARY NOTICE:
// Because all role contexts share the same origin, the server cannot cryptographically
// determine which physical browser tab generated a request. If the browser possesses
// multiple valid realm cookies, the browser sends them on ambient same-origin requests.
// The system provides INDEPENDENT ROLE SESSIONS, not physical tab execution isolation.
// ============================================================================

export const VAULT_COOKIE_NAME = "smarthub_vault_id";
export const LEGACY_SESSION_COOKIE_NAME = "smarthub_session";

export const REALM_COOKIE_NAMES = {
  ADMIN: "smarthub_admin_token",
  FARMER: "smarthub_farmer_token",
  BUYER: "smarthub_buyer_token",
} as const;

export const REALM_LIFETIMES = {
  ADMIN: 12 * 60 * 60, // 12 hours
  FARMER: 7 * 24 * 60 * 60, // 7 days
  BUYER: 7 * 24 * 60 * 60, // 7 days
  VAULT: 365 * 24 * 60 * 60, // 1 year
} as const;

export { AuthRealm };

export interface SessionPayload {
  userId: string;
  email: string;
  role: "BUYER" | "FARMER" | "ADMIN";
  exp?: number;
}

export interface AuthenticatedContext {
  session: Session;
  user: User;
  userId: string;
  role: Role;
  realm: AuthRealm;
}

/**
 * Strict Role / Realm Authorization Matrix:
 * ADMIN realm  -> ADMIN user only
 * FARMER realm -> FARMER user only
 * BUYER realm  -> BUYER user only
 * No implicit cross-role access.
 */
export function isRealmAllowed(userRole: Role, realm: AuthRealm): boolean {
  if (realm === AuthRealm.ADMIN) return userRole === Role.ADMIN;
  if (realm === AuthRealm.FARMER) return userRole === Role.FARMER;
  if (realm === AuthRealm.BUYER) return userRole === Role.BUYER;
  return false;
}

/**
 * Generate high-entropy 256-bit random session secret
 */
export function generateSessionSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Compute SHA-256 hash of raw session secret
 */
export function hashSessionSecret(rawSecret: string): string {
  return crypto.createHash("sha256").update(rawSecret).digest("hex");
}

/**
 * Create or rotate an authenticated Session record in PostgreSQL.
 * Last-login-wins semantics: atomically revokes prior active sessions for (vaultId, realm).
 */
export async function createRealmSession(
  userId: string,
  realm: AuthRealm,
  vaultId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ rawSecret: string; session: Session }> {
  const rawSecret = generateSessionSecret();
  const tokenHash = hashSessionSecret(rawSecret);
  const lifetimeSeconds = REALM_LIFETIMES[realm];
  const expiresAt = new Date(Date.now() + lifetimeSeconds * 1000);

  const session = await prisma.$transaction(async (tx) => {
    // 1. Revoke existing active sessions for this vault and realm
    await tx.session.updateMany({
      where: {
        vaultId,
        realm,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    // 2. Create the fresh session
    return tx.session.create({
      data: {
        vaultId,
        userId,
        realm,
        tokenHash,
        expiresAt,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  });

  return { rawSecret, session };
}

/**
 * Set discrete realm cookie and ensure vault ID cookie exists
 */
export async function setRealmSessionCookie(
  realm: AuthRealm,
  rawSecret: string,
  vaultId: string
) {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";

  // Ensure vault anchor cookie
  cookieStore.set(VAULT_COOKIE_NAME, vaultId, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: REALM_LIFETIMES.VAULT,
  });

  // Set realm cookie
  const cookieName = REALM_COOKIE_NAMES[realm];
  cookieStore.set(cookieName, rawSecret, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: REALM_LIFETIMES[realm],
  });
}

/**
 * Clear a specific realm cookie from the browser
 */
export async function clearRealmSessionCookie(realm: AuthRealm) {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  const cookieName = REALM_COOKIE_NAMES[realm];

  cookieStore.set(cookieName, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Revoke session in database and clear the realm cookie
 */
export async function revokeRealmSession(realm: AuthRealm, vaultId?: string) {
  const cookieStore = await cookies();
  const cookieName = REALM_COOKIE_NAMES[realm];
  const rawToken = cookieStore.get(cookieName)?.value;
  const effectiveVaultId = vaultId || cookieStore.get(VAULT_COOKIE_NAME)?.value;

  if (rawToken) {
    const tokenHash = hashSessionSecret(rawToken);
    await prisma.session.updateMany({
      where: {
        realm,
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  } else if (effectiveVaultId) {
    await prisma.session.updateMany({
      where: {
        vaultId: effectiveVaultId,
        realm,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  await clearRealmSessionCookie(realm);
}

/**
 * Authoritative Node.js session resolution reading HttpOnly realm cookies directly.
 * Verifies tokenHash in PostgreSQL, validates expiry, revocation, user.isActive, and role authorization.
 */
export async function getSessionContext(
  expectedRealm?: AuthRealm
): Promise<AuthenticatedContext | null> {
  const cookieStore = await cookies();

  const realmsToCheck: AuthRealm[] = expectedRealm
    ? [expectedRealm]
    : [AuthRealm.ADMIN, AuthRealm.FARMER, AuthRealm.BUYER];

  for (const realm of realmsToCheck) {
    const cookieName = REALM_COOKIE_NAMES[realm];
    const rawToken = cookieStore.get(cookieName)?.value;
    if (!rawToken) continue;

    const tokenHash = hashSessionSecret(rawToken);
    const session = await prisma.session.findFirst({
      where: {
        realm,
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: true,
      },
    });

    if (!session || !session.user || !session.user.isActive) {
      continue;
    }

    if (!isRealmAllowed(session.user.role, realm)) {
      continue;
    }

    return {
      session,
      user: session.user,
      userId: session.user.id,
      role: session.user.role,
      realm: session.realm,
    };
  }

  return null;
}

export async function getAdminSession(): Promise<AuthenticatedContext | null> {
  return getSessionContext(AuthRealm.ADMIN);
}

export async function getFarmerSession(): Promise<AuthenticatedContext | null> {
  return getSessionContext(AuthRealm.FARMER);
}

export async function getBuyerSession(): Promise<AuthenticatedContext | null> {
  return getSessionContext(AuthRealm.BUYER);
}

/**
 * Shared Endpoint Session Resolver:
 * For shared endpoints (such as /api/wallet or /api/notifications),
 * X-Auth-Realm is strictly a selector indicating which realm cookie to inspect.
 * It is NOT authentication, NOT authorization, and NOT physical-tab proof.
 */
export async function getSharedSession(
  req?: Request,
  allowedRealms: AuthRealm[] = [AuthRealm.FARMER, AuthRealm.BUYER]
): Promise<AuthenticatedContext | null> {
  let selectedRealm: AuthRealm | null = null;
  if (req) {
    const realmHeader = req.headers.get("x-auth-realm")?.toUpperCase() as AuthRealm;
    if (realmHeader && allowedRealms.includes(realmHeader)) {
      selectedRealm = realmHeader;
    }
  }

  if (selectedRealm) {
    return getSessionContext(selectedRealm);
  }

  // Fallback: check allowed realms in order
  for (const realm of allowedRealms) {
    const context = await getSessionContext(realm);
    if (context) return context;
  }

  return null;
}

/**
 * Backward compatibility helper for existing API handlers calling getSession().
 * First resolves against new multi-realm database sessions, with graceful fallback to legacy JWT.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const authContext = await getSessionContext();
  if (authContext) {
    return {
      userId: authContext.userId,
      email: authContext.user.email,
      role: authContext.role as "BUYER" | "FARMER" | "ADMIN",
      exp: Math.floor(authContext.session.expiresAt.getTime() / 1000),
    };
  }

  // Legacy fallback
  const cookieStore = await cookies();
  const legacyToken = cookieStore.get(LEGACY_SESSION_COOKIE_NAME)?.value;
  if (legacyToken) {
    return verifySessionToken(legacyToken);
  }

  return null;
}

/**
 * Legacy JWT Helpers (Maintained for smooth migration transition)
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error("CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing.");
  }
  return secret.trim();
}

export function signSessionToken(payload: Omit<SessionPayload, "exp">, expiresInDays = 7): string {
  const secret = getJwtSecret();
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60;
  const fullPayload: SessionPayload = { ...payload, exp };

  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");

  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const secret = getJwtSecret();
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
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

export async function setSessionCookie(payload: Omit<SessionPayload, "exp">) {
  // Sets legacy cookie alongside for transition if needed
  const token = signSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(LEGACY_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return token;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(LEGACY_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
