import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  OrderDTO,
  OrderItemDTO,
  OrderTimelineEventDTO,
} from "@/dto";
import { notifyOrderStateChange } from "@/lib/notifications";

// ────────────────────────────────────────────────────────────
// Valid Status Transitions
// ────────────────────────────────────────────────────────────
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["READY_FOR_PICKUP"],
  READY_FOR_PICKUP: ["IN_TRANSIT"],
  IN_TRANSIT: ["DELIVERED"],
  DELIVERED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

const ORDER_STATUS_ORDER = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY_FOR_PICKUP",
  "IN_TRANSIT",
  "DELIVERED",
  "COMPLETED",
];

// ────────────────────────────────────────────────────────────
// Generate Server-Side Timeline from Order State
// ────────────────────────────────────────────────────────────
function generateTimeline(
  order: any,
  payment: any,
  delivery: any
): OrderTimelineEventDTO[] {
  const currentStatusIdx = ORDER_STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === "CANCELLED";

  const steps: Array<{
    step: string;
    description: string;
    dateSource: string | null;
    statusIdx: number;
  }> = [
    {
      step: "Order Created",
      description: "Your order has been placed and is awaiting confirmation.",
      dateSource: order.createdAt?.toISOString() || null,
      statusIdx: 0,
    },
    {
      step: "Payment Confirmed",
      description: "Payment has been verified and funds held in escrow.",
      dateSource: payment?.paidAt?.toISOString() || null,
      statusIdx: 1,
    },
    {
      step: "Farmer Accepted",
      description: "The farmer has accepted your order and is preparing produce.",
      dateSource: null,
      statusIdx: 1,
    },
    {
      step: "Packaging & Processing",
      description: "Produce is being cleaned, graded, and packaged for export.",
      dateSource: null,
      statusIdx: 2,
    },
    {
      step: "Ready for Pickup",
      description: "Order packaged and awaiting logistics partner collection.",
      dateSource: null,
      statusIdx: 3,
    },
    {
      step: "In Transit",
      description: "Shipment is en route to the delivery address.",
      dateSource: null,
      statusIdx: 4,
    },
    {
      step: "Delivered",
      description: "Produce has been delivered to the destination address.",
      dateSource: delivery?.deliveredAt?.toISOString() || null,
      statusIdx: 5,
    },
    {
      step: "Completed",
      description: "Order complete. Escrow funds released to farmer.",
      dateSource: null,
      statusIdx: 6,
    },
  ];

  return steps.map((s) => {
    let status: "completed" | "current" | "upcoming" = "upcoming";

    if (isCancelled) {
      status = s.statusIdx === 0 ? "completed" : "upcoming";
    } else if (s.statusIdx < currentStatusIdx) {
      status = "completed";
    } else if (s.statusIdx === currentStatusIdx) {
      status = "current";
    }

    return {
      step: s.step,
      description: s.description,
      date: s.dateSource || (status === "completed" ? order.createdAt?.toISOString() : null),
      status,
    };
  });
}

