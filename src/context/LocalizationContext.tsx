"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { CurrencyCode, CurrencyMetadata, CountryMetadata } from "@/lib/i18n/types";
import { CURRENCIES, getCurrencyMetadata } from "@/lib/i18n/currencies";
import { COUNTRIES, getCountryMetadata } from "@/lib/i18n/countries";
import { STATIC_FALLBACK_RATES, convertFromNGN as fxConvertFromNGN } from "@/lib/i18n/fx";
import {
  formatCurrency as i18nFormatCurrency,
  formatDate as i18nFormatDate,
  formatDateTime as i18nFormatDateTime,
  FormatCurrencyOptions,
  FormatDateOptions,
} from "@/lib/i18n/formatters";
import { useUser } from "@/context/UserContext";

const STORAGE_KEY = "smarthub_localization_preferences";

export interface DetectedLocationProposal {
  countryCode: string;
  countryName: string;
  regionCode?: string;
  regionName?: string;
  city?: string;
  timezone?: string;
  currencyCode?: CurrencyCode;
}

export interface LocalizationContextType {
  countryCode: string;
  country: CountryMetadata;
  regionCode: string;
  regionName: string;
  currencyCode: CurrencyCode;
  currency: CurrencyMetadata;
  timezone: string;
  locale: string;
  isCustomCurrency: boolean;
  fxRates: Record<CurrencyCode, number>;
  fxLoading: boolean;
  fxError: string | null;
  detectedLocation: DetectedLocationProposal | null;

  // Actions
  setCountry: (code: string) => void;
  setRegion: (code: string) => void;
  setCurrency: (code: CurrencyCode) => void;
  setTimezone: (tz: string) => void;
  setLocale: (loc: string) => void;
  detectCurrentLocation: () => Promise<void>;
  confirmDetectedLocation: () => void;
  dismissDetectedLocation: () => void;

  // Formatters
  formatCurrency: (amountNGN: number | string | null | undefined, options?: FormatCurrencyOptions) => string;
  formatDate: (date: Date | string | null | undefined, options?: FormatDateOptions) => string;
  formatDateTime: (date: Date | string | null | undefined, options?: FormatDateOptions) => string;
  convertFromNGN: (amountNGN: number) => number;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();

  const [countryCode, setCountryCodeState] = useState<string>("NG");
  const [regionCode, setRegionCodeState] = useState<string>("LA");
  const [currencyCode, setCurrencyCodeState] = useState<CurrencyCode>("NGN");
  const [timezone, setTimezoneState] = useState<string>("Africa/Lagos");
  const [locale, setLocaleState] = useState<string>("en-NG");
  const [isCustomCurrency, setIsCustomCurrency] = useState<boolean>(false);

  const [fxRates, setFxRates] = useState<Record<CurrencyCode, number>>(STATIC_FALLBACK_RATES);
  const [fxLoading, setFxLoading] = useState<boolean>(false);
  const [fxError, setFxError] = useState<string | null>(null);

  const [detectedLocation, setDetectedLocation] = useState<DetectedLocationProposal | null>(null);

  // 1. Fetch live FX rates from server API
  const fetchFxRates = useCallback(async () => {
    try {
      setFxLoading(true);
      const res = await fetch("/api/fx/rates", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.rates) {
          setFxRates(data.rates);
        }
      }
    } catch (err: any) {
      setFxError("Using static fallback exchange rates");
      setFxRates(STATIC_FALLBACK_RATES);
    } finally {
      setFxLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFxRates();
  }, [fetchFxRates]);

