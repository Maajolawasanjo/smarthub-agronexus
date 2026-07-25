/**
 * Event-Driven Infrastructure for SmartHub AgroChain
 * Decouples core business transactions from communication, audit, and email side-effects.
 */

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export type AgroEventType =
  | "USER_REGISTERED"
  | "KYC_SUBMITTED"
  | "KYC_APPROVED"
  | "KYC_REJECTED"
  | "ORDER_PLACED"
  | "ORDER_CONFIRMED"
  | "ORDER_DELIVERED"
  | "ESCROW_RELEASED"
  | "PAYMENT_COMPLETED"
  | "REFUND_EXECUTED";

export interface AgroEventPayload {
  userId: string;
  orderId?: string;
  orderNumber?: string;
  amount?: number;
  remarks?: string;
  documentType?: string;
  metadata?: Record<string, any>;
}

export type AgroEventHandler = (eventType: AgroEventType, payload: AgroEventPayload) => Promise<void>;

const eventSubscribers: AgroEventHandler[] = [];

/**
 * Registers an event subscriber handler
 */
export function subscribeAgroEvent(handler: AgroEventHandler) {
  eventSubscribers.push(handler);
}

/**
 * Asynchronously publishes a domain business event to all registered subscribers
 */
export async function publishAgroEvent(eventType: AgroEventType, payload: AgroEventPayload) {
  logger.info(`AgroEvent published: ${eventType}`, { userId: payload.userId, orderId: payload.orderId });

  // Execute subscribers in parallel background tasks
  const promises = eventSubscribers.map((handler) =>
    handler(eventType, payload).catch((err) => {
      logger.error(`Error in AgroEvent subscriber for ${eventType}`, err, { payload });
    })
  );

  await Promise.allSettled(promises);
}

// ────────────────────────────────────────────────────────────
// Core Subscribers
// ────────────────────────────────────────────────────────────

// 1. In-App Notification Subscriber
subscribeAgroEvent(async (eventType, payload) => {
  let title = "System Notification";
  let message = "You have a new update on SmartHub AgroChain.";

  switch (eventType) {
    case "KYC_SUBMITTED":
      title = "KYC Document Submitted";
      message = `Your ${payload.documentType?.replace(/_/g, " ") || "identity document"} has been submitted for compliance review.`;
      break;
    case "KYC_APPROVED":
      title = "Identity Verified 🎉";
      message = "Congratulations! Your identity document has been verified. You now hold the Verified Producer badge.";
      break;
    case "KYC_REJECTED":
      title = "Verification Action Required";
      message = `Verification was rejected. Remarks: ${payload.remarks || "Please re-upload document."}`;
      break;
    case "ORDER_PLACED":
      title = `Order Placed #${payload.orderNumber}`;
      message = `Your order #${payload.orderNumber} ($${payload.amount?.toLocaleString()}) has been placed and escrow locked.`;
      break;
    case "ORDER_CONFIRMED":
      title = `Order Confirmed #${payload.orderNumber}`;
      message = `Farmer has confirmed availability for order #${payload.orderNumber}.`;
      break;
    case "ORDER_DELIVERED":
      title = `Order Delivered #${payload.orderNumber}`;
      message = `Produce for order #${payload.orderNumber} delivered. Confirm receipt to release escrow.`;
      break;
    case "ESCROW_RELEASED":
      title = `Escrow Released #${payload.orderNumber}`;
      message = `Payment of $${payload.amount?.toLocaleString()} successfully settled and released.`;
      break;
    case "PAYMENT_COMPLETED":
      title = `Payment Confirmed #${payload.orderNumber}`;
      message = `Payment of $${payload.amount?.toLocaleString()} received and held safely in AgroChain escrow.`;
      break;
    case "REFUND_EXECUTED":
      title = `Refund Processed #${payload.orderNumber}`;
      message = `Refund of $${payload.amount?.toLocaleString()} processed. Reason: ${payload.remarks}`;
      break;
  }

  try {
    await prisma.notification.create({
      data: {
        userId: payload.userId,
        title,
        message,
        type: eventType.includes("ORDER") ? "ORDER" : eventType.includes("PAYMENT") || eventType.includes("ESCROW") ? "PAYMENT" : "SYSTEM",
      },
    });
  } catch (err) {
    logger.error("Failed to create in-app notification in subscriber", err);
  }
});

// 2. Audit Trail Subscriber
subscribeAgroEvent(async (eventType, payload) => {
  logger.security(`AUDIT_EVENT: ${eventType}`, {
    userId: payload.userId,
    orderId: payload.orderId,
    amount: payload.amount,
    timestamp: new Date().toISOString(),
  });
});
