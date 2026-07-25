/**
 * Focused Modular Wallet DTO Architecture for SmartHub AgroChain
 * Single Source of Truth contracts for all wallet, deposit, withdrawal, escrow, and ledger interactions.
 */

export interface WalletBalanceDTO {
  currency: "NGN";
  availableBalance: number;
  formattedAvailableBalance: string;
  escrowBalance: number;
  formattedEscrowBalance: string;
  frozenBalance: number;
  formattedFrozenBalance: string;
  pendingWithdrawals: number;
  formattedPendingWithdrawals: string;
}

export interface WalletSummaryDTO {
  monthlySpend: number;
  formattedMonthlySpend: string;
  lifetimeSpend: number;
  formattedLifetimeSpend: string;
  totalDeposits: number;
  formattedTotalDeposits: string;
  totalWithdrawals: number;
  formattedTotalWithdrawals: string;
}

export interface WalletTransactionDTO {
  id: string;
  reference: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "ESCROW_LOCK" | "ESCROW_RELEASE" | "REFUND" | "PLATFORM_FEE";
  amount: number;
  formattedAmount: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  description: string;
  date: string;
  method: string;
}

export interface LinkedBankDTO {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  isVerified: boolean;
}

export interface VirtualAccountDetailsDTO {
  bankName: string;
  accountName: string;
  accountNumber: string;
  paymentReference: string;
  instructions: string;
}

export interface FundingInstructionsDTO {
  virtualAccount?: VirtualAccountDetailsDTO;
  paystackCheckoutUrl?: string;
  flutterwaveCheckoutUrl?: string;
  supportedMethods: Array<"VIRTUAL_ACCOUNT" | "PAYSTACK" | "FLUTTERWAVE" | "USSD" | "CARD">;
}

export interface WithdrawalLimitDTO {
  tier: string;
  monthlyLimit: number;
  formattedMonthlyLimit: string;
  remainingLimit: number;
  formattedRemainingLimit: string;
}

export interface WalletPageDTO {
  userId: string;
  balances: WalletBalanceDTO;
  summary: WalletSummaryDTO;
  limits: WithdrawalLimitDTO;
  fundingInstructions: FundingInstructionsDTO;
  linkedBanks: LinkedBankDTO[];
  recentTransactions: WalletTransactionDTO[];
}
