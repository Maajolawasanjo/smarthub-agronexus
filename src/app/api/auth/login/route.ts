import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import {
  createRealmSession,
  setRealmSessionCookie,
  setSessionCookie,
  isRealmAllowed,
  AuthRealm,
  VAULT_COOKIE_NAME,
} from "@/lib/session";
import { formatAuthenticatedUser } from "@/lib/user-dto";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON request payload." },
        { status: 400 }
      );
    }

    const { email, password, requestedRealm } = body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Query user from database with profile relations
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        buyerProfile: true,
        farmerProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Your account has been deactivated. Please contact administrator support." },
        { status: 403 }
      );
    }

    // 2. Verify password against database hash
    if (!user.password) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 3. Determine target realm and enforce strict authorization
    let targetRealm: AuthRealm;
    if (user.role === "ADMIN") {
      targetRealm = AuthRealm.ADMIN;
    } else if (user.role === "FARMER") {
      targetRealm = AuthRealm.FARMER;
    } else {
      targetRealm = AuthRealm.BUYER;
    }

    const requested = requestedRealm || req.headers.get("x-auth-realm");
    if (requested && typeof requested === "string") {
      const normalizedReq = requested.toUpperCase() as AuthRealm;
      if (normalizedReq === AuthRealm.ADMIN && user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Administrative privileges required." },
          { status: 403 }
        );
      }
      if (!isRealmAllowed(user.role, normalizedReq)) {
        return NextResponse.json(
          { error: `Account role ${user.role} cannot authenticate into ${normalizedReq} realm.` },
          { status: 403 }
        );
      }
      targetRealm = normalizedReq;
    }

    // 4. Retrieve or initialize browser vault anchor
    const cookieStore = await cookies();
    let vaultId = cookieStore.get(VAULT_COOKIE_NAME)?.value;
    if (!vaultId) {
      vaultId = `vlt_${crypto.randomUUID()}`;
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || undefined;
    const ua = req.headers.get("user-agent") || undefined;

    // 5. Create active Session record in database (last-login-wins)
    const { rawSecret } = await createRealmSession(
      user.id,
      targetRealm,
      vaultId,
      ip,
      ua
    );

    // 6. Set only the target realm cookie and ensure vault ID cookie exists
    await setRealmSessionCookie(targetRealm, rawSecret, vaultId);

    // 7. Maintain legacy cookie for backward compatibility during rollout
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 8. Format standardized user payload
    const userPayload = formatAuthenticatedUser(user);

    return NextResponse.json(
      {
        message: "Login successful.",
        user: userPayload,
        realm: targetRealm,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error in POST /api/auth/login:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred during login. Please try again." },
      { status: 500 }
    );
  }
}
