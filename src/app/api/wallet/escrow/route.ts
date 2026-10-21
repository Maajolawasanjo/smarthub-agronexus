import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isTrustedMutationOrigin } from "@/lib/csrf";
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
  } catch (error: unknown) {
    console.error("[WALLET_ESCROW_GET_ERROR]", error);
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
        { success: false, error: { code: "FORBIDDEN", message: "Only the order's buyer can release escrow." } },
        { status: 403 }
      );
    }
    if (!isTrustedMutationOrigin(req)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Untrusted mutation origin." } },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const dbOrderId = typeof body.dbOrderId === "string" ? body.dbOrderId.trim() : "";
    if (!dbOrderId) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "dbOrderId is required." } },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: dbOrderId },
      include: {
        buyer: true,
        payment: true,
        disputes: { where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Order not found." } },
        { status: 404 }
      );
    }
    if (order.buyer.userId !== session.userId) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "You do not own this order." } },
        { status: 403 }
      );
    }
    if (order.status !== "DELIVERED") {
      return NextResponse.json(
        { success: false, error: { code: "ORDER_NOT_DELIVERED", message: "Escrow can only be released after delivery is confirmed." } },
        { status: 409 }
      );
    }
    if (order.payment?.paymentStatus !== "PAID") {
      return NextResponse.json(
        { success: false, error: { code: "PAYMENT_NOT_SETTLED", message: "This order has no settled payment to release." } },
        { status: 409 }
      );
    }
    if ((order.disputes?.length || 0) > 0) {
      return NextResponse.json(
        { success: false, error: { code: "ACTIVE_DISPUTE", message: "Escrow is frozen while this order has an active dispute." } },
        { status: 409 }
      );
    }

    const result = await WalletService.executeEscrowRelease(session.userId, dbOrderId);
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to release escrow.";
    const conflictCodes = [
      "ORDER_NOT_DELIVERED",
      "PAYMENT_NOT_SETTLED",
      "PAYMENT_FINANCIAL_STATE_CONFLICT",
      "ACTIVE_DISPUTE_BLOCKS_RELEASE",
      "ESCROW_NOT_FUNDED",
      "INSUFFICIENT_ESCROW",
      "ESCROW_ALREADY_RELEASED",
      "SELLER_ORDER_NOT_DELIVERED",
      "SELLER_ORDER_TOTAL_MISMATCH",
      "PAYMENT_AMOUNT_MISMATCH",
      "INVALID_ORDER_AMOUNT",
      "SELLER_GROSS_EXCEEDS_ORDER_AMOUNT",
      "ORDER_OWNER_MISMATCH",
      "ESCROW_LOCK_REFERENCE_MISSING",
      "NO_SELLERS_FOR_ORDER",
      "SELLER_USER_NOT_FOUND",
      "INVALID_SELLER_ORDER_AMOUNT",
    ];
    const status = conflictCodes.some((code) => message.includes(code)) ? 409 : 500;
    console.error("[WALLET_ESCROW_RELEASE_ERROR]", { message, status });
    return NextResponse.json(
      { success: false, error: { code: status === 409 ? "ESCROW_RELEASE_CONFLICT" : "INTERNAL_ERROR", message } },
      { status }
    );
  }
}
