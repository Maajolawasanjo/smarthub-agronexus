import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { recordAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    const auth = await getAdminSession();
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admin authorization required." }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
        farmerProfile: {
          select: {
            id: true,
            farmName: true,
            farmDescription: true,
            farmAddress: true,
            state: true,
            lga: true,
            verificationStatus: true,
            _count: {
              select: {
                products: true,
              },
            },
          },
        },
        buyerProfile: {
          select: {
            id: true,
            address: true,
            state: true,
            lga: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching system users API:", error);
    return NextResponse.json(
      { error: "Internal server error fetching system users." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await getAdminSession();
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admin authorization required." }, { status: 403 });
    }

    const body = await req.json();
    const { userId, isActive } = body;

    if (!userId || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "userId and boolean isActive status are required." }, { status: 400 });
    }

    // Atomic update of user status and session revocation if deactivated
    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { isActive },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          updatedAt: true,
        },
      });

      if (!isActive) {
        await tx.session.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }

      return user;
    });

    await recordAuditEvent({
      category: "USER",
      severity: isActive ? "INFO" : "WARNING",
      action: `User account ${isActive ? "activated" : "suspended"}`,
      actorId: auth.userId,
      actorEmail: auth.user.email,
      resourceType: "User",
      resourceId: updatedUser.id,
      metadata: { targetEmail: updatedUser.email, newIsActiveStatus: isActive },
      req,
    });

    return NextResponse.json({ user: updatedUser, message: `User status updated to ${isActive ? "active" : "suspended"}` }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error updating user status:", error);
    return NextResponse.json({ error: "Internal server error updating user status." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAdminSession();
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admin authorization required." }, { status: 403 });
    }

    // CSRF origin validation for user creation
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const expectedOrigin = new URL(appUrl).origin;
    if ((origin && origin !== expectedOrigin) || (referer && !referer.startsWith(expectedOrigin))) {
      return NextResponse.json({ error: "Forbidden: Cross-origin mutation forbidden." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { fullName, email, phoneNumber, password, role, farmName, farmDescription, farmAddress, state, lga, address } = body;

    if (!fullName || !email || !phoneNumber) {
      return NextResponse.json({ error: "Full name, email, and phone number are required." }, { status: 400 });
    }

    const targetRole = (role || "BUYER").toUpperCase();
    if (!["BUYER", "FARMER", "ADMIN"].includes(targetRole)) {
      return NextResponse.json({ error: "Invalid role specified." }, { status: 400 });
    }

    const { AdminUserService } = await import("@/services/admin-user.service");
    const createdUser = await AdminUserService.createUser({
      fullName,
      email,
      phoneNumber,
      password,
      role: targetRole as "BUYER" | "FARMER" | "ADMIN",
      farmName,
      farmDescription,
      farmAddress,
      state,
      lga,
      address,
      adminUserId: auth.userId,
      adminEmail: auth.user.email,
      req,
    });

    return NextResponse.json({ user: createdUser, message: "User account successfully created." }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user via admin API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user account." },
      { status: error.message?.includes("already registered") ? 400 : 500 }
    );
  }
}
