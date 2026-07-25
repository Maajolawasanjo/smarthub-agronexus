"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Eye,
  EyeOff,
  Wallet,
  RefreshCw,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  Clock,
  ShieldAlert,
  Download,
  Building2,
  Receipt,
  FileSpreadsheet,
  Layers,
  Search,
} from "lucide-react";
import { WalletPageDTO } from "@/types/wallet.dto";
import { FarmerWithdrawModal } from "@/components/farmer/wallet/FarmerWithdrawModal";
import { FarmerLinkedBanksSection } from "@/components/farmer/wallet/FarmerLinkedBanksSection";
import { cn } from "@/lib/utils";

type FarmerTabType =
  | "overview"
  | "transactions"
  | "withdrawals"
  | "banks"
  | "statements"
  | "settlements";

export default function FarmerWalletPage() {
  const [activeTab, setActiveTab] = useState<FarmerTabType>("overview");
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletData, setWalletData] = useState<WalletPageDTO | null>(null);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const fetchWalletData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/wallet");
      if (!res.ok) {
        if (res.status === 401) throw new Error("Session expired. Please log in.");
        throw new Error("Failed to fetch wallet financial ledger.");
      }
      const raw = await res.json();
      const data: WalletPageDTO = raw.data || raw;
      setWalletData(data);
    } catch (err: any) {
      console.error("Farmer wallet fetch error:", err);
      setError(err.message || "Failed to load wallet balance.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  if (error) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-red-100 p-8 shadow-sm">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-base font-bold text-gray-800 mb-1">Wallet Load Failed</h3>
        <p className="text-xs text-gray-500 max-w-md mb-6">{error}</p>
        <button
          onClick={fetchWalletData}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1B4D28] text-white text-xs font-semibold rounded-full hover:bg-[#143d20] transition-colors cursor-pointer"
        >
          <RefreshCw size={14} /> Retry Connection
        </button>
      </div>
    );
  }

  const balances = walletData?.balances;
  const transactions = walletData?.recentTransactions || [];
  const linkedBanks = walletData?.linkedBanks || [];

  // Filtered transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.reference.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.description.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesType =
      typeFilter === "ALL"
        ? true
        : typeFilter === "CREDITS"
        ? t.type === "DEPOSIT" || t.type === "ESCROW_RELEASE" || t.type === "REFUND"
        : typeFilter === "WITHDRAWALS"
        ? t.type === "WITHDRAWAL"
        : typeFilter === "ESCROW"
        ? t.type === "ESCROW_LOCK" || t.type === "ESCROW_RELEASE"
        : true;
    return matchesSearch && matchesType;
  });

  const withdrawalsList = transactions.filter((t) => t.type === "WITHDRAWAL");
  const settlementList = transactions.filter((t) => t.type === "ESCROW_RELEASE");

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: Wallet },
    { id: "transactions" as const, label: "Transactions", icon: Receipt },
    { id: "withdrawals" as const, label: "Payouts & Withdrawals", icon: ArrowUpRight },
    { id: "banks" as const, label: "Linked Bank Accounts", icon: Building2 },
    { id: "statements" as const, label: "Statements & Tax", icon: FileSpreadsheet },
    { id: "settlements" as const, label: "Settlement Breakdown", icon: Layers },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-12 font-sans space-y-6">
      {/* ── Main Balance Card ──────────────────────────────────────────────── */}
      <div className="relative bg-[#1B4D28] text-white rounded-[24px] p-6 md:p-10 shadow-xl shadow-green-950/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 border-[1px] border-white/5 rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-48 border-[1px] border-white/10 rounded-full -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-32 border-[1px] border-white/15 rounded-full -mr-12 -mt-12 pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-green-300">
                PRODUCER FINANCIAL LEDGER
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-500/20 text-green-200 border border-green-400/30">
                NGN AUTHORITATIVE
              </span>
            </div>

            <p className="text-xs text-green-100/80 mb-1">Available For Withdrawal</p>

            <div className="flex items-center gap-4">
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                {loading ? (
                  <span className="opacity-50 animate-pulse">₦••••••••</span>
                ) : isVisible ? (
                  balances?.formattedAvailableBalance || "₦0.00"
                ) : (
                  "••••••••"
                )}
              </h2>
              <button
                onClick={() => setIsVisible(!isVisible)}
                className="p-2 text-white/70 hover:text-white transition-colors focus:outline-none rounded-full hover:bg-white/10"
                aria-label={isVisible ? "Hide balance" : "Show balance"}
              >
                {isVisible ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsWithdrawModalOpen(true)}
            disabled={loading || (balances?.availableBalance || 0) <= 0}
            className="bg-white text-[#1B4D28] px-7 py-3.5 rounded-full text-xs md:text-sm font-bold shadow-lg hover:bg-green-50 active:scale-[0.98] transition-all flex items-center gap-2 self-start md:self-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wallet size={16} /> Request Withdrawal
          </button>
        </div>

        {/* 4 Ledger State Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/10 text-xs">
          <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
            <p className="text-[10px] text-green-200/80 flex items-center gap-1">
              <Lock size={12} /> Pending Settlement
            </p>
            <p className="text-sm font-bold mt-0.5">
              {isVisible ? balances?.formattedEscrowBalance || "₦0.00" : "••••"}
            </p>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
            <p className="text-[10px] text-green-200/80 flex items-center gap-1">
              <Clock size={12} /> In Transit (Pending)
            </p>
            <p className="text-sm font-bold mt-0.5">
              {isVisible ? balances?.formattedPendingWithdrawals || "₦0.00" : "••••"}
            </p>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
            <p className="text-[10px] text-green-200/80 flex items-center gap-1">
              <ShieldAlert size={12} /> Frozen / Dispute
            </p>
            <p className="text-sm font-bold mt-0.5">
              {isVisible ? balances?.formattedFrozenBalance || "₦0.00" : "••••"}
            </p>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
            <p className="text-[10px] text-green-200/80">Withdrawal Limit</p>
            <p className="text-sm font-bold mt-0.5">
              {walletData?.limits?.formattedRemainingLimit || "Uncapped"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Sub-Tabs Navigation ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 font-sans no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

      {/* ── Tab Views ──────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <FarmerLinkedBanksSection linkedBanks={linkedBanks} onRefresh={fetchWalletData} />

          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm md:text-base font-bold text-gray-900">
                  Recent Ledger Activity
                </h3>
                <p className="text-[11px] text-gray-400">
                  Authoritative double-entry ledger entries from PostgreSQL
                </p>
              </div>
              <button
                onClick={() => setActiveTab("transactions")}
                className="text-xs font-bold text-[#1B4D28] hover:underline"
              >
                View All →
              </button>
            </div>
            <TableRender list={transactions.slice(0, 5)} />
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Transactions Audit Ledger</h3>
              <p className="text-xs text-gray-400">Search and filter double-entry ledger logs</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reference..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-full text-xs focus:outline-none focus:border-[#1B4D28]"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-full text-xs focus:outline-none focus:border-[#1B4D28] text-gray-700"
              >
                <option value="ALL">All Types</option>
                <option value="CREDITS">Credits & Releases</option>
                <option value="WITHDRAWALS">Withdrawals</option>
                <option value="ESCROW">Escrow Operations</option>
              </select>
            </div>
          </div>
          <TableRender list={filteredTransactions} />
        </div>
      )}

      {activeTab === "withdrawals" && (
        <div className="space-y-6">
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Withdrawal Request Center</h3>
                <p className="text-xs text-gray-400">Direct NGN bank transfer payout portal</p>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(true)}
                disabled={(balances?.availableBalance || 0) <= 0}
                className="bg-[#1B4D28] text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-[#143d20] transition-colors disabled:opacity-50 cursor-pointer"
              >
                + New Withdrawal Request
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-xs text-gray-500 font-semibold">Available for Payout</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {balances?.formattedAvailableBalance || "₦0.00"}
                </p>
              </div>
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                <p className="text-xs text-amber-700 font-semibold">Processing (In Transit)</p>
                <p className="text-lg font-bold text-amber-900 mt-1">
                  {balances?.formattedPendingWithdrawals || "₦0.00"}
                </p>
              </div>
              <div className="p-4 bg-green-50/50 rounded-2xl border border-green-100">
                <p className="text-xs text-green-700 font-semibold">Daily Payout Limit</p>
                <p className="text-lg font-bold text-green-900 mt-1">
                  {walletData?.limits?.formattedRemainingLimit || "Uncapped"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
            <h4 className="text-sm font-bold text-gray-900">Payout History</h4>
            <TableRender list={withdrawalsList} />
          </div>
        </div>
      )}

      {activeTab === "banks" && (
        <FarmerLinkedBanksSection linkedBanks={linkedBanks} onRefresh={fetchWalletData} />
      )}

      {activeTab === "statements" && (
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Tax & Financial Statements</h3>
              <p className="text-xs text-gray-400">Download official financial records in NGN</p>
            </div>
            <button
              onClick={() => {
                const headers = ["Reference,Type,Amount,Status,Date\n"];
                const rows = transactions.map(
                  (t) => `"${t.reference}","${t.type}","${t.formattedAmount}","${t.status}","${t.date}"`
                );
                const blob = new Blob([headers.concat(rows).join("\n")], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `smart_hub_farmer_statement_${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1B4D28] text-white text-xs font-bold rounded-full hover:bg-[#143d20] transition-colors cursor-pointer"
            >
              <Download size={14} /> Export CSV Statement
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 border border-gray-100 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Monthly Ledger Reconciliation
              </h4>
              <p className="text-xs text-gray-500">
                Authoritative double-entry ledger summaries formatted for tax filing and audit compliance.
              </p>
              <div className="pt-2">
                <span className="text-[10px] bg-green-50 text-green-700 font-bold px-2.5 py-1 rounded-full">
                  Verified NGN Settlement
                </span>
              </div>
            </div>

            <div className="p-5 border border-gray-100 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Annual Earnings Certificate
              </h4>
              <p className="text-xs text-gray-500">
                Official certificate summarizing gross sales, escrow releases, and net payout earnings.
              </p>
              <div className="pt-2">
                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-full">
                  PostgreSQL Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "settlements" && (
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Order Escrow Settlement Breakdown</h3>
              <p className="text-xs text-gray-400">
                Itemized releases from escrow into available producer balance
              </p>
            </div>
          </div>
          <TableRender list={settlementList} />
        </div>
      )}

      {/* ── Withdrawal Modal ──────────────────────────────────────────────── */}
      {balances && (
        <FarmerWithdrawModal
          isOpen={isWithdrawModalOpen}
          onClose={() => setIsWithdrawModalOpen(false)}
          availableBalance={balances.availableBalance}
          formattedAvailableBalance={balances.formattedAvailableBalance}
          linkedBanks={linkedBanks}
          onSuccess={fetchWalletData}
        />
      )}
    </div>
  );
}

// Helper table component
function TableRender({ list }: { list: any[] }) {
  if (list.length === 0) {
    return (
      <div className="p-12 text-center text-xs text-gray-400">
        No ledger transactions found matching criteria.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-gray-50/50 border-b border-gray-100">
            <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-gray-400">Reference</th>
            <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-gray-400">Description</th>
            <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-gray-400">Date</th>
            <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-gray-400">Status</th>
            <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-gray-400 text-right">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {list.map((t) => {
            const isCredit =
              t.type === "DEPOSIT" || t.type === "ESCROW_RELEASE" || t.type === "REFUND";
            return (
              <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-mono text-xs font-bold text-gray-700">{t.reference}</span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs font-semibold text-gray-800">{t.description}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs text-gray-400 font-medium">{t.date}</p>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      t.status === "SUCCESS"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : t.status === "PENDING"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    )}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <p
                    className={cn(
                      "text-xs font-bold flex items-center justify-end gap-1",
                      isCredit ? "text-green-600" : "text-gray-900"
                    )}
                  >
                    {isCredit ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                    {t.formattedAmount}
                  </p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
