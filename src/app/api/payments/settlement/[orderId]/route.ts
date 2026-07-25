import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSettlementDTO, executeRefund } from "@/services/payment.service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { orderId } = await params;
    const dto = await getSettlementDTO(orderId);

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
    if (!session || (session.role !== "ADMIN" && session.role !== "BUYER")) {
      return NextResponse.json({ error: "Authorization required for refund." }, { status: 403 });
    }

    const { orderId } = await params;
    const body = await req.json();
    const { action, reason } = body;

    if (action === "REFUND") {
      const result = await executeRefund(orderId, reason || "Refund requested by user.");
      return NextResponse.json({
        message: "Payment refund successfully executed.",
        order: result.updatedOrder,
      });
    }

    return NextResponse.json({ error: "Invalid settlement action." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process refund." }, { status: 400 });
  }
}
