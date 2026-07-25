"use client";

import { Wallet, ArrowUpRight, CreditCard, ReceiptText, ShieldCheck, AlertTriangle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export type WalletTabType =
  | "overview"
  | "transfer"
  | "accounts"
  | "transactions"
  | "escrow"
  | "disputes"
  | "statements";

interface WalletTabsProps {
  activeTab: WalletTabType;
  onTabChange: (tab: WalletTabType) => void;
}

export function WalletTabs({ activeTab, onTabChange }: WalletTabsProps) {
  const tabs = [
    { id: "overview" as const, label: "Overview", icon: Wallet },
    { id: "transfer" as const, label: "Transfer & Withdraw", icon: ArrowUpRight },
    { id: "accounts" as const, label: "Linked Accounts & Cards", icon: CreditCard },
    { id: "transactions" as const, label: "Transactions Audit", icon: ReceiptText },
    { id: "escrow" as const, label: "Escrow & Release", icon: ShieldCheck },
    { id: "disputes" as const, label: "Disputes & Claims", icon: AlertTriangle },
    { id: "statements" as const, label: "Tax & Statements", icon: FileText },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 font-sans no-scrollbar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
              isActive
                ? "bg-[#1B4D28] text-white shadow-md shadow-green-900/10"
                : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Icon size={14} className={isActive ? "text-white" : "text-gray-400"} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
