import { isTrustedMutationOrigin } from "@/lib/csrf";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getSettlementDTO } from "@/services/payment.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (session.role !== "ADMIN" && session.role !== "BUYER") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const { orderId } = await params;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { buyer: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Settlement record not found." }, { status: 404 });
    }
    if (session.role !== "ADMIN" && order.buyer.userId !== session.userId) {
      return NextResponse.json({ error: "You are not authorized to view this settlement." }, { status: 403 });
    }

    const dto = await getSettlementDTO(orderId);
    if (!dto) {
      return NextResponse.json({ error: "Settlement record not found." }, { status: 404 });
    }
    return NextResponse.json(dto);
  } catch (error) {
    console.error("[SETTLEMENT_READ_FAILED]", error);
    return NextResponse.json({ error: "Internal server error fetching settlement details." }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only an administrator can initiate a refund review." },
      { status: 403 }
    );
  }
  if (!isTrustedMutationOrigin(req)) {
    return NextResponse.json({ error: "Untrusted mutation origin." }, { status: 403 });
  }

  const { orderId } = await params;
  const body = await req.json().catch(() => ({}));
  if (body.action !== "REFUND") {
    return NextResponse.json({ error: "Invalid settlement action." }, { status: 400 });
  }

  // This legacy endpoint's previous executeRefund() only changed Payment/Order statuses;
  // it did not actually refund a card through the gateway and could falsely report success.
  // Fail closed rather than marking money refunded without a source-aware refund operation.
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, payment: { select: { paymentStatus: true } } },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.payment?.paymentStatus === "REFUNDED") {
    return NextResponse.json({ error: "Payment is already marked as refunded." }, { status: 409 });
  }
  return NextResponse.json(
    { error: "Direct settlement refunds are disabled until a source-aware refund is approved. No financial state was changed." },
    { status: 409 }
  );
}
