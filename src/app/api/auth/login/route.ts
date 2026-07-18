import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Find user in database with profile relations
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
        { error: "Your account has been deactivated. Please contact support." },
        { status: 403 }
      );
    }

    // 2. Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 3. Format user profile payload for client
    const userPayload = {
      id: user.id,
      fullName: user.fullName,
      name: user.fullName, // Frontend compatibility alias
      email: user.email,
      phoneNumber: user.phoneNumber,
      phone: user.phoneNumber, // Alias
      role: user.role.toLowerCase(), // "buyer" | "farmer" | "admin"
      isActive: user.isActive,
      profileImage: "/avatar-1.png",
      country: "Nigeria",
      currency: "NGN",
      ...(user.farmerProfile
        ? {
            farmName: user.farmerProfile.farmName,
            farmAddress: user.farmerProfile.farmAddress,
            state: user.farmerProfile.state,
            lga: user.farmerProfile.lga,
            verificationStatus: user.farmerProfile.verificationStatus,
          }
        : {}),
      ...(user.buyerProfile
        ? {
            address: user.buyerProfile.address,
            state: user.buyerProfile.state,
          }
        : {}),
    };

    return NextResponse.json(
      {
        message: "Login successful.",
        user: userPayload,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in login API:", error);
    return NextResponse.json(
      { error: "Internal server error during authentication." },
      { status: 500 }
    );
  }
}
