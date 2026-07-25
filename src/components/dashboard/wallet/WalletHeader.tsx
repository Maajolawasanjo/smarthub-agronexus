"use client";

import { Search, Bell } from "lucide-react";
import Image from "next/image";
import { useUser } from "@/context/UserContext";

interface WalletHeaderProps {
  activeTab: string;
  onSearchChange?: (term: string) => void;
}

export function WalletHeader({ activeTab, onSearchChange }: WalletHeaderProps) {
  const { user } = useUser();

  const getTitle = () => {
    switch (activeTab) {
      case "transfer":
        return "Transfer Funds";
      case "accounts":
        return "Linked Accounts & Cards";
      case "transactions":
        return "Transaction Audit & History";
      case "escrow":
        return "Escrow & Milestone Release";
      case "disputes":
        return "Payment Disputes & Claims";
      case "statements":
        return "Tax & Financial Statements";
      default:
        return "Wallet";
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{getTitle()}</h1>
        <p className="text-xs text-gray-500 font-medium">Manage your agricultural supply chain funds & escrow balances</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 md:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search transactions..."
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200/80 rounded-full text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#1B4D28] transition-all"
          />
        </div>

        {/* Notification Bell */}
        <button
          className="relative p-2.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-gray-800 leading-tight">
              {user?.fullName || user?.name || "Nathan Ma'ajo"}
            </p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              {user?.role || "Buyer"}
            </p>
          </div>
          <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-green-700/20 bg-gray-100 flex-shrink-0">
            <Image
              src={user?.profileImage || "/avatar-2.png"}
              alt="User Avatar"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
