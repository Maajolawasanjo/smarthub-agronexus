"use client";

import { useEffect, useState, useCallback } from "react";
import { DollarSign, ShieldAlert, Clock, Lock, RefreshCw, AlertTriangle, ArrowDownLeft, ArrowUpRight, Wallet, TrendingUp, Users, CheckCircle2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinanceData {
  overview: {
    totalBalanceFloat: number;
    formattedTotalBalanceFloat: string;
    totalEscrowHoldings: number;
    formattedTotalEscrowHoldings: string;
    totalPendingWithdrawals: number;
    formattedTotalPendingWithdrawals: string;
    totalFrozenDisputeFunds: number;
    formattedTotalFrozenDisputeFunds: string;
    totalPlatformRevenue: number;
    formattedTotalPlatformRevenue: string;
    totalDeposits: number;
    formattedTotalDeposits: string;
    totalCompletedWithdrawals: number;
    formattedTotalCompletedWithdrawals: string;
    totalWalletsCount: number;
  };
  recentTransactions: Array<{
    id: string;
    reference: string;
    type: string;
    amount: number;
    formattedAmount: string;
    status: string;
    description: string;
    userName: string;
    userEmail: string;
    userRole: string;
    date: string;
  }>;
  userWallets: Array<{
    walletId: string;
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    balance: number;
    formattedBalance: string;
    escrow: number;
    formattedEscrow: string;
    pendingWithdrawal: number;
    formattedPendingWithdrawal: string;
    frozen: number;
    formattedFrozen: string;
  }>;
}

interface ReconciliationReport {
  timestamp: string;
  status: "HEALTHY" | "DISCREPANCY_DETECTED";
  summary: {
    totalWalletsAudited: number;
    discrepanciesCount: number;
  };
  checks: {
    zeroDriftCheck: { passed: boolean; details: string };
    escrowCheck: { passed: boolean; details: string };
    pendingWithdrawalCheck: { passed: boolean; details: string };
    flutterwaveSyncCheck: { passed: boolean; details: string; reconciledTransfers: number };
    revenueCheck: { passed: boolean; details: string };
  };
  discrepancies: Array<{
    category: string;
    entityId: string;
    description: string;
    expected: number;
    actual: number;
    drift: number;
  }>;
}

export default function AdminFinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"transactions" | "wallets" | "withdrawals">("transactions");
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const [reconciling, setReconciling] = useState(false);
  const [reconcileReport, setReconcileReport] = useState<ReconciliationReport | null>(null);

  const fetchWithdrawals = useCallback(async () => {
    setWithdrawalsLoading(true);
    try {
      const res = await fetch("/api/admin/withdrawals");
      const json = await res.json();
      if (res.ok && json.success) {
        setWithdrawals(json.data.withdrawals || []);
      }
    } catch (e) {
      console.error("Failed to load withdrawals", e);
    } finally {
      setWithdrawalsLoading(false);
    }
  }, []);

  const handleWithdrawalAction = async (transactionId: string, action: "APPROVE_PAYOUT" | "RETRY_PAYOUT" | "REVERSE_PAYOUT") => {
    setActionLoadingId(transactionId);
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, action }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        triggerToast(json.data.message || `Action ${action} succeeded.`);
        await fetchWithdrawals();
        await fetchFinanceData();
      } else {
        triggerToast(`Action failed: ${json.error?.message || json.error || "Server error"}`);
      }
    } catch (e) {
      triggerToast("Network error executing withdrawal action.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const fetchFinanceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/finance");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to load financial ledger data.");
      }
      setData(json.data);
    } catch (err: any) {
      console.error("Admin finance fetch error:", err);
      setError(err.message || "Failed to connect to financial ledger.");
    } finally {
      setLoading(false);
    }
  }, []);

  const runReconciliation = async () => {
    setReconciling(true);
    try {
      const res = await fetch("/api/jobs/reconcile", { method: "POST" });
      const json = await res.json();
      if (res.ok && json.success) {
        setReconcileReport(json.data);
        fetchFinanceData(); // refresh overview data
      }
    } catch (e) {
      console.error("Failed to run reconciliation job", e);
    } finally {
      setReconciling(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  if (error) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-red-100 p-8 shadow-sm font-sans">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-base font-bold text-gray-800 mb-1">Financial Audit Feed Offline</h3>
        <p className="text-xs text-gray-500 max-w-md mb-6">{error}</p>
        <button
          onClick={fetchFinanceData}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1B4D28] text-white text-xs font-semibold rounded-full hover:bg-[#143d20] transition-colors cursor-pointer"
        >
          <RefreshCw size={14} /> Retry Ledger Query
        </button>
      </div>
    );
  }

  const overview = data?.overview;
  const recentTransactions = data?.recentTransactions || [];
  const userWallets = data?.userWallets || [];

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#1B4D28] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0A3918] text-white rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl shadow-green-950/20">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-green-300">
            FINANCIAL INTEGRITY CONTROL CENTER
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
            Platform Treasury & Ledger Audit
          </h1>
          <p className="text-xs text-green-200/80 font-serif italic mt-0.5">
            Authoritative double-entry aggregations across all user balances & Flutterwave gateway settlements
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runReconciliation}
            disabled={reconciling}
            className="px-4 py-2.5 rounded-full text-xs font-bold bg-white text-[#1B4D28] hover:bg-green-50 shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck size={15} /> {reconciling ? "Reconciling..." : "Run Reconciliation Audit"}
          </button>
          <button
            onClick={fetchFinanceData}
            className="px-4 py-2.5 rounded-full text-xs font-bold font-mono bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Ledger
          </button>
        </div>
      </div>

      {/* Reconciliation Health Report Card (if executed) */}
      {reconcileReport && (
        <div className={cn(
          "p-6 rounded-[24px] border shadow-sm space-y-3 font-sans animate-fadeIn",
          reconcileReport.status === "HEALTHY"
            ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
            : "bg-rose-50/80 border-rose-200 text-rose-950"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {reconcileReport.status === "HEALTHY" ? (
                <CheckCircle2 className="text-emerald-600 shrink-0" size={20} />
              ) : (
                <AlertTriangle className="text-rose-600 shrink-0" size={20} />
              )}
              <h3 className="text-base font-bold">
                Automated Reconciliation Audit: {reconcileReport.status}
              </h3>
            </div>
            <span className="text-[11px] font-mono font-semibold opacity-70">
              {new Date(reconcileReport.timestamp).toLocaleTimeString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="bg-white/80 p-3 rounded-2xl border border-black/5">
              <p className="font-bold text-gray-500 text-[10px] uppercase">Zero-Drift Check</p>
              <p className="font-semibold mt-0.5">{reconcileReport.checks.zeroDriftCheck.details}</p>
            </div>
            <div className="bg-white/80 p-3 rounded-2xl border border-black/5">
              <p className="font-bold text-gray-500 text-[10px] uppercase">Escrow Holdings Check</p>
              <p className="font-semibold mt-0.5">{reconcileReport.checks.escrowCheck.details}</p>
            </div>
            <div className="bg-white/80 p-3 rounded-2xl border border-black/5">
              <p className="font-bold text-gray-500 text-[10px] uppercase">Gateway Status Sync</p>
              <p className="font-semibold mt-0.5">{reconcileReport.checks.flutterwaveSyncCheck.details}</p>
            </div>
          </div>
        </div>
      )}

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Platform Revenue */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Platform Revenue (2.5%)</span>
            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            {loading ? "₦••••" : overview?.formattedTotalPlatformRevenue || "₦0.00"}
          </h2>
          <p className="text-[11px] text-gray-400">Commission retained from completed escrows</p>
        </div>

        {/* Total Wallet Float */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Available Wallet Float</span>
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Wallet size={16} />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            {loading ? "₦••••" : overview?.formattedTotalBalanceFloat || "₦0.00"}
          </h2>
          <p className="text-[11px] text-gray-400">Liquid balances across {overview?.totalWalletsCount || 0} user wallets</p>
        </div>

        {/* Escrow Holdings */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Escrow Holdings</span>
            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Lock size={16} />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            {loading ? "₦••••" : overview?.formattedTotalEscrowHoldings || "₦0.00"}
          </h2>
          <p className="text-[11px] text-gray-400">Funds locked in active protected orders</p>
        </div>

        {/* Pending Withdrawals */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Pending Payouts</span>
            <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            {loading ? "₦••••" : overview?.formattedTotalPendingWithdrawals || "₦0.00"}
          </h2>
          <p className="text-[11px] text-gray-400">In-transit bank transfers awaiting FLW webhook</p>
        </div>

        {/* Frozen Dispute Funds */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Frozen Dispute Funds</span>
            <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
              <ShieldAlert size={16} />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            {loading ? "₦••••" : overview?.formattedTotalFrozenDisputeFunds || "₦0.00"}
          </h2>
          <p className="text-[11px] text-gray-400">Locked pending administrative arbitration</p>
        </div>
      </div>

      {/* Main Ledger Table Section */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
        {/* Table View Tabs */}
        <div className="px-6 pt-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab("transactions")}
              className={`pb-4 text-sm font-bold transition-colors relative cursor-pointer ${
                activeTab === "transactions" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              System Transactions Ledger
              {activeTab === "transactions" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#1B4D28] rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("wallets")}
              className={`pb-4 text-sm font-bold transition-colors relative cursor-pointer ${
                activeTab === "wallets" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              User Wallet Accounts ({userWallets.length})
              {activeTab === "wallets" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#1B4D28] rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("withdrawals")}
              className={`pb-4 text-sm font-bold transition-colors relative cursor-pointer ${
                activeTab === "withdrawals" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Withdrawal Payout Queue ({withdrawals.length})
              {activeTab === "withdrawals" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#1B4D28] rounded-full" />
              )}
            </button>
          </div>

          <span className="text-xs text-gray-400 font-mono hidden sm:block mb-4">
            PostgreSQL Double-Entry Auth
          </span>
        </div>

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div className="overflow-x-auto">
            {recentTransactions.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400">No transactions recorded.</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-gray-400">User / Account</th>
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-gray-400">Reference</th>
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-gray-400">Type</th>
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-gray-400">Description</th>
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-gray-400">Date</th>
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-gray-400">Status</th>
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-gray-400 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-gray-900">{t.userName}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{t.userEmail} • {t.userRole}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-gray-700">{t.reference}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-gray-100 text-gray-700">
                          {t.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-700 max-w-xs truncate">{t.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-400">{t.date}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            t.status === "SUCCESS"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : t.status === "PROCESSING" || t.status === "SUBMITTED_TO_FLUTTERWAVE" || t.status === "VALIDATED" || t.status === "PENDING"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          )}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-xs font-bold text-gray-900 font-mono">{t.formattedAmount}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* User Wallets Tab */}
        {activeTab === "wallets" && (
          <div className="overflow-x-auto">
            {userWallets.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400">No user wallets found.</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-gray-400">User</th>
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-gray-400">Role</th>
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-gray-400">Available Float</th>
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-gray-400">Escrow Locked</th>
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-gray-400">Pending Payout</th>
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-gray-400">Frozen Funds</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {userWallets.map((w) => (
                    <tr key={w.walletId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-gray-900">{w.userName}</p>
                        <p className="text-[10px] text-gray-400">{w.userEmail}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-50 text-[#1B4D28]">
                          {w.userRole}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-gray-900">{w.formattedBalance}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-amber-700">{w.formattedEscrow}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-purple-700">{w.formattedPendingWithdrawal}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-rose-700">{w.formattedFrozen}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Withdrawals Queue Tab */}
        {activeTab === "withdrawals" && (
          <div className="overflow-x-auto">
            {withdrawalsLoading ? (
              <div className="p-12 text-center text-xs text-gray-400">Loading withdrawal queue...</div>
            ) : withdrawals.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400">No withdrawal requests found.</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-gray-400">User / Role</th>
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-gray-400">Bank Destination</th>
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-gray-400">Reference</th>
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-gray-400">Status</th>
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-gray-400">Amount</th>
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-gray-900">{w.user?.name || "User"}</p>
                        <p className="text-[10px] text-gray-400">{w.user?.email} • {w.user?.role}</p>
                      </td>
                      <td className="px-6 py-4">
                        {w.bank ? (
                          <>
                            <p className="text-xs font-semibold text-gray-800">{w.bank.bankName}</p>
                            <p className="text-[10px] text-gray-500 font-mono">{w.bank.accountNumber} ({w.bank.accountName})</p>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No bank profile</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-gray-700">{w.reference}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            w.status === "SUCCESS"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : w.status === "PROCESSING" || w.status === "SUBMITTED_TO_FLUTTERWAVE" || w.status === "VALIDATED"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          )}
                        >
                          {w.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-gray-900">
                        {w.formattedAmount}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {["REQUESTED", "VALIDATED"].includes(w.status) && (
                            <>
                              <button
                                onClick={() => handleWithdrawalAction(w.id, "APPROVE_PAYOUT")}
                                disabled={actionLoadingId === w.id}
                                className="px-3 py-1 rounded-lg text-[11px] font-bold bg-[#1B4D28] text-white hover:bg-[#143d20] transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {actionLoadingId === w.id ? "Processing..." : "Approve & Payout"}
                              </button>
                              <button
                                onClick={() => handleWithdrawalAction(w.id, "REVERSE_PAYOUT")}
                                disabled={actionLoadingId === w.id}
                                className="px-3 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                Reverse
                              </button>
                            </>
                          )}
                          {w.status === "FAILED" && (
                            <>
                              <button
                                onClick={() => handleWithdrawalAction(w.id, "RETRY_PAYOUT")}
                                disabled={actionLoadingId === w.id}
                                className="px-3 py-1 rounded-lg text-[11px] font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {actionLoadingId === w.id ? "Processing..." : "Retry"}
                              </button>
                              <button
                                onClick={() => handleWithdrawalAction(w.id, "REVERSE_PAYOUT")}
                                disabled={actionLoadingId === w.id}
                                className="px-3 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                Reverse
                              </button>
                            </>
                          )}
                          {["PROCESSING", "SUBMITTED_TO_FLUTTERWAVE"].includes(w.status) && (
                            <span className="text-[11px] font-mono text-amber-700 italic">In Flight</span>
                          )}
                          {w.status === "SUCCESS" && (
                            <span className="text-[11px] font-bold text-emerald-700">Settled</span>
                          )}
                          {w.status === "REVERSED" && (
                            <span className="text-[11px] font-bold text-gray-400">Reversed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
