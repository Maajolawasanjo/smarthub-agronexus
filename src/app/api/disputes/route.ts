import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, reason } = body;

    if (!orderId || !reason) {
      return NextResponse.json(
        { error: "Order ID and dispute reason are required." },
        { status: 400 }
      );
    }

    const dispute = await prisma.dispute.create({
      data: {
        orderId,
        reason: reason.trim(),
        status: "OPEN",
      },
    });

    // Freeze order escrow payment
    await prisma.payment.updateMany({
      where: { orderId },
      data: { status: "FAILED" },
    });

    return NextResponse.json(
      {
        message: "Dispute opened successfully. Escrow payout has been frozen.",
        dispute,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating dispute API:", error);
    return NextResponse.json(
      { error: "Internal server error creating dispute." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const disputes = await prisma.dispute.findMany({
      include: {
        order: {
          include: {
            buyer: {
              include: { user: { select: { fullName: true, email: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ disputes }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching disputes API:", error);
    return NextResponse.json(
      { error: "Internal server error fetching disputes." },
      { status: 500 }
    );
  }
}
