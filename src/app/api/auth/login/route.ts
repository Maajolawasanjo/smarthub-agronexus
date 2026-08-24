import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";
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

    const { email, password } = body;

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

    // 3. Create HTTP-only session cookie
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 4. Format standardized user payload
    const userPayload = formatAuthenticatedUser(user);

    return NextResponse.json(
      {
        message: "Login successful.",
        user: userPayload,
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
