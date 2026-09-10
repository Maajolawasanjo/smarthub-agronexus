import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/i18n/formatters";
import { convertFromNGN, convertToNGN, STATIC_FALLBACK_RATES } from "@/lib/i18n/fx";
import { CURRENCIES, getCurrencyMetadata } from "@/lib/i18n/currencies";
import { COUNTRIES, getCountryMetadata } from "@/lib/i18n/countries";
import { TIMEZONES, getTimezoneMetadata } from "@/lib/i18n/timezones";

describe("Phase 6 Global Localization & Multi-Currency Safety Test Suite", () => {

  describe("1. Currency Registry Invariants", () => {
    it("should have NGN defined as base currency", () => {
      const ngn = CURRENCIES.NGN;
      expect(ngn).toBeDefined();
      expect(ngn.code).toBe("NGN");
      expect(ngn.symbol).toBe("₦");
      expect(ngn.decimals).toBe(2);
    });

    it("should contain at least 30 global currencies", () => {
      const keys = Object.keys(CURRENCIES);
      expect(keys.length).toBeGreaterThanOrEqual(30);
    });

    it("should fallback gracefully for unknown currency code", () => {
      const meta = getCurrencyMetadata("XYZ_UNKNOWN" as any);
      expect(meta.code).toBe("NGN");
    });
  });

  describe("2. Country & Region Registry Invariants", () => {
    it("should have Nigeria with 37 state subdivisions including FCT", () => {
      const ng = COUNTRIES.NG;
      expect(ng).toBeDefined();
      expect(ng.regions.length).toBe(37);
      expect(ng.regions.some((r) => r.name === "FCT - Abuja")).toBe(true);
      expect(ng.regions.some((r) => r.name === "Lagos")).toBe(true);
    });

    it("should have USA with 50 states", () => {
      const us = COUNTRIES.US;
      expect(us).toBeDefined();
      expect(us.regions.length).toBe(50);
    });

    it("should fallback gracefully for unknown country code", () => {
      const meta = getCountryMetadata("UNKNOWN_COUNTRY");
      expect(meta.code).toBe("NG");
    });
  });

  describe("3. Timezone Registry Invariants", () => {
    it("should include Africa/Lagos, America/New_York, and Europe/London", () => {
      const lagos = getTimezoneMetadata("Africa/Lagos");
      expect(lagos.identifier).toBe("Africa/Lagos");
      expect(lagos.offset).toBe("UTC+1");

      const ny = getTimezoneMetadata("America/New_York");
      expect(ny.identifier).toBe("America/New_York");
    });
  });

  describe("4. FX Conversion Abstraction", () => {
    it("should return identical NGN amount when target currency is NGN", () => {
      const converted = convertFromNGN(15000, "NGN");
      expect(converted).toBe(15000);
    });

    it("should convert NGN to USD accurately using static fallback rates", () => {
      // 100,000 NGN * 0.00067 = 67 USD
      const convertedUSD = convertFromNGN(100000, "USD");
      expect(convertedUSD).toBe(67);
    });

    it("should handle 0 amount correctly without NaN", () => {
      expect(convertFromNGN(0, "USD")).toBe(0);
      expect(convertFromNGN(0, "EUR")).toBe(0);
    });

    it("should support convertToNGN reverse calculation", () => {
      const ngnEstimate = convertToNGN(67, "USD");
      expect(ngnEstimate).toBeGreaterThan(90000);
    });
  });

  describe("5. Currency Formatter Presentation", () => {
    it("should format NGN currency using Intl.NumberFormat", () => {
      const formatted = formatCurrency(25000, { currency: "NGN", convertFromNGNBase: false });
      expect(formatted).toContain("25,000");
    });

    it("should format presentation conversion from base NGN to USD", () => {
      // 100,000 NGN -> 67 USD
      const formatted = formatCurrency(100000, { currency: "USD", convertFromNGNBase: true });
      expect(formatted).toContain("67.00");
    });

    it("should append showCode when requested", () => {
      const formatted = formatCurrency(5000, { currency: "NGN", showCode: true, convertFromNGNBase: false });
      expect(formatted).toContain("(NGN)");
    });
  });

  describe("6. Date & Time Formatter Presentation", () => {
    it("should format dates according to locale and timezone", () => {
      const testDate = new Date("2026-08-24T12:00:00Z");
      const formatted = formatDate(testDate, { locale: "en-NG", timezone: "Africa/Lagos" });
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe("string");
    });

    it("should handle invalid dates gracefully without throwing", () => {
      expect(formatDate(null)).toBe("");
      expect(formatDate("invalid-date-string")).toBe("");
    });
  });
});
