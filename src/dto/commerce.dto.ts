// ─── Commerce Domain DTOs ───
// Phase 2.4 — Production Commerce & Order Lifecycle Foundation

// ────────────────────────────────────────────────────────────
// Shared Sub-DTOs
// ────────────────────────────────────────────────────────────

export interface OrderItemDTO {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  categoryName: string;
  farmerName: string;
  farmerState: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  unit: string;
}

export interface OrderPaymentDTO {
  id: string;
  amount: number;
  paymentMethod: "CARD" | "BANK_TRANSFER" | "WALLET";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  transactionRef: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface OrderDeliveryDTO {
  id: string;
  deliveryAddress: string;
  deliveryStatus: "PENDING" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED";
  trackingNumber: string | null;
  estimatedDelivery: string | null;
  deliveredAt: string | null;
  logisticsPartner: string | null;
}

export interface OrderTimelineEventDTO {
  step: string;
  description: string;
  date: string | null;
  status: "completed" | "current" | "upcoming";
}

export interface OrderSummaryItemDTO {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  itemCount: number;
  primaryProductName: string;
  primaryProductImage: string;
  buyerName: string;
  paymentStatus: string;
  deliveryStatus: string;
  createdAt: string;
}

// ────────────────────────────────────────────────────────────
// OrdersPageDTO — Buyer & Farmer Orders List
// ────────────────────────────────────────────────────────────

export interface OrdersPageDTO {
  orders: OrderSummaryItemDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  statusSummary: {
    all: number;
    pending: number;
    confirmed: number;
    processing: number;
    readyForPickup: number;
    inTransit: number;
    delivered: number;
    completed: number;
    cancelled: number;
  };
  statistics: {
    totalSpent: number;
    totalOrders: number;
    avgOrderValue: number;
  };
}

// ────────────────────────────────────────────────────────────
// OrderDTO — Single Order Detail Page
// ────────────────────────────────────────────────────────────

export interface OrderDTO {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  buyer: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    address: string | null;
    state: string | null;
  };
  items: OrderItemDTO[];
  payment: OrderPaymentDTO | null;
  delivery: OrderDeliveryDTO | null;
  timeline: OrderTimelineEventDTO[];
  escrow: {
    status: "HELD" | "RELEASED" | "REFUNDED" | "NONE";
    amount: number;
    releaseEligible: boolean;
  };
  invoice: {
    invoiceNumber: string;
    subtotal: number;
    shipping: number;
    total: number;
    issuedAt: string;
  };
  disputeEligibility: {
    canDispute: boolean;
    reason: string;
    existingDisputeId: string | null;
  };
}

// ────────────────────────────────────────────────────────────
// AdminOrdersPageDTO — Admin Commerce Management
// ────────────────────────────────────────────────────────────

export interface AdminOrdersPageDTO {
  orders: OrderSummaryItemDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  metrics: {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    totalUsers: number;
  };
}

// ────────────────────────────────────────────────────────────
// CheckoutValidationDTO — Pre-Checkout Stock Validation
// ────────────────────────────────────────────────────────────

export interface CheckoutValidationItemDTO {
  productId: string;
  productName: string;
  requestedQty: number;
  availableQty: number;
  unitPrice: number;
  subtotal: number;
  isAvailable: boolean;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "INSUFFICIENT";
}

export interface CheckoutValidationDTO {
  isValid: boolean;
  items: CheckoutValidationItemDTO[];
  recalculatedTotal: number;
  shipping: number;
  grandTotal: number;
  errors: string[];
}
