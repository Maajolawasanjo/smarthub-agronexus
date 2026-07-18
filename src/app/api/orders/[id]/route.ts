import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        buyer: {
          include: {
            user: { select: { fullName: true, email: true, phoneNumber: true } },
          },
        },
        items: {
          include: {
            product: {
              include: {
                farmerProfile: true,
                images: true,
              },
            },
          },
        },
        payments: true,
        delivery: true,
        dispute: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching order detail API:", error);
    return NextResponse.json(
      { error: "Internal server error fetching order." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, deliveryStatus } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: {
          status: status || undefined,
        },
      });

      if (deliveryStatus) {
        await tx.delivery.updateMany({
          where: { orderId: id },
          data: {
            status: deliveryStatus,
          },
        });
      }

      // If order is completed, release escrow payment
      if (status === "DELIVERED" || status === "COMPLETED") {
        await tx.payment.updateMany({
          where: { orderId: id },
          data: {
            status: "COMPLETED",
          },
        });
      }

      return order;
    });

    return NextResponse.json(
      {
        message: "Order status updated successfully.",
        order: updatedOrder,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating order API:", error);
    return NextResponse.json(
      { error: "Internal server error updating order." },
      { status: 500 }
    );
  }
}
