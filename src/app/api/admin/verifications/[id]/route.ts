import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, remarks } = body; // action: "APPROVE" | "REJECT"

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json(
        { error: "Invalid review action. Must be 'APPROVE' or 'REJECT'." },
        { status: 400 }
      );
    }

    if (action === "REJECT" && !remarks) {
      return NextResponse.json(
        { error: "Remarks explaining rejection reason are required when rejecting." },
        { status: 400 }
      );
    }

    const verification = await prisma.verification.findUnique({
      where: { id },
      include: {
        farmerProfile: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!verification) {
      return NextResponse.json({ error: "Verification record not found." }, { status: 404 });
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    // Transactionally update verification & farmer status
    await prisma.$transaction([
      prisma.verification.update({
        where: { id },
        data: {
          reviewedById: session.userId,
          reviewedAt: new Date(),
          remarks: remarks || (action === "APPROVE" ? "Approved by compliance team." : null),
        },
      }),
      prisma.farmerProfile.update({
        where: { id: verification.farmerProfileId },
        data: {
          verificationStatus: newStatus,
        },
      }),
    ]);

    logger.security(`Identity verification ${action.toLowerCase()}d by admin`, {
      adminId: session.userId,
      verificationId: id,
      farmerUserId: verification.farmerProfile.userId,
      status: newStatus,
    });

    // Publish domain event to Event Bus
    const { publishAgroEvent } = await import("@/lib/events");
    await publishAgroEvent(action === "APPROVE" ? "KYC_APPROVED" : "KYC_REJECTED", {
      userId: verification.farmerProfile.userId,
      remarks,
    });

    return NextResponse.json({
      message: `Verification successfully ${action.toLowerCase()}d.`,
      status: newStatus,
    });
  } catch (error) {
    logger.error("Error updating verification review status", error);
    return NextResponse.json(
      { error: "Internal server error updating verification status." },
      { status: 500 }
    );
  }
}
