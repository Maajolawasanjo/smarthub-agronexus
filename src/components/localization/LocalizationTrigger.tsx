"use client";

import React, { useState } from "react";
import { useLocalization } from "@/hooks/useLocalization";
import { LocalizationModal } from "./LocalizationModal";
import { Globe, ChevronDown } from "lucide-react";

export function LocalizationTrigger({ className }: { className?: string }) {
  const { country, currencyCode, currency } = useLocalization();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={
          className ||
          "flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full text-xs font-bold transition border border-gray-200 shadow-2xs cursor-pointer"
        }
        title="Change Country, Currency & Timezone"
      >
        <span className="text-base leading-none">{country.flag}</span>
        <span className="font-extrabold text-gray-900">{currencyCode}</span>
        <span className="text-gray-500 font-medium">({currency.symbol})</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
      </button>

      <LocalizationModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
