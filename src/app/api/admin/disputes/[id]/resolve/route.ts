import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { WalletService } from "@/services/wallet.service";
import { recordAuditEvent } from "@/lib/audit";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";
import { createNotification } from "@/lib/notifications";

// POST /api/admin/disputes/[id]/resolve — Admin formal arbitration of order dispute
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const traceCtx = createTraceContext(req);

  try {
    const auth = await getAdminSession();
    if (!auth || auth.role !== "ADMIN") {
      const res = NextResponse.json(
        createErrorResponse("FORBIDDEN", "Administrative privilege required to arbitrate disputes."),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    // CSRF origin validation for financial arbitration mutation
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const expectedOrigin = new URL(appUrl).origin;
    if ((origin && origin !== expectedOrigin) || (referer && !referer.startsWith(expectedOrigin))) {
      const res = NextResponse.json(createErrorResponse("FORBIDDEN", "Cross-origin arbitration forbidden."), { status: 403 });
      return attachTraceHeaders(res, traceCtx);
    }

    const { id: disputeId } = await context.params;
    const body = await req.json().catch(() => ({}));
    const { action, notes } = body;

    if (!action || !["REFUND_BUYER", "RELEASE_TO_FARMER"].includes(action)) {
      const res = NextResponse.json(
        createErrorResponse("BAD_REQUEST", "Invalid arbitration action. Must be REFUND_BUYER or RELEASE_TO_FARMER."),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        order: {
          include: {
            buyer: true,
            orderItems: {
              include: {
                product: {
                  include: { farmerProfile: true },
                },
              },
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

    if (dispute.status === "RESOLVED") {
      const res = NextResponse.json(
        createErrorResponse("ALREADY_RESOLVED", "This dispute has already been adjudicated and closed."),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const order = dispute.order;
    const orderTotal = Number(order.totalAmount);
    const buyerUserId = order.buyer.userId;

    if (action === "REFUND_BUYER") {
      // 1. Return locked escrow funds back to buyer's available wallet balance
      await WalletService.executeRefund(buyerUserId, orderTotal, order.id);

      // 2. Mark order as CANCELLED
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });

      // 3. Mark dispute as RESOLVED
      const resolutionText = notes?.trim()
        ? `Adjudicated by Admin: ${notes.trim()} (Escrow ₦${orderTotal.toLocaleString()} refunded to Buyer).`
        : `Adjudicated in favor of Buyer: 100% Escrow (₦${orderTotal.toLocaleString()}) refunded to Buyer wallet.`;

      const updatedDispute = await prisma.dispute.update({
        where: { id: dispute.id },
        data: {
          status: "RESOLVED",
          resolution: resolutionText,
          closedAt: new Date(),
        },
      });

      // 4. Audit Log
      await recordAuditEvent({
        category: "DISPUTE",
        severity: "WARNING",
        action: "DISPUTE_RESOLVED_REFUND",
        actorId: auth.userId,
        actorEmail: auth.user.email,
        resourceId: dispute.id,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          buyerUserId,
          refundAmount: orderTotal,
          resolution: resolutionText,
        },
        req,
      });

      // 5. Persistent notifications to stakeholders
      await createNotification({
        userId: buyerUserId,
        title: `Dispute Resolved: Refund Credited`,
        message: `Your dispute on Order #${order.orderNumber} was approved. ₦${orderTotal.toLocaleString()} has been refunded to your wallet balance.`,
        type: "ORDER",
      });

      const refundFarmers = Array.from(new Set(
        order.orderItems
          .map((item) => item.product.farmerProfile?.userId)
          .filter(Boolean) as string[]
      ));
      for (const fId of refundFarmers) {
        await createNotification({
          userId: fId,
          title: `Dispute Resolved: Escrow Refunded to Buyer`,
          message: `Arbitration on Order #${order.orderNumber} concluded in buyer's favor. Findings: ${notes || "Contract specifications non-compliance."}`,
          type: "ORDER",
        });
      }

      const res = NextResponse.json(
        createSuccessResponse({
          dispute: updatedDispute,
          message: `Dispute #${dispute.id} resolved: Escrow refunded to Buyer.`,
        })
      );
      return attachTraceHeaders(res, traceCtx);
    } else {
      // action === "RELEASE_TO_FARMER"
      // 1. Release escrow funds to the farmer wallet (minus platform fee) & complete order
      await WalletService.executeEscrowRelease(buyerUserId, order.id);

      // 2. Mark dispute as RESOLVED
      const resolutionText = notes?.trim()
        ? `Adjudicated by Admin: ${notes.trim()} (Escrow released to Farmer).`
        : `Adjudicated in favor of Farmer: Escrow released to seller wallet upon evidence verification.`;

      const updatedDispute = await prisma.dispute.update({
        where: { id: dispute.id },
        data: {
          status: "RESOLVED",
          resolution: resolutionText,
          closedAt: new Date(),
        },
      });

      // 3. Audit Log
      await recordAuditEvent({
        category: "DISPUTE",
        severity: "WARNING",
        action: "DISPUTE_RESOLVED_RELEASE",
        actorId: auth.userId,
        actorEmail: auth.user.email,
        resourceId: dispute.id,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          buyerUserId,
          releasedAmount: orderTotal,
          resolution: resolutionText,
        },
        req,
      });

      // 4. Persistent notifications to stakeholders
      await createNotification({
        userId: buyerUserId,
        title: `Dispute Concluded: Evidence Verified`,
        message: `Arbitration on Order #${order.orderNumber} has concluded. Seller evidence was verified and escrow funds released.`,
        type: "ORDER",
      });

      const releaseFarmers = Array.from(new Set(
        order.orderItems
          .map((item) => item.product.farmerProfile?.userId)
          .filter(Boolean) as string[]
      ));
      for (const fId of releaseFarmers) {
        await createNotification({
          userId: fId,
          title: `Dispute Resolved in Your Favor`,
          message: `Dispute on Order #${order.orderNumber} has been resolved in your favor. Escrow payout credited to your wallet balance.`,
          type: "PAYMENT",
        });
      }

      const res = NextResponse.json(
        createSuccessResponse({
          dispute: updatedDispute,
          message: `Dispute #${dispute.id} resolved: Escrow released to Farmer.`,
        })
      );
      return attachTraceHeaders(res, traceCtx);
    }
  } catch (error: any) {
    console.error("Error arbitrating dispute:", error);
    const res = NextResponse.json(
      createErrorResponse("INTERNAL_SERVER_ERROR", error.message || "Failed to arbitrate dispute."),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