  // 2. Hydrate preferences from LocalStorage or authenticated DB profile
  useEffect(() => {
    let loaded = false;

    // Check LocalStorage first for instant guest responsiveness
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.countryCode) setCountryCodeState(parsed.countryCode);
        if (parsed.regionCode) setRegionCodeState(parsed.regionCode);
        if (parsed.currencyCode) setCurrencyCodeState(parsed.currencyCode);
        if (parsed.timezone) setTimezoneState(parsed.timezone);
        if (parsed.locale) setLocaleState(parsed.locale);
        if (typeof parsed.isCustomCurrency === "boolean") setIsCustomCurrency(parsed.isCustomCurrency);
        loaded = true;
      }
    } catch (e) {
      console.error("[LOCALIZATION] Failed to parse local storage preferences", e);
    }

    // If user is authenticated, fetch DB preferences
    if (user?.id) {
      fetch("/api/user/preferences")
        .then((res) => res.ok && res.json())
        .then((data) => {
          if (data && data.success && data.preferences) {
            const p = data.preferences;
            setCountryCodeState(p.countryCode);
            setRegionCodeState(p.regionCode);
            setCurrencyCodeState(p.currencyCode);
            setTimezoneState(p.timezone);
            setLocaleState(p.locale);
            setIsCustomCurrency(Boolean(p.isCustomCurrency));
          }
        })
        .catch((err) => console.error("[LOCALIZATION] Failed DB preference sync", err));
    }
  }, [user?.id]);

  // Persist preferences changes locally and to backend if logged in
  const persistPreferences = useCallback(
    (newPrefs: {
      countryCode: string;
      regionCode: string;
      currencyCode: CurrencyCode;
      timezone: string;
      locale: string;
      isCustomCurrency: boolean;
    }) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
      } catch (e) {}

      if (user?.id) {
        fetch("/api/user/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPrefs),
        }).catch(() => {});
      }
    },
    [user?.id]
  );

  // Handlers
  const handleSetCountry = useCallback(
    (code: string) => {
      const meta = getCountryMetadata(code);
      const newCountryCode = meta.code;
      const newRegionCode = meta.regions[0]?.code || "";
      const newTimezone = meta.defaultTimezone;
      const newLocale = meta.defaultLocale;
      // If user hasn't manually locked a custom currency, align currency to country's default
      const newCurrency = isCustomCurrency ? currencyCode : meta.defaultCurrency;

      setCountryCodeState(newCountryCode);
      setRegionCodeState(newRegionCode);
      setTimezoneState(newTimezone);
      setLocaleState(newLocale);
      if (!isCustomCurrency) {
        setCurrencyCodeState(newCurrency);
      }

      persistPreferences({
        countryCode: newCountryCode,
        regionCode: newRegionCode,
        currencyCode: newCurrency,
        timezone: newTimezone,
        locale: newLocale,
        isCustomCurrency,
      });
    },
    [currencyCode, isCustomCurrency, persistPreferences]
  );

  const handleSetRegion = useCallback(
    (code: string) => {
      setRegionCodeState(code);
      persistPreferences({
        countryCode,
        regionCode: code,
        currencyCode,
        timezone,
        locale,
        isCustomCurrency,
      });
    },
    [countryCode, currencyCode, isCustomCurrency, locale, persistPreferences, timezone]
  );

  const handleSetCurrency = useCallback(
    (code: CurrencyCode) => {
      const meta = getCurrencyMetadata(code);
      setCurrencyCodeState(meta.code);
      setIsCustomCurrency(true);
      persistPreferences({
        countryCode,
        regionCode,
        currencyCode: meta.code,
        timezone,
        locale,
        isCustomCurrency: true,
      });
    },
    [countryCode, locale, persistPreferences, regionCode, timezone]
  );

  const handleSetTimezone = useCallback(
    (tz: string) => {
      setTimezoneState(tz);
      persistPreferences({
        countryCode,
        regionCode,
        currencyCode,
        timezone: tz,
        locale,
        isCustomCurrency,
      });
    },
    [countryCode, currencyCode, isCustomCurrency, locale, persistPreferences, regionCode]
  );

  const handleSetLocale = useCallback(
    (loc: string) => {
      setLocaleState(loc);
      persistPreferences({
        countryCode,
        regionCode,
        currencyCode,
        timezone,
        locale: loc,
        isCustomCurrency,
      });
    },
    [countryCode, currencyCode, isCustomCurrency, persistPreferences, regionCode, timezone]
  );

  // Browser Geolocation Detection Workflow: Detect -> Suggest -> Confirm -> Apply
  const detectCurrentLocation = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Basic deterministic heuristic mapping for demo/detection suggestion
        // If latitude near Nigeria (lat 4-14, lng 2-14), suggest Nigeria
        let suggested: DetectedLocationProposal = {
          countryCode: "US",
          countryName: "United States",
          currencyCode: "USD",
          timezone: "America/New_York",
        };

        if (latitude >= 4 && latitude <= 14 && longitude >= 2 && longitude <= 15) {
          suggested = {
            countryCode: "NG",
            countryName: "Nigeria",
            regionCode: "LA",
            regionName: "Lagos",
            currencyCode: "NGN",
            timezone: "Africa/Lagos",
          };
        } else if (latitude >= 50 && latitude <= 60 && longitude >= -10 && longitude <= 2) {
          suggested = {
            countryCode: "GB",
            countryName: "United Kingdom",
            currencyCode: "GBP",
            timezone: "Europe/London",
          };
        }

        setDetectedLocation(suggested);
      },
      (err) => {
        console.warn("[GEOLOCATION] User denied or geolocation unavailable", err);
      }
    );
  }, []);

  const confirmDetectedLocation = useCallback(() => {
    if (!detectedLocation) return;
    handleSetCountry(detectedLocation.countryCode);
    if (detectedLocation.regionCode) handleSetRegion(detectedLocation.regionCode);
    if (detectedLocation.currencyCode) handleSetCurrency(detectedLocation.currencyCode);
    if (detectedLocation.timezone) handleSetTimezone(detectedLocation.timezone);
    setDetectedLocation(null);
  }, [detectedLocation, handleSetCountry, handleSetCurrency, handleSetRegion, handleSetTimezone]);

  const dismissDetectedLocation = useCallback(() => {
    setDetectedLocation(null);
  }, []);

  // Formatters tied to active state
  const formatCurrency = useCallback(
    (amountNGN: number | string | null | undefined, options: FormatCurrencyOptions = {}) => {
      return i18nFormatCurrency(amountNGN, {
        currency: options.currency || currencyCode,
        locale: options.locale || locale,
        fxRates,
        ...options,
      });
    },
    [currencyCode, fxRates, locale]
  );

  const formatDate = useCallback(
    (date: Date | string | null | undefined, options: FormatDateOptions = {}) => {
      return i18nFormatDate(date, {
        locale: options.locale || locale,
        timezone: options.timezone || timezone,
        ...options,
      });
    },
    [locale, timezone]
  );

  const formatDateTime = useCallback(
    (date: Date | string | null | undefined, options: FormatDateOptions = {}) => {
      return i18nFormatDateTime(date, {
        locale: options.locale || locale,
        timezone: options.timezone || timezone,
        ...options,
      });
    },
    [locale, timezone]
  );

  const convertFromNGN = useCallback(
    (amountNGN: number) => {
      return fxConvertFromNGN(amountNGN, currencyCode, fxRates);
    },
    [currencyCode, fxRates]
  );

  const country = getCountryMetadata(countryCode);
  const currency = getCurrencyMetadata(currencyCode);
  const activeRegion = country.regions.find((r) => r.code === regionCode);
  const regionName = activeRegion ? activeRegion.name : regionCode;

  return (
    <LocalizationContext.Provider
      value={{
        countryCode,
        country,
        regionCode,
        regionName,
        currencyCode,
        currency,
        timezone,
        locale,
        isCustomCurrency,
        fxRates,
        fxLoading,
        fxError,
        detectedLocation,

        setCountry: handleSetCountry,
        setRegion: handleSetRegion,
        setCurrency: handleSetCurrency,
        setTimezone: handleSetTimezone,
        setLocale: handleSetLocale,
        detectCurrentLocation,
        confirmDetectedLocation,
        dismissDetectedLocation,

        formatCurrency,
        formatDate,
        formatDateTime,
        convertFromNGN,
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization(): LocalizationContextType {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error("useLocalization must be used within a LocalizationProvider");
  }
  return context;
}
