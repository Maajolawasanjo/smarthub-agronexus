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

    const {
      fullName,
      email,
      phoneNumber,
      phone,
      password,
      role = "BUYER",
      farmName,
      farmAddress,
      state,
      lga,
      address,
    } = body;

    const userPhone = (phoneNumber || phone || "").trim();

    // 1. Strict validation
    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      return NextResponse.json(
        { error: "Full name is required." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    if (!userPhone) {
      return NextResponse.json(
        { error: "Phone number is required." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = userPhone.trim();
    const requestedRole = String(role).toUpperCase();
    const targetRole = requestedRole === "FARMER" ? "FARMER" : requestedRole === "ADMIN" ? "ADMIN" : "BUYER";

    if (targetRole === "FARMER" && (!farmName || !farmName.trim())) {
      return NextResponse.json(
        { error: "Farm name is required for farmer registration." },
        { status: 400 }
      );
    }

    // 2. Check for duplicate email or phone number
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { phoneNumber: normalizedPhone },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return NextResponse.json(
          { error: "An account with this email address already exists." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "An account with this phone number already exists." },
        { status: 409 }
      );
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create user and profile in an atomic Prisma database transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          fullName: fullName.trim(),
          email: normalizedEmail,
          phoneNumber: normalizedPhone,
          password: hashedPassword,
          role: targetRole,
        },
      });

      if (targetRole === "FARMER") {
        await tx.farmerProfile.create({
          data: {
            userId: createdUser.id,
            farmName: farmName.trim(),
            farmAddress: (farmAddress || address || "Farm Location").trim(),
            state: (state || "Oyo").trim(),
            lga: (lga || "Ibadan").trim(),
          },
        });
      } else if (targetRole === "BUYER") {
        await tx.buyerProfile.create({
          data: {
            userId: createdUser.id,
            address: address?.trim() || null,
            state: state?.trim() || null,
            lga: lga?.trim() || null,
          },
        });
      }

      // Fetch user with newly created profile relation
      return await tx.user.findUniqueOrThrow({
        where: { id: createdUser.id },
        include: {
          buyerProfile: true,
          farmerProfile: true,
        },
      });
    });

    // 5. Establish HTTP-only session cookie
    await setSessionCookie({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    // 6. Format standardized user payload
    const userPayload = formatAuthenticatedUser(newUser);

    return NextResponse.json(
      {
        message: "Account created successfully.",
        user: userPayload,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[REGISTER_TELEMETRY_ERROR] Detailed Catch Output:", {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack?.split("\n")?.slice(0, 5),
    });

    // Handle Prisma Unique Constraint Error (P2002)
    if (error?.code === "P2002") {
      const targetField = error?.meta?.target ? (Array.isArray(error.meta.target) ? error.meta.target.join(", ") : error.meta.target) : "field";
      return NextResponse.json(
        { error: `An account with this ${targetField} already exists.` },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        error: "An unexpected server error occurred during registration. Please try again.",
        details: process.env.NODE_ENV !== "production" ? (error?.message || String(error)) : undefined 
      },
      { status: 500 }
    );
  }
}
