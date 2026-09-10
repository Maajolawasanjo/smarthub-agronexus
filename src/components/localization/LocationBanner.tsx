"use client";

import React from "react";
import { useLocalization } from "@/hooks/useLocalization";
import { Globe, Check, X } from "lucide-react";

export function LocationBanner() {
  const { detectedLocation, confirmDetectedLocation, dismissDetectedLocation } = useLocalization();

  if (!detectedLocation) return null;

  return (
    <div className="bg-emerald-950/90 text-white border-b border-emerald-700/50 backdrop-blur-md px-4 py-3 sm:px-6 shadow-lg transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-3 text-emerald-100">
          <Globe className="w-5 h-5 text-emerald-400 shrink-0 animate-pulse" />
          <span>
            We detected your location as{" "}
            <strong className="text-white font-semibold">
              {detectedLocation.countryName}
              {detectedLocation.regionName ? `, ${detectedLocation.regionName}` : ""}
            </strong>
            . Update your regional currency ({detectedLocation.currencyCode}) and timezone settings?
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={confirmDetectedLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-lg text-xs transition shadow-sm cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Apply Settings
          </button>
          <button
            onClick={dismissDetectedLocation}
            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
