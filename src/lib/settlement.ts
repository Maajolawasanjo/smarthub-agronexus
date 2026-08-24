import crypto from "crypto";
import { config } from "@/lib/config";

/**
 * Settlement Engine for SmartHub AgroChain
 * Centralized financial calculations, platform fee allocation, tax splits,
 * receipt generation, and webhook security authentication.
 */

export interface SettlementBreakdown {
  grossAmount: number;
  platformFeeRate: number; // Single Source of Truth (config.fees.platformFeeRate = 0.05)
  platformFee: number;
  taxRate: number; // e.g. 0.075 (7.5% VAT)
  taxAmount: number;
  netFarmerPayout: number;
}

export interface GeneratedReceipt {
  receiptNumber: string;
  transactionRef: string;
  issuedAt: string;
  paymentMethod: string;
  grossAmount: number;
  platformFee: number;
  taxAmount: number;
  netFarmerPayout: number;
}

const STANDARD_PLATFORM_FEE_RATE = config.fees.platformFeeRate; // 5.0% platform commission (Single Source of Truth)
const STANDARD_TAX_RATE = 0.075; // 7.5% VAT on service fee

/**
 * Calculates complete financial settlement breakdown
 */
export function calculateSettlement(
  grossAmount: number,
  feeRateOverride?: number
): SettlementBreakdown {
  const platformFeeRate = feeRateOverride ?? STANDARD_PLATFORM_FEE_RATE;
  const platformFee = Number((grossAmount * platformFeeRate).toFixed(2));
  const taxAmount = Number((platformFee * STANDARD_TAX_RATE).toFixed(2));
  const totalDeductions = platformFee + taxAmount;
  const netFarmerPayout = Number((grossAmount - totalDeductions).toFixed(2));

  return {
    grossAmount,
    platformFeeRate,
    platformFee,
    taxRate: STANDARD_TAX_RATE,
    taxAmount,
    netFarmerPayout,
  };
}

/**
 * Generates official financial receipt object
 */
export function generateReceipt(
  orderNumber: string,
  transactionRef: string,
  paymentMethod: string,
  grossAmount: number
): GeneratedReceipt {
  const breakdown = calculateSettlement(grossAmount);
  const now = new Date();
  const dateStr = now.toISOString().replace(/[-T:.Z]/g, "").slice(0, 8);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);

  return {
    receiptNumber: `REC-${dateStr}-${randomSuffix}`,
    transactionRef,
    issuedAt: now.toISOString(),
    paymentMethod,
    grossAmount: breakdown.grossAmount,
    platformFee: breakdown.platformFee,
    taxAmount: breakdown.taxAmount,
    netFarmerPayout: breakdown.netFarmerPayout,
  };
}

/**
 * Validates webhook security signatures (HMAC SHA-256 & verif-hash secret matching)
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !signatureHeader.trim() || !secret || !secret.trim()) {
    return false;
  }
  const cleanHeader = signatureHeader.trim();
  const cleanSecret = secret.trim();

  // 1. Direct Secret Hash Match (Flutterwave verif-hash header protocol)
  if (cleanHeader.length === cleanSecret.length) {
    if (crypto.timingSafeEqual(Buffer.from(cleanHeader), Buffer.from(cleanSecret))) {
      return true;
    }
  }

  // 2. Cryptographic HMAC SHA-256 Match (raw body payload signature)
  if (rawBody && rawBody.trim()) {
    const computedHmac = crypto
      .createHmac("sha256", cleanSecret)
      .update(rawBody)
      .digest("hex");

    if (
      cleanHeader.length === computedHmac.length &&
      crypto.timingSafeEqual(Buffer.from(cleanHeader), Buffer.from(computedHmac))
    ) {
      return true;
    }
  }

  return false;
}
