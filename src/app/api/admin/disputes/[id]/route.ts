import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// GET /api/admin/disputes/[id] — Retrieve detailed dispute dossier for arbitration
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const traceCtx = createTraceContext(req);

  try {
    const auth = await getAdminSession();
    if (!auth || auth.role !== "ADMIN") {
      const res = NextResponse.json(
        createErrorResponse("FORBIDDEN", "Administrative privilege required to inspect dispute dossier."),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const { id: disputeId } = await context.params;

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            role: true,
          },
        },
        order: {
          include: {
            buyer: {
              include: {
                user: { select: { fullName: true, email: true, phoneNumber: true } },
              },
            },
            orderItems: {
              include: {
                product: {
                  include: {
                    farmerProfile: {
                      include: {
                        user: { select: { fullName: true, email: true } },
                      },
                    },
                    images: true,
                  },
                },
              },
            },
            sellerOrders: {
              include: {
                farmerProfile: {
                  include: {
                    user: { select: { fullName: true, email: true } },
                  },
                },
              },
            },
            payment: true,
            delivery: {
              include: { logisticsPartner: true },
            },
          },
        },
      },
    });

    if (!dispute) {
      const res = NextResponse.json(
        createErrorResponse("NOT_FOUND", "Dispute claim not found."),
        { status: 404 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    // Fetch related audit logs for this order or dispute
    const auditLogs = await prisma.auditEvent.findMany({
      where: {
        OR: [
          { resourceId: dispute.id },
          { resourceId: dispute.order.id },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const res = NextResponse.json(
      createSuccessResponse({
        dispute,
        auditLogs,
      })
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (error: any) {
    console.error("Error fetching dispute dossier:", error);
    const res = NextResponse.json(
      createErrorResponse("INTERNAL_SERVER_ERROR", error.message || "Failed to load dispute dossier."),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
