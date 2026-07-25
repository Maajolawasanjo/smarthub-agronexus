/**
 * Fulfillment Engine for SmartHub AgroChain
 * Centralized state machine & business policy governing order fulfillment,
 * shipment tracking, logistics assignment, and escrow release triggers.
 */

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY_FOR_PICKUP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

export interface FulfillmentTimelineItemDTO {
  stage: string;
  label: string;
  description: string;
  date: string | null;
  status: "completed" | "current" | "upcoming";
}

export interface FulfillmentAvailableActions {
  canConfirmOrder: boolean;
  canProcessProduce: boolean;
  canMarkReadyForPickup: boolean;
  canAssignLogistics: boolean;
  canDispatchShipment: boolean;
  canMarkDelivered: boolean;
  canConfirmBuyerReceipt: boolean; // Triggers Escrow Release
  canOpenDispute: boolean;
  canCancelOrder: boolean;
}

const ALLOWED_TRANSITIONS: Record<string, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["READY_FOR_PICKUP", "CANCELLED"],
  READY_FOR_PICKUP: ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["DELIVERED"],
  DELIVERED: ["COMPLETED"], // COMPLETED triggered by Buyer Delivery Confirmation & Escrow Release
  COMPLETED: [],
  CANCELLED: [],
};

/**
 * Validates whether a state machine transition is allowed
 */
export function isValidFulfillmentTransition(currentStatus: string, targetStatus: OrderStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

/**
 * Derives available actions for Buyer, Farmer, and Admin
 */
export function deriveFulfillmentActions(
  status: string,
  userRole: "BUYER" | "FARMER" | "ADMIN"
): FulfillmentAvailableActions {
  const isBuyer = userRole === "BUYER";
  const isFarmer = userRole === "FARMER";
  const isAdmin = userRole === "ADMIN";

  return {
    canConfirmOrder: (isFarmer || isAdmin) && status === "PENDING",
    canProcessProduce: (isFarmer || isAdmin) && status === "CONFIRMED",
    canMarkReadyForPickup: (isFarmer || isAdmin) && status === "PROCESSING",
    canAssignLogistics: (isAdmin || isFarmer) && (status === "READY_FOR_PICKUP" || status === "PROCESSING"),
    canDispatchShipment: (isAdmin || isFarmer) && status === "READY_FOR_PICKUP",
    canMarkDelivered: isAdmin && status === "IN_TRANSIT",
    canConfirmBuyerReceipt: (isBuyer || isAdmin) && status === "DELIVERED",
    canOpenDispute: (isBuyer || isFarmer) && (status === "IN_TRANSIT" || status === "DELIVERED"),
    canCancelOrder: (isBuyer || isFarmer || isAdmin) && ["PENDING", "CONFIRMED"].includes(status),
  };
}

/**
 * Evaluates whether Escrow can be safely released to Farmer
 */
export function canReleaseEscrow(orderStatus: string, paymentStatus: string): boolean {
  return (orderStatus === "DELIVERED" || orderStatus === "COMPLETED") && paymentStatus === "PAID";
}

/**
 * Generates dynamic fulfillment timeline
 */
export function generateFulfillmentTimeline(
  orderCreatedAt: Date,
  status: string,
  delivery?: { estimatedDelivery?: Date | null; deliveredAt?: Date | null } | null
): FulfillmentTimelineItemDTO[] {
  const isCompleted = status === "COMPLETED";
  const isDelivered = status === "DELIVERED" || isCompleted;
  const isInTransit = status === "IN_TRANSIT" || isDelivered;
  const isReady = status === "READY_FOR_PICKUP" || isInTransit;
  const isProcessing = status === "PROCESSING" || isReady;
  const isConfirmed = status === "CONFIRMED" || isProcessing;

  return [
    {
      stage: "ORDER_PLACED",
      label: "Order Placed",
      description: "Buyer placed order and escrow funds locked.",
      date: orderCreatedAt.toISOString(),
      status: "completed",
    },
    {
      stage: "CONFIRMED",
      label: "Farmer Confirmation",
      description: "Farmer confirmed order availability and specs.",
      date: isConfirmed ? orderCreatedAt.toISOString() : null,
      status: isConfirmed ? "completed" : "current",
    },
    {
      stage: "PROCESSING",
      label: "Produce Preparation",
      description: "Produce aggregated, inspected, and bagged.",
      date: isProcessing ? orderCreatedAt.toISOString() : null,
      status: isProcessing ? "completed" : isConfirmed ? "current" : "upcoming",
    },
    {
      stage: "READY_FOR_PICKUP",
      label: "Ready for Pickup",
      description: "Logistics partner assigned for dispatch.",
      date: isReady ? orderCreatedAt.toISOString() : null,
      status: isReady ? "completed" : isProcessing ? "current" : "upcoming",
    },
    {
      stage: "IN_TRANSIT",
      label: "In Transit",
      description: "Shipment en route to delivery address.",
      date: isInTransit ? orderCreatedAt.toISOString() : null,
      status: isInTransit ? "completed" : isReady ? "current" : "upcoming",
    },
    {
      stage: "DELIVERED",
      label: "Delivered & Buyer Confirmation",
      description: "Produce delivered to buyer. Escrow release pending confirmation.",
      date: delivery?.deliveredAt ? delivery.deliveredAt.toISOString() : null,
      status: isCompleted ? "completed" : isDelivered ? "current" : "upcoming",
    },
  ];
}
