import { isTrustedMutationOrigin } from "@/lib/csrf";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { WalletService } from "@/services/wallet.service";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }
    const data = await WalletService.getEscrowDetails(session.userId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[WALLET_ESCROW_READ_FAILED]", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Unable to load escrow details." } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }
    if (session.role !== "BUYER") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only the order-owning buyer can confirm delivery." } },
        { status: 403 }
      );
    }
    if (!isTrustedMutationOrigin(req)) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Untrusted mutation origin." } }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dbOrderId = typeof body.dbOrderId === "string" ? body.dbOrderId.trim() : "";
    if (!dbOrderId) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "dbOrderId is required" } },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: dbOrderId },
      include: { buyer: true, payment: true, delivery: true, sellerOrders: true, disputes: true },
    });
    if (!order) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Order not found." } }, { status: 404 });
    }
    if (order.buyer.userId !== session.userId) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "You do not own this order." } }, { status: 403 });
    }
    if (order.status === "COMPLETED") {
      return NextResponse.json({ success: false, error: { code: "ALREADY_RELEASED", message: "Escrow has already been released." } }, { status: 409 });
    }
    if (order.payment?.paymentStatus !== "PAID") {
      return NextResponse.json({ success: false, error: { code: "PAYMENT_NOT_SETTLED", message: "Payment must be confirmed before escrow release." } }, { status: 409 });
    }
    const deliveryConfirmed =
      order.status === "DELIVERED" ||
      order.delivery?.deliveryStatus === "DELIVERED" ||
      (order.sellerOrders.length > 0 && order.sellerOrders.every((sellerOrder) =>
        sellerOrder.status === "DELIVERED" || sellerOrder.status === "COMPLETED"
      ));
    if (!deliveryConfirmed) {
      return NextResponse.json({ success: false, error: { code: "DELIVERY_NOT_CONFIRMED", message: "Escrow can only be released after delivery is confirmed." } }, { status: 409 });
    }
    if (order.disputes.some((dispute) => dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW")) {
      return NextResponse.json({ success: false, error: { code: "DISPUTE_OPEN", message: "Escrow is held while this order has an active dispute." } }, { status: 409 });
    }

    const result = await WalletService.executeEscrowRelease(session.userId, dbOrderId);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to release escrow.";
    const alreadyReleased = message === "ESCROW_ALREADY_RELEASED";
    console.error("[WALLET_ESCROW_RELEASE_FAILED]", { message });
    return NextResponse.json(
      { success: false, error: { code: alreadyReleased ? "ALREADY_RELEASED" : "ESCROW_RELEASE_FAILED", message: alreadyReleased ? "Escrow has already been released." : "Unable to release escrow." } },
      { status: alreadyReleased ? 409 : 500 }
    );
  }
}
