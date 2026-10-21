import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isTrustedMutationOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { getSettlementDTO } from "@/services/payment.service";
import { WalletService } from "@/services/wallet.service";
import { recordAuditEvent } from "@/lib/audit";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { orderId } = await params;
    const dto = await getSettlementDTO(orderId, {
      userId: session.userId,
      role: session.role,
    });

    // Return 404 for non-owners so the endpoint does not disclose whether another
    // buyer has a settlement record.
    if (!dto) {
      return NextResponse.json({ error: "Settlement record not found." }, { status: 404 });
    }

    return NextResponse.json(dto);
  } catch (error) {
    console.error("Error fetching settlement DTO:", error);
    return NextResponse.json({ error: "Internal server error fetching settlement details." }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Only an administrator may initiate a formal refund." }, { status: 403 });
    }
    if (!isTrustedMutationOrigin(req)) {
      return NextResponse.json({ error: "Untrusted mutation origin." }, { status: 403 });
    }

    const { orderId } = await params;
    const body = await req.json().catch(() => ({}));
    if (body.action !== "REFUND") {
      return NextResponse.json({ error: "Invalid settlement action." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: true,
        payment: true,
        orderItems: true,
        sellerOrders: true,
        disputes: { where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    const refundAlreadyConfirmed =
      order.payment?.paymentMethod === "CARD" &&
      order.payment.paymentStatus === "REFUNDED" &&
      order.payment.refundStatus === "SUCCEEDED";
    if (!order.payment || (order.payment.paymentStatus !== "PAID" && !refundAlreadyConfirmed)) {
      return NextResponse.json({ error: "Only settled payments can be refunded." }, { status: 409 });
    }
    if (!["PENDING", "CONFIRMED"].includes(order.status)) {
      return NextResponse.json(
        { error: "Orders beyond confirmation must be refunded through the formal dispute workflow." },
        { status: 409 }
      );
    }
    if ((order.disputes?.length || 0) > 0) {
      return NextResponse.json(
        { error: "Resolve this order through its active dispute instead of the direct refund endpoint." },
        { status: 409 }
      );
    }

    const buyerUserId = order.buyer.userId;
    const amount = Number(order.totalAmount);

    // Refund through the original source. A missing verified gateway transaction ID is a
    // hard failure; never substitute internal wallet credit for a card/bank refund.
    if (order.payment.paymentMethod === "WALLET") {
      await WalletService.executeWalletEscrowRefund(buyerUserId, amount, order.id);
    } else if (order.payment.paymentMethod === "CARD" && order.payment.gatewayTransactionId) {
      await WalletService.executeGatewayCardRefund(
        buyerUserId,
        order.id,
        order.payment.gatewayTransactionId,
        amount
      );
    } else {
      return NextResponse.json(
        { error: "A verified provider transaction ID is required for this payment source.", code: "GATEWAY_REFUND_REQUIRED" },
        { status: 409 }
      );
    }

    // Persist cancellation only after the source-specific refund succeeds. Deterministic
    // refund references make retries safe if the database transaction needs to be retried.
    await prisma.$transaction(async (tx) => {
      const claim = await tx.order.updateMany({
        where: { id: order.id, status: { in: ["PENDING", "CONFIRMED"] } },
        data: { status: "CANCELLED" },
      });
      if (claim.count !== 1) throw new Error("ORDER_STATE_CONFLICT");

      await tx.payment.update({
        where: { id: order.payment!.id },
        data: { paymentStatus: "REFUNDED" },
      });

      await tx.sellerOrder.updateMany({
        where: { orderId: order.id, status: { not: "COMPLETED" } },
        data: { status: "CANCELLED" },
      });

      for (const item of order.orderItems) {
        const restored = await tx.inventory.updateMany({
          where: { productId: item.productId, reservedQty: { gte: item.quantity } },
          data: {
            availableQty: { increment: item.quantity },
            reservedQty: { decrement: item.quantity },
          },
        });
        if (restored.count !== 1) {
          throw new Error(`INVENTORY_RESTORE_CONFLICT: Cannot restore reserved quantity for product ${item.productId}.`);
        }
      }
    });

    await recordAuditEvent({
      category: "PAYMENT",
      severity: "WARNING",
      action: "ADMIN_SETTLEMENT_REFUND",
      actorId: session.userId,
      actorEmail: session.email,
      resourceType: "ORDER",
      resourceId: order.id,
      metadata: {
        orderNumber: order.orderNumber,
        amount,
        paymentMethod: order.payment.paymentMethod,
        reason: typeof body.reason === "string" ? body.reason.slice(0, 500) : "Admin refund",
      },
      req,
    });

    return NextResponse.json({
      message: "Refund completed through the original payment source.",
      order: { id: order.id, orderNumber: order.orderNumber, status: "CANCELLED" },
      refundedAmount: amount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process refund.";
    const status = [
      "INSUFFICIENT_ESCROW",
      "ESCROW_NOT_FUNDED",
      "REFUND_AMOUNT_MISMATCH",
      "REFUND_ORDER_OWNER_MISMATCH",
      "PAYMENT_SOURCE_MISMATCH",
      "GATEWAY_REFUND_PAYMENT_MISMATCH",
      "ORDER_STATE_CONFLICT",
      "CARD_REFUND_FAILED",
      "CARD_REFUND_PENDING_RECONCILIATION",
      "REFUND_STATE_CONFLICT",
      "INVENTORY_RESTORE_CONFLICT",
      "PAYMENT_NOT_SETTLED",
      "REFUND_ALREADY_RECORDED",
    ].some((code) => message.includes(code)) ? 409 : 500;
    console.error("[SETTLEMENT_REFUND_ERROR]", { message, status });
    return NextResponse.json({ error: message, code: "REFUND_FAILED" }, { status });
  }
}
