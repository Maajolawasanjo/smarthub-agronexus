import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, title, reason, description } = body;

    if (!orderId || (!reason && !description)) {
      return NextResponse.json(
        { error: "Order ID and dispute description are required." },
        { status: 400 }
      );
    }

    const disputeTitle = title || "Order Dispute";
    const disputeDesc = (reason || description || "").trim();

    const dispute = await prisma.dispute.create({
      data: {
        orderId,
        userId: session.userId,
        title: disputeTitle,
        description: disputeDesc,
        status: "OPEN",
      },
    });

    // Mark payment status if exists
    await prisma.payment.updateMany({
      where: { orderId },
      data: { paymentStatus: "PENDING" },
    });

    return NextResponse.json(
      {
        message: "Dispute opened successfully. Escrow payout has been flagged.",
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

export async function GET() {
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
