import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json();
    const { documentType, documentNumber, documentUrl } = body;

    if (!documentType || !documentUrl) {
      return NextResponse.json(
        { error: "Document type and document file URL are required for identity verification." },
        { status: 400 }
      );
    }

    const farmerProfile = await prisma.farmerProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!farmerProfile) {
      return NextResponse.json(
        { error: "Farmer profile not found. Complete profile setup first." },
        { status: 404 }
      );
    }

    // Execute database updates inside a single transaction
    const verification = await prisma.$transaction(async (tx) => {
      await tx.farmerProfile.update({
        where: { id: farmerProfile.id },
        data: { verificationStatus: "PENDING" },
      });

      return await tx.verification.upsert({
        where: { farmerProfileId: farmerProfile.id },
        create: {
          farmerProfileId: farmerProfile.id,
          documentType,
          documentNumber: documentNumber || null,
          documentUrl,
        },
        update: {
          documentType,
          documentNumber: documentNumber || null,
          documentUrl,
          remarks: null, // Reset remarks on new resubmission
        },
      });
    });

    logger.security("Identity verification document submitted", {
      userId: session.userId,
      farmerProfileId: farmerProfile.id,
      documentType,
    });

    // Publish domain event to Event Bus
    const { publishAgroEvent } = await import("@/lib/events");
    await publishAgroEvent("KYC_SUBMITTED", {
      userId: session.userId,
      documentType,
    });

    return NextResponse.json({
      message: "Identity verification document successfully uploaded and submitted for review.",
      status: "PENDING_REVIEW",
      verificationId: verification.id,
    });
  } catch (error: any) {
    logger.error("Error submitting KYC verification upload", error);
    return NextResponse.json(
      { error: "Internal server error processing identity verification upload." },
      { status: 500 }
    );
  }
}
