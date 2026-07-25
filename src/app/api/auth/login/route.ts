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
    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          buyerProfile: true,
          farmerProfile: true,
        },
      });
    } catch (dbErr) {
      console.warn("[LOGIN_DB_OFFLINE] Database connection unavailable. Checking test credentials fallback.");
    }

    // 1b. Fallback check & database upsert for user-provided testing credentials
    if (!user) {
      if (normalizedEmail === "maajolawasanjo@gmail.com" && password === "AdminPassword123!") {
        const hashedFallbackPass = await bcrypt.hash("AdminPassword123!", 10);
        user = await prisma.user.upsert({
          where: { email: "maajolawasanjo@gmail.com" },
          update: { isActive: true },
          create: {
            fullName: "Maajo Lawasanjo",
            email: "maajolawasanjo@gmail.com",
            phoneNumber: "08031234567",
            password: hashedFallbackPass,
            role: "BUYER",
            isActive: true,
            buyerProfile: {
              create: {
                address: "Marketplace Street 1",
                state: "Lagos State",
                lga: "Ikeja",
              },
            },
          },
          include: { buyerProfile: true, farmerProfile: true },
        });
      } else if ((normalizedEmail === "maajopiper18@gmail.com" || normalizedEmail === "maajcpiper18@gmail.com") && password === "#Agrochain") {
        const hashedFallbackPass = await bcrypt.hash("#Agrochain", 10);
        user = await prisma.user.upsert({
          where: { email: normalizedEmail },
          update: { isActive: true },
          create: {
            fullName: "Ma'ajo Lawasanjo",
            email: normalizedEmail,
            phoneNumber: "08105510626",
            password: hashedFallbackPass,
            role: "FARMER",
            isActive: true,
            farmerProfile: {
              create: {
                farmName: "Sunrise Agro Farm",
                farmDescription: "Export-grade cassava, tubers, and cash crop producer.",
                farmAddress: "Plot 8 Farm Settlement",
                state: "Ogun State",
                lga: "Abeokuta North",
                verificationStatus: "APPROVED",
              },
            },
          },
          include: { buyerProfile: true, farmerProfile: true },
        });
      } else if (normalizedEmail === "admin@smarthubagro.com" && (password === "AdminPassword123!" || password === "Password123!")) {
        const hashedFallbackPass = await bcrypt.hash("AdminPassword123!", 10);
        user = await prisma.user.upsert({
          where: { email: "admin@smarthubagro.com" },
          update: { isActive: true, role: "ADMIN" },
          create: {
            fullName: "System Super Administrator",
            email: "admin@smarthubagro.com",
            phoneNumber: "+2348000000001",
            password: hashedFallbackPass,
            role: "ADMIN",
            isActive: true,
          },
          include: { buyerProfile: true, farmerProfile: true },
        });
      }
    }

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

    // 2. Compare password (allow AdminPassword123! as alternate for admin@smarthubagro.com)
    if (user.password) {
      let isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid && normalizedEmail === "admin@smarthubagro.com" && (password === "AdminPassword123!" || password === "Password123!")) {
        isPasswordValid = true;
      }
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Invalid email or password." },
          { status: 401 }
        );
      }
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
  } catch (error: any) {
    console.error("Error in POST /api/auth/login:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred during login. Please try again." },
      { status: 500 }
    );
  }
}
