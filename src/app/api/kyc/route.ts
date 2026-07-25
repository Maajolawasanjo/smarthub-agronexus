import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { evaluateTrustPolicy, calculateVerificationStage, generateVerificationTimeline, calculateNextAction } from "@/lib/trust";
import { VerificationDTO } from "@/dto";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        farmerProfile: {
          include: {
            verification: {
              include: {
                reviewedBy: {
                  select: { id: true, fullName: true, email: true }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    const farmer = user.farmerProfile;
    const verification = farmer?.verification;
    const status = farmer?.verificationStatus || "PENDING";
    const policy = evaluateTrustPolicy(status);
    const stage = calculateVerificationStage(Boolean(farmer), Boolean(verification), status);
    const timeline = generateVerificationTimeline(user.createdAt, verification, status);
    const nextAction = calculateNextAction(stage, verification?.remarks);

    const dto: VerificationDTO = {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
      farmer: farmer ? {
        id: farmer.id,
        farmName: farmer.farmName,
        farmAddress: farmer.farmAddress,
        state: farmer.state,
        lga: farmer.lga,
      } : undefined,
      status: status === "APPROVED" ? "VERIFIED_PRODUCER" : status,
      badge: policy.badge,
      verificationStage: stage,
      verificationTimeline: timeline,
      document: verification ? {
        id: verification.id,
        documentType: verification.documentType,
        documentNumber: verification.documentNumber,
        documentUrl: verification.documentUrl,
        submittedAt: verification.createdAt.toISOString(),
      } : null,
      reviewer: verification?.reviewedBy ? {
        id: verification.reviewedBy.id,
        fullName: verification.reviewedBy.fullName,
        email: verification.reviewedBy.email,
      } : null,
      submittedAt: verification ? verification.createdAt.toISOString() : null,
      reviewedAt: verification?.reviewedAt ? verification.reviewedAt.toISOString() : null,
      remarks: verification?.remarks || null,
      canPublishProducts: policy.canPublishProducts,
      canWithdraw: policy.canWithdraw,
      canReceiveEscrow: policy.canReceiveEscrow,
      dailyWithdrawalLimit: policy.dailyWithdrawalLimit,
      listingLimit: policy.listingLimit,
      marketplaceVisible: policy.marketplaceVisible,
      nextRequiredAction: nextAction,
      resubmissionAllowed: status !== "APPROVED",
    };

    return NextResponse.json(dto);
  } catch (error) {
    console.error("Error in GET /api/kyc:", error);
    return NextResponse.json({ error: "Internal server error fetching trust verification state." }, { status: 500 });
  }
}
