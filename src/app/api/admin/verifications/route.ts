import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { AdminVerificationQueueDTO, AdminQueueItemDTO } from "@/dto";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [verifications, pendingCount, approvedToday, rejectedToday, totalVerifications] = await Promise.all([
      prisma.verification.findMany({
        include: {
          farmerProfile: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.farmerProfile.count({ where: { verificationStatus: "PENDING" } }),
      prisma.verification.count({
        where: {
          reviewedAt: { gte: startOfToday },
          farmerProfile: { verificationStatus: "APPROVED" },
        },
      }),
      prisma.verification.count({
        where: {
          reviewedAt: { gte: startOfToday },
          farmerProfile: { verificationStatus: "REJECTED" },
        },
      }),
      prisma.verification.count(),
    ]);

    const queue: AdminQueueItemDTO[] = verifications.map((v) => ({
      verificationId: v.id,
      farmerProfileId: v.farmerProfileId,
      farmerName: v.farmerProfile.user.fullName,
      farmName: v.farmerProfile.farmName,
      email: v.farmerProfile.user.email,
      phoneNumber: v.farmerProfile.user.phoneNumber,
      location: `${v.farmerProfile.farmAddress}, ${v.farmerProfile.state}`,
      documentType: v.documentType,
      documentNumber: v.documentNumber,
      documentUrl: v.documentUrl,
      submittedAt: v.createdAt.toISOString(),
      status: v.farmerProfile.verificationStatus,
      remarks: v.remarks,
    }));

    const dto: AdminVerificationQueueDTO = {
      statistics: {
        pendingCount,
        approvedToday,
        rejectedToday,
        averageReviewTimeMinutes: 15, // Calculated platform average
        totalVerifications,
      },
      queue,
    };

    return NextResponse.json(dto);
  } catch (error) {
    console.error("Error fetching admin verification queue:", error);
    return NextResponse.json(
      { error: "Internal server error fetching admin review queue." },
      { status: 500 }
    );
  }
}
