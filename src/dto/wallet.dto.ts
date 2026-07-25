export interface VerificationLimitsDTO {
  monthlyLimit: number;
  remainingLimit: number;
  tier: "VERIFIED TIER 1" | "VERIFIED TIER 2" | "VERIFIED TIER 3";
}

export interface PaymentItemDTO {
  id: string;
  transactionRef: string;
  description: string;
  date: string;
  status: "PAID" | "PENDING" | "FAILED" | "REFUNDED";
  amount: number;
  formattedAmount: string;
  type: "credit" | "debit";
  method: string;
  payer: string;
  subtotal: string;
  vat: string;
  fee: string;
  logistics: string;
  total: string;
}

export interface EscrowOrderDTO {
  orderId: string;
  produce: string;
  farmer: string;
  amount: number;
  formattedAmount: string;
  status: string;
  logisticsProgress: number;
  deliveryEta: string;
  milestone: string;
  canRelease: boolean;
}

export interface DisputeItemDTO {
  ticketId: string;
  orderId: string;
  subject: string;
  farmer: string;
  amount: number;
  formattedAmount: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";
  resolution?: string;
  date: string;
  lastUpdate: string;
}

export interface WalletSummaryDTO {
  availableBalance: number;
  pendingBalance: number;
  escrowBalance: number;
  frozenBalance: number;
  monthlySpend: number;
  lifetimeSpend: number;
  totalDeposits: number;
  totalWithdrawals: number;
  verificationLimits: VerificationLimitsDTO;
  currency: string;
  payments: PaymentItemDTO[];
  escrowOrders: EscrowOrderDTO[];
  disputes: DisputeItemDTO[];
}
