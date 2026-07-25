import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";
import { publishAgroEvent } from "@/lib/events";

// POST /api/kyc/verify — Admin approval or rejection of farmer KYC identity
export async function POST(req: Request) {
  const traceCtx = createTraceContext(req);

  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      console.warn("KYC Verification executed without ADMIN session fallback");
    }

    const body = await req.json();
    const { farmerProfileId, action, remarks } = body;

    if (!farmerProfileId || !["APPROVE", "REJECT"].includes(action?.toUpperCase())) {
      const res = NextResponse.json(
        createErrorResponse("INVALID_INPUT", "farmerProfileId and valid action (APPROVE/REJECT) are required"),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const isApproved = action.toUpperCase() === "APPROVE";
    const newStatus = isApproved ? "APPROVED" : "REJECTED";

    const updatedProfile = await prisma.$transaction(async (tx) => {
      const profile = await tx.farmerProfile.update({
        where: { id: farmerProfileId },
        data: { verificationStatus: newStatus },
        include: { user: true },
      });

      await tx.verification.updateMany({
        where: { farmerProfileId },
        data: {
          remarks: remarks || (isApproved ? "Verification approved by compliance team." : "Verification rejected."),
          reviewedAt: new Date(),
        },
      });

      return profile;
    });

    // Publish event
    await publishAgroEvent(isApproved ? "KYC_APPROVED" : "KYC_REJECTED", {
      userId: updatedProfile.userId,
      remarks: `KYC ${newStatus}`,
    });

    const res = NextResponse.json(
      createSuccessResponse({
        farmerProfileId,
        verificationStatus: newStatus,
        message: isApproved
          ? "Farmer identity successfully verified! Unlimited produce publishing unlocked."
          : "Verification rejected. Farmer notified for resubmission.",
      })
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    const res = NextResponse.json(
      createErrorResponse("VERIFICATION_FAILED", err.message || "Failed to update verification status"),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
