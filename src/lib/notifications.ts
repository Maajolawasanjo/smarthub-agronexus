import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export type NotificationType = "SYSTEM" | "ORDER" | "PAYMENT" | "DELIVERY";

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
      },
    });

    logger.info("Notification created", {
      userId: params.userId,
      notificationId: notification.id,
      title: params.title,
    });

    // Simulated Outbox Queue Dispatch for Email/SMS channels
    dispatchOutboxChannels({
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
    }).catch((err) => logger.error("Outbox dispatch warning", err));

    return notification;
  } catch (error) {
    logger.error("Failed to create notification", error, { userId: params.userId });
    return null;
  }
}

async function dispatchOutboxChannels(params: CreateNotificationParams) {
  // Outbox Queue simulation: Logs SMS/Email payload for production background worker pickup
  console.log(`[OUTBOX_QUEUE] Dispatching ${params.type} notification to User (${params.userId}): "${params.title} - ${params.message}" via Email & SMS channels.`);
}

export async function notifyOrderStateChange(
  orderId: string,
  orderNumber: string,
  buyerUserId: string,
  farmerUserIds: string[],
  newStatus: string
) {
  const statusMessages: Record<string, { buyer: string; farmer: string }> = {
    CONFIRMED: {
      buyer: `Your order #${orderNumber} has been accepted by the farmer. Preparing harvest produce.`,
      farmer: `You accepted order #${orderNumber}. Please package produce for logistics pickup.`,
    },
    PROCESSING: {
      buyer: `Order #${orderNumber} is currently undergoing cleaning, packaging, and quality checks.`,
      farmer: `Order #${orderNumber} is in processing stage.`,
    },
    IN_TRANSIT: {
      buyer: `Order #${orderNumber} has been dispatched! Logistics tracking is active.`,
      farmer: `Order #${orderNumber} has been picked up by logistics carrier.`,
    },
    DELIVERED: {
      buyer: `Order #${orderNumber} has arrived at destination! Please inspect and confirm receipt to release escrow.`,
      farmer: `Order #${orderNumber} delivered to buyer. Escrow release pending buyer confirmation.`,
    },
    COMPLETED: {
      buyer: `Order #${orderNumber} marked completed. Thank you for buying from SmartHub AgroChain!`,
      farmer: `Order #${orderNumber} completed! Escrow funds have been credited to your wallet balance.`,
    },
    CANCELLED: {
      buyer: `Order #${orderNumber} has been cancelled. Funds have been refunded to your wallet.`,
      farmer: `Order #${orderNumber} was cancelled. Reserved inventory has been restored.`,
    },
  };

  const msg = statusMessages[newStatus];
  if (!msg) return;

  // Buyer Notification
  await createNotification({
    userId: buyerUserId,
    title: `Order #${orderNumber} Status: ${newStatus}`,
    message: msg.buyer,
    type: "ORDER",
  });

  // Farmer Notifications
  for (const farmerId of farmerUserIds) {
    await createNotification({
      userId: farmerId,
      title: `Order #${orderNumber} Status: ${newStatus}`,
      message: msg.farmer,
      type: "ORDER",
    });
  }
}
