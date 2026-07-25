/**
 * Centralized Platform Configuration & Feature Flags for SmartHub AgroChain
 */

export const config = {
  app: {
    name: "SmartHub AgroChain",
    version: "1.0.0-production",
    environment: process.env.NODE_ENV || "development",
  },
  fees: {
    platformFeeRate: 0.05, // 5.0% platform commission (Single Source of Truth)
    vatRate: 0.075, // 7.5% VAT on service fee
  },
  features: {
    enableEscrowAutoRelease: true,
    enableKYCVerification: true,
    enableWebhookSignatureValidation: process.env.NODE_ENV === "production",
    enableBackgroundJobs: true,
  },
  limits: {
    defaultPageSize: 20,
    maxUploadSizeBytes: 5 * 1024 * 1024, // 5MB limit
    tier1DailyWithdrawalLimit: 50000, // ₦50,000 / $50,000
    tier2DailyWithdrawalLimit: 500000,
    tier3DailyWithdrawalLimit: 5000000,
  },
  timeouts: {
    orderAutoCompletionDays: 7, // Auto-complete orders 7 days after delivery
  },
};
