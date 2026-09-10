import { CurrencyCode, FxRates } from "./types";
import { getCurrencyMetadata } from "./currencies";

/**
 * Fallback static exchange rates relative to NGN (1 NGN = X target currency).
 * Updated baseline anchor.
 */
export const STATIC_FALLBACK_RATES: Record<CurrencyCode, number> = {
  NGN: 1.0,
  USD: 0.00067,   // ~ 1,500 NGN / USD
  EUR: 0.00061,   // ~ 1,639 NGN / EUR
  GBP: 0.00052,   // ~ 1,923 NGN / GBP
  CAD: 0.00091,   // ~ 1,098 NGN / CAD
  AUD: 0.00100,   // ~ 1,000 NGN / AUD
  ZAR: 0.01200,   // ~ 83.3 NGN / ZAR
  GHS: 0.01000,   // ~ 100 NGN / GHS
  KES: 0.00860,   // ~ 116 NGN / KES
  XOF: 0.40000,   // ~ 2.5 NGN / XOF
  XAF: 0.40000,   // ~ 2.5 NGN / XAF
  EGP: 0.03200,   // ~ 31.25 NGN / EGP
  MAD: 0.00660,   // ~ 151.5 NGN / MAD
  TND: 0.00210,   // ~ 476 NGN / TND
  RWF: 0.89000,   // ~ 1.12 NGN / RWF
  UGX: 2.45000,   // ~ 0.41 NGN / UGX
  TZS: 1.75000,   // ~ 0.57 NGN / TZS
  ETB: 0.07600,   // ~ 13.1 NGN / ETB
  JPY: 0.10000,   // ~ 10 NGN / JPY
  CNY: 0.00480,   // ~ 208 NGN / CNY
  INR: 0.05600,   // ~ 17.8 NGN / INR
  BRL: 0.00370,   // ~ 270 NGN / BRL
  RUB: 0.06100,   // ~ 16.4 NGN / RUB
  AED: 0.00245,   // ~ 408 NGN / AED
  SAR: 0.00251,   // ~ 398 NGN / SAR
  QAR: 0.00244,   // ~ 410 NGN / QAR
  SGD: 0.00090,   // ~ 1,111 NGN / SGD
  HKD: 0.00520,   // ~ 192 NGN / HKD
  NZD: 0.00110,   // ~ 909 NGN / NZD
  CHF: 0.00059,   // ~ 1,695 NGN / CHF
  SEK: 0.00700,   // ~ 142 NGN / SEK
  NOK: 0.00710,   // ~ 140 NGN / NOK
  DKK: 0.00460,   // ~ 217 NGN / DKK
  PLN: 0.00260,   // ~ 384 NGN / PLN
  MXN: 0.01300,   // ~ 76.9 NGN / MXN
  TRY: 0.02200,   // ~ 45.4 NGN / TRY
};

/**
 * Convert a canonical NGN amount into a target display currency.
 */
export function convertFromNGN(
  amountNGN: number,
  targetCurrency: CurrencyCode,
  customRates?: Record<string, number>
): number {
  if (!amountNGN || amountNGN === 0) return 0;
  if (targetCurrency === "NGN") return amountNGN;

  const rates = customRates || STATIC_FALLBACK_RATES;
  const rate = rates[targetCurrency] ?? STATIC_FALLBACK_RATES[targetCurrency] ?? 1.0;

  const converted = amountNGN * rate;

  // Round according to target currency decimal precision rules
  const decimals = getCurrencyMetadata(targetCurrency).decimals;
  const factor = Math.pow(10, decimals);
  return Math.round((converted + Number.EPSILON) * factor) / factor;
}

/**
 * Convert a target currency display amount back to canonical NGN (for estimate reference only).
 */
export function convertToNGN(
  amountDisplay: number,
  sourceCurrency: CurrencyCode,
  customRates?: Record<string, number>
): number {
  if (!amountDisplay || amountDisplay === 0) return 0;
  if (sourceCurrency === "NGN") return amountDisplay;

  const rates = customRates || STATIC_FALLBACK_RATES;
  const rate = rates[sourceCurrency] ?? STATIC_FALLBACK_RATES[sourceCurrency] ?? 1.0;

  if (rate === 0) return amountDisplay;

  const convertedNGN = amountDisplay / rate;
  return Math.round((convertedNGN + Number.EPSILON) * 100) / 100;
}
