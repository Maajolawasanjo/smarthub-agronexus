import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { recordAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
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
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admin authorization required." }, { status: 403 });
    }

    const body = await req.json();
    const { userId, isActive } = body;

    if (!userId || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "userId and boolean isActive status are required." }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
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

    await recordAuditEvent({
      category: "USER",
      severity: isActive ? "INFO" : "WARNING",
      action: `User account ${isActive ? "activated" : "suspended"}`,
      actorId: session.userId,
      actorEmail: session.email,
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
