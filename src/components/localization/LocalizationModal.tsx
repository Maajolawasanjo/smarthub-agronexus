"use client";

import React, { useState } from "react";
import { useLocalization } from "@/hooks/useLocalization";
import { COUNTRY_LIST } from "@/lib/i18n/countries";
import { CURRENCY_LIST, POPULAR_CURRENCIES } from "@/lib/i18n/currencies";
import { TIMEZONES } from "@/lib/i18n/timezones";
import { LOCALES } from "@/lib/i18n/locales";
import { CurrencyCode } from "@/lib/i18n/types";
import { X, Globe, DollarSign, Clock, MapPin, Navigation, Search, Check } from "lucide-react";

interface LocalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LocalizationModal({ isOpen, onClose }: LocalizationModalProps) {
  const {
    countryCode,
    country,
    regionCode,
    currencyCode,
    currency,
    timezone,
    locale,
    setCountry,
    setRegion,
    setCurrency,
    setTimezone,
    setLocale,
    detectCurrentLocation,
  } = useLocalization();

  const [activeTab, setActiveTab] = useState<"location" | "currency" | "time" | "locale">("location");
  const [currencySearch, setCurrencySearch] = useState("");
  const [detecting, setDetecting] = useState(false);

  if (!isOpen) return null;

  const filteredCurrencies = CURRENCY_LIST.filter(
    (c) =>
      c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.symbol.includes(currencySearch)
  );

  const handleLocationDetect = async () => {
    setDetecting(true);
    await detectCurrentLocation();
    setDetecting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-900 to-emerald-800 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-700/50 rounded-xl">
              <Globe className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Regional & Localization Preferences</h2>
              <p className="text-xs text-emerald-200">
                Customize your Country, Currency, Timezone & Display Formatting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-emerald-100 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/80 px-6 gap-2">
          <button
            onClick={() => setActiveTab("location")}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === "location"
                ? "border-emerald-600 text-emerald-700 bg-white shadow-xs rounded-t-lg"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <MapPin className="w-4 h-4" />
            Location & Region
          </button>
          <button
            onClick={() => setActiveTab("currency")}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === "currency"
                ? "border-emerald-600 text-emerald-700 bg-white shadow-xs rounded-t-lg"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Display Currency ({currencyCode})
          </button>
          <button
            onClick={() => setActiveTab("time")}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === "time"
                ? "border-emerald-600 text-emerald-700 bg-white shadow-xs rounded-t-lg"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Clock className="w-4 h-4" />
            Timezone
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: Location & Region */}
          {activeTab === "location" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{country.flag}</span>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">
                      {country.name} ({country.code})
                    </h3>
                    <p className="text-xs text-gray-500">
                      Default Currency: {country.defaultCurrency} | Timezone: {country.defaultTimezone}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLocationDetect}
                  disabled={detecting}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  {detecting ? "Detecting..." : "Detect My Location"}
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Country</label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {COUNTRY_LIST.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  State / Region / Province
                </label>
                <select
                  value={regionCode}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {country.regions.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* TAB 2: Display Currency */}
          {activeTab === "currency" && (
            <div className="space-y-5">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <strong>Financial Note:</strong> All order totals, wallet balances, and settlements remain anchored strictly to <strong>NGN (₦)</strong> in our financial ledger. Selecting a different currency converts display prices for your viewing convenience.
              </div>

              {/* Popular Currencies Quick Select */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Popular Currencies
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {POPULAR_CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => setCurrency(c.code)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                        currencyCode === c.code
                          ? "border-emerald-600 bg-emerald-50/80 text-emerald-900 shadow-xs"
                          : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{c.flag}</span>
                        <div>
                          <p className="text-xs font-bold">{c.code}</p>
                          <p className="text-[10px] text-gray-500 truncate">{c.symbol}</p>
                        </div>
                      </div>
                      {currencyCode === c.code && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search All Currencies */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  All Global Currencies
                </label>
                <div className="relative mb-3">
                  <Search className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search currency code or country name..."
                    value={currencySearch}
                    onChange={(e) => setCurrencySearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1 pr-1 border border-gray-100 rounded-xl">
                  {filteredCurrencies.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => setCurrency(c.code)}
                      className={`w-full px-4 py-2.5 text-left flex items-center justify-between text-xs transition cursor-pointer ${
                        currencyCode === c.code
                          ? "bg-emerald-50 text-emerald-900 font-bold"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{c.flag}</span>
                        <span>
                          <strong>{c.code}</strong> — {c.name} ({c.symbol})
                        </span>
                      </div>
                      {currencyCode === c.code && <Check className="w-4 h-4 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Timezone */}
          {activeTab === "time" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">IANA Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {TIMEZONES.map((t) => (
                    <option key={t.identifier} value={t.identifier}>
                      [{t.offset}] {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Locale & Formatting Standard</label>
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {LOCALES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name} ({l.nativeName})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-xs cursor-pointer"
          >
            Save & Done
          </button>
        </div>
      </div>
    </div>
  );
}
