import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/lib/audit";
import { WalletService } from "@/services/wallet.service";
import { createNotification, notifyOrderStateChange } from "@/lib/notifications";
import { OrderStatus } from "@prisma/client";
import { isValidFulfillmentTransition, canReleaseEscrow, generateFulfillmentTimeline } from "@/lib/fulfillment";

export interface ListOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export type AdminOrderAction =
  | "CANCEL"
  | "REFUND_ESCROW"
  | "RELEASE_ESCROW"
  | "MARK_PROCESSING"
  | "MARK_READY_FOR_PICKUP"
  | "MARK_IN_TRANSIT"
  | "MARK_DELIVERED";

export interface ExecuteOrderActionParams {
  orderId: string;
  action: AdminOrderAction;
  reason?: string;
  trackingNumber?: string;
  adminUserId: string;
  adminEmail: string;
  req?: Request;
}

export class AdminOrderService {
  /**
   * Retrieves platform-wide orders with comprehensive administrative filtering & pagination.
   */
  public static async listOrders(params: ListOrdersParams) {
    const page = Math.max(Number(params.page) || 1, 1);
    const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.status && params.status !== "ALL" && params.status !== "All Orders") {
      where.status = params.status.toUpperCase() as OrderStatus;
    }

    if (params.paymentStatus) {
      where.payment = { paymentStatus: params.paymentStatus.toUpperCase() };
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params.endDate) where.createdAt.lte = new Date(params.endDate);
    }

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: "insensitive" } },
        { buyer: { user: { fullName: { contains: q, mode: "insensitive" } } } },
        { buyer: { user: { email: { contains: q, mode: "insensitive" } } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          buyer: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phoneNumber: true,
                },
              },
            },
          },
          shippingAddress: true,
          payment: true,
          delivery: {
            include: {
              logisticsPartner: true,
            },
          },
          orderItems: {
            include: {
              product: {
                include: {
                  category: true,
                  farmerProfile: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          fullName: true,
                          email: true,
                          phoneNumber: true,
                        },
                      },
                    },
                  },
                  images: { take: 1 },
                },
              },
            },
          },
          sellerOrders: {
            include: {
              farmerProfile: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const formattedOrders = orders.map((o) => {
      const firstItem = o.orderItems[0];
      const farmerNames = Array.from(
        new Set(o.orderItems.map((i) => i.product?.farmerProfile?.farmName || "Producer").filter(Boolean))
      );

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        status: o.status,
        totalAmount: Number(o.totalAmount),
        itemCount: o.orderItems.reduce((acc, i) => acc + i.quantity, 0),
        buyerName: o.buyer?.user?.fullName || "Buyer",
        buyerEmail: o.buyer?.user?.email || "",
        buyerPhone: o.buyer?.user?.phoneNumber || "",
        farmers: farmerNames,
        primaryProductName: firstItem?.product?.name || "Produce Commodity",
        primaryProductImage: firstItem?.product?.images[0]?.imageUrl || "/vegetable-container-white.png",
        paymentStatus: o.payment?.paymentStatus || "PENDING",
        paymentMethod: o.payment?.paymentMethod || "WALLET",
        deliveryStatus: o.delivery?.deliveryStatus || "PENDING",
        trackingNumber: o.delivery?.trackingNumber || null,
        shippingAddress: o.shippingAddress ? `${o.shippingAddress.addressLine}, ${o.shippingAddress.city}, ${o.shippingAddress.state}` : o.delivery?.deliveryAddress || "Standard Delivery",
      };
    });

    return {
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves single order dossier with full operational and escrow inspection context.
   */
  public static async getOrderDetails(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, phoneNumber: true },
            },
          },
        },
        shippingAddress: true,
        payment: true,
        delivery: {
          include: { logisticsPartner: true },
        },
        orderItems: {
          include: {
            product: {
              include: {
                category: true,
                farmerProfile: {
                  include: {
                    user: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
                  },
                },
                images: true,
              },
            },
          },
        },
        sellerOrders: {
          include: { farmerProfile: true },
        },
        disputes: true,
      },
    });

    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    const timeline = generateFulfillmentTimeline(order.createdAt, order.status, order.delivery);

    return {
      order,
      timeline,
      escrow: {
        lockedAmount: Number(order.totalAmount),
        isLocked: order.payment?.paymentStatus === "PAID" && order.status !== "COMPLETED" && order.status !== "CANCELLED",
        canRelease: canReleaseEscrow(order.status, order.payment?.paymentStatus || "PENDING"),
      },
    };
  }

  /**
   * Orchestrates strict state transitions with transactional financial protection.
   */
  public static async executeOrderAction(params: ExecuteOrderActionParams) {
    const { orderId, action, reason, trackingNumber, adminUserId, adminEmail, req } = params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: { include: { user: true } },
        shippingAddress: true,
        payment: true,
        orderItems: {
          include: {
            product: {
              include: { farmerProfile: { include: { user: true } } },
            },
          },
        },
      },
    });

    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    const buyerUserId = order.buyer.userId;
    const farmerUserIds = Array.from(
      new Set(
        order.orderItems
          .map((i) => i.product?.farmerProfile?.userId)
          .filter(Boolean) as string[]
      )
    );

    switch (action) {
      case "CANCEL":
      case "REFUND_ESCROW": {
        // Validation: Cannot cancel if already COMPLETED or CANCELLED
        if (order.status === "COMPLETED" || order.status === "CANCELLED") {
          throw new Error(`Cannot cancel order in ${order.status} state.`);
        }

        // If payment was settled, refund escrow to buyer wallet
        if (order.payment && order.payment.paymentStatus === "PAID") {
          await WalletService.executeWalletEscrowRefund(buyerUserId, Number(order.totalAmount), order.id);
        }

        // Transactional update of order and seller orders
        const updated = await prisma.$transaction(async (tx) => {
          const updatedOrder = await tx.order.update({
            where: { id: order.id },
            data: { status: "CANCELLED" },
          });

          await tx.sellerOrder.updateMany({
            where: { orderId: order.id },
            data: { status: "CANCELLED" },
          });

          // Restore inventory
          for (const item of order.orderItems) {
            await tx.inventory.updateMany({
              where: { productId: item.productId },
              data: {
                reservedQty: { decrement: item.quantity },
                availableQty: { increment: item.quantity },
              },
            });
          }

          return updatedOrder;
        });

        await recordAuditEvent({
          category: "ORDER",
          severity: "WARNING",
          action: `ADMIN_ORDER_${action}`,
          actorId: adminUserId,
          actorEmail: adminEmail,
          resourceType: "Order",
          resourceId: order.id,
          metadata: {
            orderNumber: order.orderNumber,
            totalAmount: Number(order.totalAmount),
            reason: reason || "Admin order cancellation and escrow refund",
          },
          req,
        });

        await notifyOrderStateChange(order.id, order.orderNumber, buyerUserId, farmerUserIds, "CANCELLED");

        return { order: updated, action, message: `Order #${order.orderNumber} cancelled and escrow refunded to buyer.` };
      }

      case "RELEASE_ESCROW": {
        // Validation: Payment must be PAID and not already completed
        if (!order.payment || order.payment.paymentStatus !== "PAID") {
          throw new Error("Cannot release escrow for an unpaid order.");
        }
        if (order.status === "COMPLETED") {
          throw new Error("Escrow has already been released for this order.");
        }

        // Execute canonical escrow release through WalletService & SettlementEngine
        await WalletService.executeEscrowRelease(buyerUserId, order.id);

        const updated = await prisma.order.update({
          where: { id: order.id },
          data: { status: "COMPLETED" },
        });

        await recordAuditEvent({
          category: "ESCROW",
          severity: "INFO",
          action: "ADMIN_ESCROW_RELEASE",
          actorId: adminUserId,
          actorEmail: adminEmail,
          resourceType: "Order",
          resourceId: order.id,
          metadata: {
            orderNumber: order.orderNumber,
            totalAmount: Number(order.totalAmount),
            reason: reason || "Admin manual escrow release",
          },
          req,
        });

        await notifyOrderStateChange(order.id, order.orderNumber, buyerUserId, farmerUserIds, "COMPLETED");

        return { order: updated, action, message: `Escrow for Order #${order.orderNumber} successfully released to farmer(s).` };
      }

      case "MARK_PROCESSING": {
        if (!["CONFIRMED", "PENDING"].includes(order.status)) {
          throw new Error(`Cannot transition from ${order.status} to PROCESSING.`);
        }
        const updated = await prisma.order.update({
          where: { id: order.id },
          data: { status: "PROCESSING" },
        });
        await recordAuditEvent({
          category: "ORDER",
          severity: "INFO",
          action: "ADMIN_ORDER_PROCESSING",
          actorId: adminUserId,
          actorEmail: adminEmail,
          resourceType: "Order",
          resourceId: order.id,
          req,
        });
        await notifyOrderStateChange(order.id, order.orderNumber, buyerUserId, farmerUserIds, "PROCESSING");
        return { order: updated, action, message: `Order #${order.orderNumber} marked PROCESSING.` };
      }

      case "MARK_READY_FOR_PICKUP": {
        if (order.status !== "PROCESSING") {
          throw new Error(`Cannot transition from ${order.status} to READY_FOR_PICKUP.`);
        }
        const updated = await prisma.order.update({
          where: { id: order.id },
          data: { status: "READY_FOR_PICKUP" },
        });
        await recordAuditEvent({
          category: "ORDER",
          severity: "INFO",
          action: "ADMIN_ORDER_READY_FOR_PICKUP",
          actorId: adminUserId,
          actorEmail: adminEmail,
          resourceType: "Order",
          resourceId: order.id,
          req,
        });
        await notifyOrderStateChange(order.id, order.orderNumber, buyerUserId, farmerUserIds, "READY_FOR_PICKUP");
        return { order: updated, action, message: `Order #${order.orderNumber} marked READY_FOR_PICKUP.` };
      }

      case "MARK_IN_TRANSIT": {
        if (order.status !== "READY_FOR_PICKUP") {
          throw new Error(`Cannot transition from ${order.status} to IN_TRANSIT.`);
        }
        const updated = await prisma.$transaction(async (tx) => {
          const ord = await tx.order.update({
            where: { id: order.id },
            data: { status: "IN_TRANSIT" },
          });

          await tx.delivery.upsert({
            where: { orderId: order.id },
            create: {
              orderId: order.id,
              deliveryAddress: order.shippingAddress?.addressLine || "Buyer Address",
              deliveryStatus: "IN_TRANSIT",
              trackingNumber: trackingNumber || `TRK-${Date.now()}`,
            },
            update: {
              deliveryStatus: "IN_TRANSIT",
              trackingNumber: trackingNumber || undefined,
            },
          });

          return ord;
        });

        await recordAuditEvent({
          category: "DELIVERY",
          severity: "INFO",
          action: "ADMIN_ORDER_IN_TRANSIT",
          actorId: adminUserId,
          actorEmail: adminEmail,
          resourceType: "Order",
          resourceId: order.id,
          req,
        });
        await notifyOrderStateChange(order.id, order.orderNumber, buyerUserId, farmerUserIds, "IN_TRANSIT");
        return { order: updated, action, message: `Order #${order.orderNumber} dispatched and in transit.` };
      }

      case "MARK_DELIVERED": {
        if (order.status !== "IN_TRANSIT") {
          throw new Error(`Cannot transition from ${order.status} to DELIVERED.`);
        }
        const updated = await prisma.$transaction(async (tx) => {
          const ord = await tx.order.update({
            where: { id: order.id },
            data: { status: "DELIVERED" },
          });

          await tx.delivery.updateMany({
            where: { orderId: order.id },
            data: {
              deliveryStatus: "DELIVERED",
              deliveredAt: new Date(),
            },
          });

          return ord;
        });

        await recordAuditEvent({
          category: "DELIVERY",
          severity: "INFO",
          action: "ADMIN_ORDER_DELIVERED",
          actorId: adminUserId,
          actorEmail: adminEmail,
          resourceType: "Order",
          resourceId: order.id,
          req,
        });
        await notifyOrderStateChange(order.id, order.orderNumber, buyerUserId, farmerUserIds, "DELIVERED");
        return { order: updated, action, message: `Order #${order.orderNumber} marked DELIVERED.` };
      }

      default:
        throw new Error(`Unsupported admin action: ${action}`);
    }
  }
}
