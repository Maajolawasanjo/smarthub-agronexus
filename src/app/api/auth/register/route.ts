import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fullName,
      email,
      phoneNumber,
      password,
      role = "BUYER",
      farmName,
      farmAddress,
      state,
      lga,
      country,
      address,
    } = body;

    // 1. Basic validation
    if (!fullName || !email || !phoneNumber || !password) {
      return NextResponse.json(
        { error: "Full name, email, phone number, and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phoneNumber.trim();

    // 2. Check existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { phoneNumber: normalizedPhone },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or phone number already exists." },
        { status: 409 }
      );
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create user and profile in transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const userRole = role.toUpperCase() === "FARMER" ? "FARMER" : role.toUpperCase() === "ADMIN" ? "ADMIN" : "BUYER";

      const createdUser = await tx.user.create({
        data: {
          fullName: fullName.trim(),
          email: normalizedEmail,
          phoneNumber: normalizedPhone,
          password: hashedPassword,
          role: userRole,
        },
      });

      if (userRole === "FARMER") {
        await tx.farmerProfile.create({
          data: {
            userId: createdUser.id,
            farmName: farmName?.trim() || `${fullName}'s Farm`,
            farmAddress: farmAddress?.trim() || address?.trim() || "Default Farm Address",
            state: state?.trim() || "Oyo",
            lga: lga?.trim() || "Ibadan North",
          },
        });
      } else if (userRole === "BUYER") {
        await tx.buyerProfile.create({
          data: {
            userId: createdUser.id,
            address: address?.trim() || farmAddress?.trim() || undefined,
            state: state?.trim() || undefined,
            lga: lga?.trim() || undefined,
          },
        });
      }

      return createdUser;
    });

    // 5. Return sanitized user response
    return NextResponse.json(
      {
        message: "Account created successfully.",
        user: {
          id: newUser.id,
          fullName: newUser.fullName,
          email: newUser.email,
          phoneNumber: newUser.phoneNumber,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in registration API:", error);
    return NextResponse.json(
      { error: "Internal server error while creating user." },
      { status: 500 }
    );
  }
}
