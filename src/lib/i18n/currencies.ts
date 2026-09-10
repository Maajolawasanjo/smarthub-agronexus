import { CurrencyCode, CurrencyMetadata } from "./types";

export const CURRENCIES: Record<CurrencyCode, CurrencyMetadata> = {
  NGN: { code: "NGN", symbol: "₦", name: "Nigerian Naira", decimals: 2, locale: "en-NG", isPopular: true, flag: "🇳🇬" },
  USD: { code: "USD", symbol: "$", name: "US Dollar", decimals: 2, locale: "en-US", isPopular: true, flag: "🇺🇸" },
  EUR: { code: "EUR", symbol: "€", name: "Euro", decimals: 2, locale: "de-DE", isPopular: true, flag: "🇪🇺" },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", decimals: 2, locale: "en-GB", isPopular: true, flag: "🇬🇧" },
  CAD: { code: "CAD", symbol: "CA$", name: "Canadian Dollar", decimals: 2, locale: "en-CA", isPopular: true, flag: "🇨🇦" },
  AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar", decimals: 2, locale: "en-AU", isPopular: true, flag: "🇦🇺" },
  ZAR: { code: "ZAR", symbol: "R", name: "South African Rand", decimals: 2, locale: "en-ZA", isPopular: true, flag: "🇿🇦" },
  GHS: { code: "GHS", symbol: "GH₵", name: "Ghanaian Cedi", decimals: 2, locale: "en-GH", isPopular: true, flag: "🇬🇭" },
  KES: { code: "KES", symbol: "KSh", name: "Kenyan Shilling", decimals: 2, locale: "en-KE", isPopular: true, flag: "🇰🇪" },
  XOF: { code: "XOF", symbol: "CFA", name: "West African CFA Franc", decimals: 0, locale: "fr-SN", isPopular: true, flag: "🇸🇳" },
  XAF: { code: "XAF", symbol: "FCFA", name: "Central African CFA Franc", decimals: 0, locale: "fr-CM", isPopular: false, flag: "🇨🇲" },
  EGP: { code: "EGP", symbol: "E£", name: "Egyptian Pound", decimals: 2, locale: "ar-EG", isPopular: false, flag: "🇪🇬" },
  MAD: { code: "MAD", symbol: "MAD", name: "Moroccan Dirham", decimals: 2, locale: "ar-MA", isPopular: false, flag: "🇲🇦" },
  TND: { code: "TND", symbol: "DT", name: "Tunisian Dinar", decimals: 3, locale: "ar-TN", isPopular: false, flag: "🇹🇳" },
  RWF: { code: "RWF", symbol: "FRw", name: "Rwandan Franc", decimals: 0, locale: "rw-RW", isPopular: false, flag: "🇷🇼" },
  UGX: { code: "UGX", symbol: "USh", name: "Ugandan Shilling", decimals: 0, locale: "en-UG", isPopular: false, flag: "🇺🇬" },
  TZS: { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling", decimals: 0, locale: "sw-TZ", isPopular: false, flag: "🇹🇿" },
  ETB: { code: "ETB", symbol: "Br", name: "Ethiopian Birr", decimals: 2, locale: "am-ET", isPopular: false, flag: "🇪🇹" },
  JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen", decimals: 0, locale: "ja-JP", isPopular: true, flag: "🇯🇵" },
  CNY: { code: "CNY", symbol: "¥", name: "Chinese Yuan", decimals: 2, locale: "zh-CN", isPopular: true, flag: "🇨🇳" },
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee", decimals: 2, locale: "en-IN", isPopular: true, flag: "🇮🇳" },
  BRL: { code: "BRL", symbol: "R$", name: "Brazilian Real", decimals: 2, locale: "pt-BR", isPopular: false, flag: "🇧🇷" },
  RUB: { code: "RUB", symbol: "₽", name: "Russian Ruble", decimals: 2, locale: "ru-RU", isPopular: false, flag: "🇷🇺" },
  AED: { code: "AED", symbol: "AED", name: "UAE Dirham", decimals: 2, locale: "ar-AE", isPopular: true, flag: "🇦🇪" },
  SAR: { code: "SAR", symbol: "SAR", name: "Saudi Riyal", decimals: 2, locale: "ar-SA", isPopular: false, flag: "🇸🇦" },
  QAR: { code: "QAR", symbol: "QAR", name: "Qatari Riyal", decimals: 2, locale: "ar-QA", isPopular: false, flag: "🇶🇦" },
  SGD: { code: "SGD", symbol: "S$", name: "Singapore Dollar", decimals: 2, locale: "en-SG", isPopular: false, flag: "🇸🇬" },
  HKD: { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar", decimals: 2, locale: "zh-HK", isPopular: false, flag: "🇭🇰" },
  NZD: { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar", decimals: 2, locale: "en-NZ", isPopular: false, flag: "🇳🇿" },
  CHF: { code: "CHF", symbol: "CHF", name: "Swiss Franc", decimals: 2, locale: "de-CH", isPopular: false, flag: "🇨🇭" },
  SEK: { code: "SEK", symbol: "kr", name: "Swedish Krona", decimals: 2, locale: "sv-SE", isPopular: false, flag: "🇸🇪" },
  NOK: { code: "NOK", symbol: "kr", name: "Norwegian Krone", decimals: 2, locale: "nb-NO", isPopular: false, flag: "🇳🇴" },
  DKK: { code: "DKK", symbol: "kr", name: "Danish Krone", decimals: 2, locale: "da-DK", isPopular: false, flag: "🇩🇰" },
  PLN: { code: "PLN", symbol: "zł", name: "Polish Zloty", decimals: 2, locale: "pl-PL", isPopular: false, flag: "🇵🇱" },
  MXN: { code: "MXN", symbol: "MX$", name: "Mexican Peso", decimals: 2, locale: "es-MX", isPopular: false, flag: "🇲🇽" },
  TRY: { code: "TRY", symbol: "₺", name: "Turkish Lira", decimals: 2, locale: "tr-TR", isPopular: false, flag: "🇹🇷" },
};

export const CURRENCY_LIST = Object.values(CURRENCIES);
export const POPULAR_CURRENCIES = CURRENCY_LIST.filter((c) => c.isPopular);

export function getCurrencyMetadata(code: string): CurrencyMetadata {
  const upper = code?.toUpperCase() as CurrencyCode;
  return CURRENCIES[upper] || CURRENCIES.NGN;
}