// ────────────────────────────────────────────────────────────
// GET /api/orders/[id] — Single OrderDTO
// ────────────────────────────────────────────────────────────
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
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
                farmerProfile: true,
                images: { take: 1 },
                category: true,
              },
            },
          },
        },
        payment: true,
        delivery: {
          include: { logisticsPartner: true },
        },
        disputes: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Authorization: buyer owns it, or farmer owns a product in it, or admin
    if (session.role === "BUYER") {
      const buyerProfile = await prisma.buyerProfile.findUnique({
        where: { userId: session.userId },
      });
      if (!buyerProfile || order.buyerId !== buyerProfile.id) {
        return NextResponse.json({ error: "Access denied." }, { status: 403 });
      }
    } else if (session.role === "FARMER") {
      const farmerProfile = await prisma.farmerProfile.findUnique({
        where: { userId: session.userId },
      });
      const ownsItem = order.orderItems.some(
        (oi) => oi.product.farmerProfileId === farmerProfile?.id
      );
      if (!ownsItem) {
        return NextResponse.json({ error: "Access denied." }, { status: 403 });
      }
    }
    // ADMIN: unrestricted

    // Build OrderDTO
    const items: OrderItemDTO[] = order.orderItems.map((oi) => ({
      id: oi.id,
      productId: oi.productId,
      productName: oi.product.name,
      productImage: oi.product.images?.[0]?.imageUrl || "/images/products/sesame_seeds.png",
      categoryName: oi.product.category?.name || "Uncategorized",
      farmerName: oi.product.farmerProfile?.farmName || "Unknown Farm",
      farmerState: oi.product.farmerProfile?.state || "",
      quantity: oi.quantity,
      unitPrice: Number(oi.unitPrice),
      subtotal: Number(oi.subtotal),
      unit: oi.product.unit || "TON",
    }));

    const totalAmount = Number(order.totalAmount);

    // Escrow state derived from payment + order status
    let escrowStatus: "HELD" | "RELEASED" | "REFUNDED" | "NONE" = "NONE";
    if (order.payment) {
      if (order.payment.paymentStatus === "PAID" && order.status === "COMPLETED") {
        escrowStatus = "RELEASED";
      } else if (order.payment.paymentStatus === "REFUNDED") {
        escrowStatus = "REFUNDED";
      } else if (order.payment.paymentStatus === "PAID" || order.payment.paymentStatus === "PENDING") {
        escrowStatus = "HELD";
      }
    }

    // Dispute eligibility
    const existingDispute = order.disputes?.[0];
    const canDispute =
      !existingDispute &&
      ["DELIVERED", "COMPLETED"].includes(order.status) &&
      order.status !== "CANCELLED";

    const timeline = generateTimeline(order, order.payment, order.delivery);

    const dto: OrderDTO = {
      id: order.id,
      orderNumber: order.orderNumber,
      totalAmount,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      buyer: {
        id: order.buyer.id,
        fullName: order.buyer.user.fullName,
        email: order.buyer.user.email,
        phoneNumber: order.buyer.user.phoneNumber,
        address: order.buyer.address,
        state: order.buyer.state,
      },
      items,
      payment: order.payment
        ? {
            id: order.payment.id,
            amount: Number(order.payment.amount),
            paymentMethod: order.payment.paymentMethod as any,
            paymentStatus: order.payment.paymentStatus as any,
            transactionRef: order.payment.transactionRef,
            paidAt: order.payment.paidAt?.toISOString() || null,
            createdAt: order.payment.createdAt.toISOString(),
          }
        : null,
      delivery: order.delivery
        ? {
            id: order.delivery.id,
            deliveryAddress: order.delivery.deliveryAddress,
            deliveryStatus: order.delivery.deliveryStatus as any,
            trackingNumber: order.delivery.trackingNumber,
            estimatedDelivery: order.delivery.estimatedDelivery?.toISOString() || null,
            deliveredAt: order.delivery.deliveredAt?.toISOString() || null,
            logisticsPartner: order.delivery.logisticsPartner?.companyName || null,
          }
        : null,
      timeline,
      escrow: {
        status: escrowStatus,
        amount: totalAmount,
        releaseEligible: escrowStatus === "HELD" && order.status === "DELIVERED",
      },
      invoice: {
        invoiceNumber: `INV-${order.orderNumber}`,
        subtotal: totalAmount,
        shipping: 400,
        total: totalAmount + 400,
        issuedAt: order.createdAt.toISOString(),
      },
      disputeEligibility: {
        canDispute,
        reason: existingDispute
          ? "A dispute already exists for this order."
          : canDispute
          ? "You may file a dispute within 7 days of delivery."
          : "Disputes can only be filed on delivered or completed orders.",
        existingDisputeId: existingDispute?.id || null,
      },
    };

    return NextResponse.json(dto, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching OrderDTO:", error);
    return NextResponse.json(
      { error: "Internal server error fetching order." },
      { status: 500 }
    );
  }
}

