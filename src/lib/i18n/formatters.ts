import { CurrencyCode } from "./types";
import { getCurrencyMetadata } from "./currencies";
import { convertFromNGN } from "./fx";

export interface FormatCurrencyOptions {
  currency?: CurrencyCode;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  showCode?: boolean;
  convertFromNGNBase?: boolean;
  fxRates?: Record<string, number>;
}

/**
 * Format a monetary amount using Intl.NumberFormat.
 * If convertFromNGNBase is true (default), the input amount is assumed to be in base NGN
 * and converted into target currency using fxRates.
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  options: FormatCurrencyOptions = {}
): string {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount ?? 0;
  if (isNaN(numericAmount)) return "₦0.00";

  const targetCurrency = options.currency || "NGN";
  const locale = options.locale || getCurrencyMetadata(targetCurrency).locale || "en-NG";
  const currencyMeta = getCurrencyMetadata(targetCurrency);

  // Perform FX presentation conversion if requested (defaults to true if target Currency != NGN)
  let displayValue = numericAmount;
  if (options.convertFromNGNBase !== false && targetCurrency !== "NGN") {
    displayValue = convertFromNGN(numericAmount, targetCurrency, options.fxRates);
  }

  const minDecimals = options.minimumFractionDigits ?? currencyMeta.decimals;
  const maxDecimals = options.maximumFractionDigits ?? currencyMeta.decimals;

  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: targetCurrency,
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    }).format(displayValue);

    return options.showCode ? `${formatted} (${targetCurrency})` : formatted;
  } catch (error) {
    // Fallback if Intl fails for a custom locale
    const symbol = currencyMeta.symbol || targetCurrency;
    return `${symbol}${displayValue.toLocaleString(undefined, {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    })}`;
  }
}

export interface FormatDateOptions {
  locale?: string;
  timezone?: string;
  dateStyle?: "full" | "long" | "medium" | "short";
  timeStyle?: "full" | "long" | "medium" | "short";
}

/**
 * Format a Date object or ISO string according to target timezone and locale.
 */
export function formatDate(
  date: Date | string | null | undefined,
  options: FormatDateOptions = {}
): string {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return "";

  const locale = options.locale || "en-NG";
  const timeZone = options.timezone || "Africa/Lagos";

  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: options.dateStyle || "medium",
      timeZone,
    }).format(dateObj);
  } catch (error) {
    return dateObj.toLocaleDateString();
  }
}

/**
 * Format a Date object or ISO string into Date + Time according to target timezone and locale.
 */
export function formatDateTime(
  date: Date | string | null | undefined,
  options: FormatDateOptions = {}
): string {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return "";

  const locale = options.locale || "en-NG";
  const timeZone = options.timezone || "Africa/Lagos";

  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: options.dateStyle || "medium",
      timeStyle: options.timeStyle || "short",
      timeZone,
    }).format(dateObj);
  } catch (error) {
    return dateObj.toLocaleString();
  }
}

/**
 * Format generic numbers using target locale.
 */
export function formatNumber(
  value: number | string | null | undefined,
  locale = "en-NG",
  options: Intl.NumberFormatOptions = {}
): string {
  const num = typeof value === "string" ? parseFloat(value) : value ?? 0;
  if (isNaN(num)) return "0";
  try {
    return new Intl.NumberFormat(locale, options).format(num);
  } catch (error) {
    return num.toLocaleString();
  }
}
