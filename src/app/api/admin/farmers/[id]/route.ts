import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { recordAuditEvent } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAdminSession();
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admin authorization required." }, { status: 403 });
    }

    const { id } = await params;

    const farmer = await prisma.farmerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            profileImage: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        verification: true,
        products: {
          include: {
            category: true,
            images: true,
            inventory: true,
          },
          orderBy: { createdAt: "desc" },
        },
        sellerOrders: {
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!farmer) {
      return NextResponse.json({ error: "Farmer profile not found." }, { status: 404 });
    }

    return NextResponse.json({ farmer });
  } catch (error) {
    console.error("Error fetching farmer 360 details:", error);
    return NextResponse.json(
      { error: "Internal server error fetching farmer details." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAdminSession();
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admin authorization required." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { verificationStatus, isActive, remarks } = body;

    const existingFarmer = await prisma.farmerProfile.findUnique({
      where: { id },
      include: { user: true, verification: true },
    });

    if (!existingFarmer) {
      return NextResponse.json({ error: "Farmer profile not found." }, { status: 404 });
    }

    // Execute atomic update
    const updated = await prisma.$transaction(async (tx) => {
      let updatedFarmer = existingFarmer;

      // 1. Update verificationStatus if provided
      if (
        verificationStatus &&
        ["APPROVED", "PENDING", "REJECTED"].includes(verificationStatus)
      ) {
        updatedFarmer = await tx.farmerProfile.update({
          where: { id },
          data: { verificationStatus },
          include: { user: true, verification: true },
        });

        // Also update or link verification record if it exists
        if (existingFarmer.verification) {
          await tx.verification.update({
            where: { id: existingFarmer.verification.id },
            data: {
              reviewedById: auth.userId,
              reviewedAt: new Date(),
              remarks: remarks || existingFarmer.verification.remarks,
            },
          });
        }
      }

      // 2. Update user isActive status if provided
      if (typeof isActive === "boolean") {
        await tx.user.update({
          where: { id: existingFarmer.userId },
          data: { isActive },
        });

        // Revoke active sessions if account is deactivated
        if (!isActive) {
          await tx.session.updateMany({
            where: { userId: existingFarmer.userId, revokedAt: null },
            data: { revokedAt: new Date() },
          });
        }
      }

      return updatedFarmer;
    });

    // 3. Record audit logs
    if (verificationStatus) {
      await recordAuditEvent({
        category: "KYC",
        severity: verificationStatus === "APPROVED" ? "INFO" : "WARNING",
        action: `Farmer verification status set to ${verificationStatus}`,
        actorId: auth.userId,
        actorEmail: auth.user.email,
        resourceType: "FarmerProfile",
        resourceId: id,
        metadata: {
          farmName: existingFarmer.farmName,
          farmerUserId: existingFarmer.userId,
          newStatus: verificationStatus,
          remarks,
        },
        req,
      });

      // Send notification to farmer
      await createNotification({
        userId: existingFarmer.userId,
        title: `Verification Status: ${verificationStatus}`,
        message:
          verificationStatus === "APPROVED"
            ? "Congratulations! Your farm profile has been officially verified by Smarthub AgroChain Administration. You now have the Verified Producer badge."
            : `Your verification status was updated to ${verificationStatus}.${remarks ? ` Note: ${remarks}` : ""}`,
        type: "SYSTEM",
      });
    }

    if (typeof isActive === "boolean") {
      await recordAuditEvent({
        category: "USER",
        severity: isActive ? "INFO" : "WARNING",
        action: `Farmer account ${isActive ? "reinstated" : "suspended"}`,
        actorId: auth.userId,
        actorEmail: auth.user.email,
        resourceType: "User",
        resourceId: existingFarmer.userId,
        metadata: {
          farmName: existingFarmer.farmName,
          email: existingFarmer.user.email,
          isActive,
        },
        req,
      });

      await createNotification({
        userId: existingFarmer.userId,
        title: isActive ? "Account Reinstated" : "Account Suspended",
        message: isActive
          ? "Your farmer account has been reactivated. You may now access all platform features and list produce."
          : "Your account has been temporarily suspended by Smarthub AgroChain Administration. Please contact support.",
        type: "SYSTEM",
      });
    }

    return NextResponse.json({
      message: "Farmer updated successfully.",
      farmer: updated,
    });
  } catch (error) {
    console.error("Error updating farmer:", error);
    return NextResponse.json(
      { error: "Internal server error updating farmer profile." },
      { status: 500 }
    );
  }
}