// ────────────────────────────────────────────────────────────
// PUT /api/orders/[id] — Hardened Status Transition Engine
// ────────────────────────────────────────────────────────────
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status: newStatus } = body;

    if (!id || !newStatus) {
      return NextResponse.json(
        { error: "Order ID and new status are required." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderItems: true, payment: true, delivery: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Validate transition
    const allowedTransitions = VALID_TRANSITIONS[order.status] || [];
    if (!allowedTransitions.includes(newStatus.toUpperCase())) {
      return NextResponse.json(
        {
          error: `Invalid status transition: ${order.status} → ${newStatus}. Allowed: ${allowedTransitions.join(", ") || "none"}.`,
        },
        { status: 400 }
      );
    }

    const upperStatus = newStatus.toUpperCase();

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order status
      const updated = await tx.order.update({
        where: { id },
        data: { status: upperStatus as any },
      });

      // Handle CANCELLED — release inventory
      if (upperStatus === "CANCELLED") {
        for (const item of order.orderItems) {
          await tx.inventory.update({
            where: { productId: item.productId },
            data: {
              availableQty: { increment: item.quantity },
              reservedQty: { decrement: item.quantity },
            },
          });
        }
        // Refund payment
        if (order.payment) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: { paymentStatus: "REFUNDED" },
          });
        }
      }

      // Handle CONFIRMED — mark payment as PAID
      if (upperStatus === "CONFIRMED" && order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { paymentStatus: "PAID", paidAt: new Date() },
        });
      }

      // Handle DELIVERED — set delivery timestamp
      if (upperStatus === "DELIVERED" && order.delivery) {
        await tx.delivery.update({
          where: { id: order.delivery.id },
          data: { deliveryStatus: "DELIVERED", deliveredAt: new Date() },
        });
      }

      // Handle IN_TRANSIT — update delivery status
      if (upperStatus === "IN_TRANSIT" && order.delivery) {
        await tx.delivery.update({
          where: { id: order.delivery.id },
          data: { deliveryStatus: "IN_TRANSIT" },
        });
      }

      // Handle READY_FOR_PICKUP — update delivery status
      if (upperStatus === "READY_FOR_PICKUP" && order.delivery) {
        await tx.delivery.update({
          where: { id: order.delivery.id },
          data: { deliveryStatus: "PICKED_UP" },
        });
      }

      // Handle COMPLETED — release reserved inventory, finalize escrow
      if (upperStatus === "COMPLETED") {
        for (const item of order.orderItems) {
          await tx.inventory.update({
            where: { productId: item.productId },
            data: {
              reservedQty: { decrement: item.quantity },
            },
          });
        }
      }

      return updated;
    });

    // Fire Multi-Channel Notifications for Buyer & Farmer
    const fullOrderInfo = await prisma.order.findUnique({
      where: { id: updatedOrder.id },
      include: {
        buyer: true,
        orderItems: { include: { product: { include: { farmerProfile: true } } } },
      },
    });

    if (fullOrderInfo) {
      const buyerUserId = fullOrderInfo.buyer.userId;
      const farmerUserIds = Array.from(
        new Set(fullOrderInfo.orderItems.map((item) => item.product.farmerProfile.userId))
      );
      notifyOrderStateChange(
        updatedOrder.id,
        updatedOrder.orderNumber,
        buyerUserId,
        farmerUserIds,
        upperStatus
      ).catch((err) => console.error("Notification trigger error:", err));
    }

    return NextResponse.json(
      {
        message: `Order status updated: ${order.status} → ${upperStatus}.`,
        order: {
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          status: updatedOrder.status,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Internal server error updating order." },
      { status: 500 }
    );
  }
}
