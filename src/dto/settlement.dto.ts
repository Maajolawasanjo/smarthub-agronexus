import { GeneratedReceipt, SettlementBreakdown } from "@/lib/settlement";

export interface SettlementDTO {
  orderId: string;
  orderNumber: string;
  transactionRef: string;
  paymentMethod: string;
  paymentStatus: string;
  breakdown: SettlementBreakdown;
  escrow: {
    status: "HELD" | "RELEASED" | "REFUNDED" | "DISPUTED";
    lockedAmount: number;
    releaseEligible: boolean;
  };
  receipt: GeneratedReceipt | null;
  audit: {
    createdAt: string;
    paidAt: string | null;
    idempotencyKey: string;
  };
}

export interface PaymentTransactionItemDTO {
  id: string;
  orderNumber: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  type: "DEPOSIT" | "ESCROW_LOCK" | "SETTLEMENT" | "REFUND";
  transactionRef: string;
  date: string;
}

export interface PaymentsDashboardDTO {
  balance: {
    available: number;
    pendingEscrow: number;
    totalSettled: number;
  };
  statistics: {
    totalTransactions: number;
    successfulPayments: number;
    refundedCount: number;
    totalPlatformFeesCollected: number;
  };
  recentTransactions: PaymentTransactionItemDTO[];
}
