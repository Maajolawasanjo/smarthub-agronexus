import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, documentType, documentNumber, documentUrl } = body;

    if (!userId || !documentType) {
      return NextResponse.json(
        { error: "User ID and document type are required for verification." },
        { status: 400 }
      );
    }

    // Find farmer or buyer profile
    const farmerProfile = await prisma.farmerProfile.findUnique({
      where: { userId },
    });

    if (farmerProfile) {
      await prisma.farmerProfile.update({
        where: { id: farmerProfile.id },
        data: {
          cooperativeRegNo: documentNumber || farmerProfile.cooperativeRegNo,
          isVerified: true,
        },
      });
    }

    const buyerProfile = await prisma.buyerProfile.findUnique({
      where: { userId },
    });

    if (buyerProfile) {
      await prisma.buyerProfile.update({
        where: { id: buyerProfile.id },
        data: {
          cacNumber: documentNumber || buyerProfile.cacNumber,
          isVerified: true,
        },
      });
    }

    return NextResponse.json(
      {
        message: "KYC Verification document uploaded and submitted for review.",
        status: "APPROVED",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error submitting KYC verification API:", error);
    return NextResponse.json(
      { error: "Internal server error processing KYC upload." },
      { status: 500 }
    );
  }
}
