export type CurrencyCode =
  | "NGN"
  | "USD"
  | "EUR"
  | "GBP"
  | "CAD"
  | "AUD"
  | "ZAR"
  | "GHS"
  | "KES"
  | "XOF"
  | "XAF"
  | "EGP"
  | "MAD"
  | "TND"
  | "RWF"
  | "UGX"
  | "TZS"
  | "ETB"
  | "JPY"
  | "CNY"
  | "INR"
  | "BRL"
  | "RUB"
  | "AED"
  | "SAR"
  | "QAR"
  | "SGD"
  | "HKD"
  | "NZD"
  | "CHF"
  | "SEK"
  | "NOK"
  | "DKK"
  | "PLN"
  | "MXN"
  | "TRY";

export interface CurrencyMetadata {
  code: CurrencyCode;
  symbol: string;
  name: string;
  decimals: number;
  locale: string;
  isPopular?: boolean;
  flag?: string;
}

export interface Region {
  code: string;
  name: string;
}

export interface CountryMetadata {
  code: string; // ISO 3166-1 alpha-2 (e.g. "NG", "US")
  codeAlpha3: string; // ISO 3166-1 alpha-3 (e.g. "NGA", "USA")
  name: string;
  flag: string;
  defaultCurrency: CurrencyCode;
  defaultLocale: string;
  defaultTimezone: string;
  phoneCode: string;
  regions: Region[];
}

export interface TimezoneMetadata {
  identifier: string; // IANA identifier (e.g. "Africa/Lagos", "America/New_York")
  name: string;
  offset: string; // (e.g. "UTC+1", "UTC-5")
  region: string; // Continent/Group (e.g. "Africa", "Americas")
}

export interface FxRates {
  base: "NGN";
  timestamp: number;
  rates: Record<CurrencyCode, number>;
}

export interface UserPreferencesPayload {
  countryCode: string;
  regionCode: string;
  currencyCode: CurrencyCode;
  timezone: string;
  locale: string;
  isCustomCurrency?: boolean;
}

export interface LocalizationState extends UserPreferencesPayload {
  fxRates: FxRates;
  fxLoading: boolean;
  fxError: string | null;
  detectedLocation?: {
    countryCode: string;
    countryName: string;
    regionName?: string;
    city?: string;
    timezone?: string;
  } | null;
}
