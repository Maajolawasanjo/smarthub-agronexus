import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { publishAgroEvent } from "@/lib/events";
import { FulfillmentDTO, OrderItemDTO } from "@/dto";
import {
  isValidFulfillmentTransition,
  deriveFulfillmentActions,
  canReleaseEscrow,
  generateFulfillmentTimeline,
  OrderStatus,
} from "@/lib/fulfillment";

import { orderRepository } from "@/repositories";

export async function getFulfillmentDTO(orderId: string, userRole: "BUYER" | "FARMER" | "ADMIN"): Promise<FulfillmentDTO | null> {
  const order = await orderRepository.findById(orderId);

  if (!order) return null;

  const firstFarmer = order.orderItems[0]?.product?.farmerProfile;

  const items: OrderItemDTO[] = order.orderItems.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.product.name,
    productImage: item.product.images[0]?.imageUrl || "/vegetable-container-white.png",
    farmerName: item.product.farmerProfile.farmName,
    farmerState: item.product.farmerProfile.state || "Kano",
    categoryName: item.product.category.name,
    unitPrice: Number(item.unitPrice),
    quantity: item.quantity,
    subtotal: Number(item.subtotal),
    unit: item.product.unit,
  }));

  const timeline = generateFulfillmentTimeline(order.createdAt, order.status, order.delivery);
  const actions = deriveFulfillmentActions(order.status, userRole);
  const releaseEligible = canReleaseEscrow(order.status, order.payment?.paymentStatus || "PENDING");

  return {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      status: order.status,
      totalAmount: Number(order.totalAmount),
      buyer: {
        id: order.buyer.id,
        fullName: order.buyer.user.fullName,
        email: order.buyer.user.email,
        phoneNumber: order.buyer.user.phoneNumber,
        address: order.buyer.address || undefined,
      },
      farmer: firstFarmer ? {
        id: firstFarmer.id,
        farmName: firstFarmer.farmName,
        farmAddress: firstFarmer.farmAddress,
        state: firstFarmer.state,
      } : undefined,
      items,
    },
    shipment: order.delivery ? {
      id: order.delivery.id,
      trackingNumber: order.delivery.trackingNumber,
      deliveryStatus: order.delivery.deliveryStatus,
      deliveryAddress: order.delivery.deliveryAddress,
      estimatedDelivery: order.delivery.estimatedDelivery ? order.delivery.estimatedDelivery.toISOString() : null,
      deliveredAt: order.delivery.deliveredAt ? order.delivery.deliveredAt.toISOString() : null,
      logisticsPartner: order.delivery.logisticsPartner ? {
        id: order.delivery.logisticsPartner.id,
        companyName: order.delivery.logisticsPartner.companyName,
        contactName: order.delivery.logisticsPartner.contactName,
        phoneNumber: order.delivery.logisticsPartner.phoneNumber,
        email: order.delivery.logisticsPartner.email,
      } : null,
    } : null,
    trackingTimeline: timeline,
    currentStage: order.status,
    escrowStatus: {
      locked: order.payment?.paymentStatus === "PAID" && order.status !== "COMPLETED",
      status: order.payment?.paymentStatus || "PENDING",
      releaseEligible,
    },
    availableActions: actions,
  };
}

export async function updateFulfillmentStatus(
  orderId: string,
  targetStatus: OrderStatus,
  userRole: "BUYER" | "FARMER" | "ADMIN"
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { buyer: true },
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  if (!isValidFulfillmentTransition(order.status, targetStatus)) {
    throw new Error(`Invalid status transition from ${order.status} to ${targetStatus}.`);
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: targetStatus },
  });

  logger.info(`Fulfillment status updated to ${targetStatus}`, {
    orderId,
    newStatus: targetStatus,
    updatedByRole: userRole,
  });

  await publishAgroEvent("ORDER_CONFIRMED", {
    userId: order.buyer.userId,
    orderId: order.id,
    orderNumber: order.orderNumber,
  });

  return updatedOrder;
}

export async function confirmBuyerDeliveryAndReleaseEscrow(orderId: string, buyerUserId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: true,
      payment: true,
      delivery: true,
    },
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  if (order.buyer.userId !== buyerUserId) {
    throw new Error("Only the order buyer can confirm delivery and release escrow.");
  }

  if (order.status !== "DELIVERED" && order.status !== "IN_TRANSIT") {
    throw new Error("Delivery confirmation can only be performed on delivered orders.");
  }

  // Atomic update: Mark Order as COMPLETED and release payment escrow
  const updatedOrder = await prisma.$transaction(async (tx) => {
    const completedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: "COMPLETED" },
    });

    if (order.payment) {
      await tx.payment.update({
        where: { id: order.payment.id },
        data: { paymentStatus: "PAID" },
      });
    }

    if (order.delivery) {
      await tx.delivery.update({
        where: { orderId: orderId },
        data: { deliveryStatus: "DELIVERED", deliveredAt: new Date() },
      });
    }

    return completedOrder;
  });

  logger.security(`Escrow released for order #${order.orderNumber}`, {
    orderId: order.id,
    buyerUserId,
    amount: Number(order.totalAmount),
  });

  await publishAgroEvent("ESCROW_RELEASED", {
    userId: order.buyer.userId,
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: Number(order.totalAmount),
  });

  return updatedOrder;
}
