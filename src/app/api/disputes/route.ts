import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { recordAuditEvent } from "@/lib/audit";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";

// POST /api/disputes — Open a dispute on an order
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "Authentication required to open a dispute."),
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { orderId, title, reason, description } = body;

    if (!orderId || (!reason && !description)) {
      return NextResponse.json(
        createErrorResponse("BAD_REQUEST", "Order ID and dispute explanation are required."),
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: true,
        orderItems: {
          include: {
            product: {
              include: { farmerProfile: true },
            },
          },
        },
        disputes: {
          where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        createErrorResponse("NOT_FOUND", "Order not found."),
        { status: 404 }
      );
    }

    // Verify ownership: must be the order buyer, seller farmer, or admin
    const isBuyer = order.buyer.userId === session.userId;
    const isFarmer = order.orderItems.some(
      (item) => item.product.farmerProfile.userId === session.userId
    );
    const isAdmin = session.role === "ADMIN";

    if (!isBuyer && !isFarmer && !isAdmin) {
      return NextResponse.json(
        createErrorResponse("FORBIDDEN", "You are not authorized to file a dispute on this order."),
        { status: 403 }
      );
    }

    // Prevent duplicate active disputes
    if (order.disputes && order.disputes.length > 0) {
      return NextResponse.json(
        createErrorResponse("CONFLICT", "An active dispute is already open for this order."),
        { status: 409 }
      );
    }

    const disputeTitle = title || reason || "Order Dispute";
    const disputeDesc = (description || reason || "").trim();

    const dispute = await prisma.dispute.create({
      data: {
        orderId,
        userId: session.userId,
        title: disputeTitle,
        description: disputeDesc,
        status: "OPEN",
      },
    });

    // Audit log the dispute opening
    await recordAuditEvent({
      category: "DISPUTE",
      severity: "WARNING",
      action: "DISPUTE_OPENED",
      actorId: session.userId,
      actorEmail: session.email,
      resourceType: "DISPUTE",
      resourceId: dispute.id,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        title: disputeTitle,
      },
      req,
    });

    return NextResponse.json(
      createSuccessResponse({
        message: "Dispute opened successfully. The compliance team has been notified.",
        dispute,
      }),
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating dispute API:", error);
    return NextResponse.json(
      createErrorResponse("INTERNAL_SERVER_ERROR", "Internal server error creating dispute."),
      { status: 500 }
    );
  }
}

// GET /api/disputes — Retrieve disputes scoped by user role
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "Authentication required to view disputes."),
        { status: 401 }
      );
    }

    let whereClause: any = {};

    if (session.role === "ADMIN") {
      whereClause = {}; // Admin sees all disputes
    } else if (session.role === "BUYER") {
      whereClause = {
        OR: [
          { userId: session.userId },
          { order: { buyer: { userId: session.userId } } },
        ],
      };
    } else if (session.role === "FARMER") {
      whereClause = {
        order: {
          orderItems: {
            some: {
              product: {
                farmerProfile: {
                  userId: session.userId,
                },
              },
            },
          },
        },
      };
    }

    const disputes = await prisma.dispute.findMany({
      where: whereClause,
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

    return NextResponse.json(createSuccessResponse({ disputes }), { status: 200 });
  } catch (error: any) {
    console.error("Error fetching disputes API:", error);
    return NextResponse.json(
      createErrorResponse("INTERNAL_SERVER_ERROR", "Internal server error fetching disputes."),
      { status: 500 }
    );
  }
}

