import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// GET /api/farmer/sub-orders — Fetch seller-specific sub-orders for the authenticated farmer
export async function GET(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const session = await getSession();
    if (!session?.userId) {
      const res = NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "Authentication required."),
        { status: 401 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    if (session.role !== "FARMER" && session.role !== "ADMIN") {
      const res = NextResponse.json(
        createErrorResponse("FORBIDDEN", "Only registered farmers can access seller orders."),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    let farmerProfileId: string | undefined;

    if (session.role === "FARMER") {
      const farmerProfile = await prisma.farmerProfile.findUnique({
        where: { userId: session.userId },
      });
      if (!farmerProfile) {
        const res = NextResponse.json(
          createErrorResponse("NOT_FOUND", "Farmer profile not found."),
          { status: 404 }
        );
        return attachTraceHeaders(res, traceCtx);
      }
      farmerProfileId = farmerProfile.id;
    } else {
      farmerProfileId = searchParams.get("farmerProfileId") || undefined;
    }

    const whereClause: any = {};
    if (farmerProfileId) {
      whereClause.farmerProfileId = farmerProfileId;
    }
    if (statusFilter && statusFilter.toUpperCase() !== "ALL") {
      whereClause.status = statusFilter.toUpperCase();
    }

    const subOrders = await prisma.sellerOrder.findMany({
      where: whereClause,
      include: {
        order: {
          include: {
            buyer: {
              include: {
                user: {
                  select: { fullName: true, email: true, phoneNumber: true },
                },
              },
            },
            shippingAddress: true,
            delivery: true,
            payment: {
              select: { paymentMethod: true, paymentStatus: true },
            },
          },
        },
        orderItems: {
          include: {
            product: {
              include: { images: { take: 1 } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const res = NextResponse.json(
      createSuccessResponse({
        count: subOrders.length,
        subOrders,
      }),
      { status: 200 }
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (error: any) {
    console.error("Error fetching farmer sub-orders:", error);
    const res = NextResponse.json(
      createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve seller orders."),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
