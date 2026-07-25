import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  getFulfillmentDTO,
  updateFulfillmentStatus,
  confirmBuyerDeliveryAndReleaseEscrow,
} from "@/services/fulfillment.service";

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
    const dto = await getFulfillmentDTO(orderId, session.role);

    if (!dto) {
      return NextResponse.json({ error: "Fulfillment order record not found." }, { status: 404 });
    }

    return NextResponse.json(dto);
  } catch (error) {
    console.error("Error fetching fulfillment DTO:", error);
    return NextResponse.json(
      { error: "Internal server error fetching fulfillment details." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { orderId } = await params;
    const body = await req.json();
    const { action, status } = body;

    // Action: Confirm Buyer Delivery & Release Escrow
    if (action === "CONFIRM_DELIVERY_RELEASE_ESCROW") {
      const updated = await confirmBuyerDeliveryAndReleaseEscrow(orderId, session.userId);
      return NextResponse.json({
        message: "Delivery confirmed and escrow released successfully.",
        order: updated,
      });
    }

    // Action: Fulfillment State Transition
    if (status) {
      const updated = await updateFulfillmentStatus(orderId, status, session.role);
      return NextResponse.json({
        message: `Fulfillment status updated to ${status}.`,
        order: updated,
      });
    }

    return NextResponse.json({ error: "Invalid fulfillment payload." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error updating fulfillment state." },
      { status: 400 }
    );
  }
}
