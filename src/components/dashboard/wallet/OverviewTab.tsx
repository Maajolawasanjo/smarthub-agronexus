"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, PlusCircle, ArrowUpRight, ChevronRight, ShieldCheck, Clock, Layers } from "lucide-react";
import { ReceiptModal, TransactionReceiptData } from "./ReceiptModal";
import { WalletPageDTO, WalletTransactionDTO } from "@/types/wallet.dto";

interface OverviewTabProps {
  onOpenAddFund: () => void;
  onNavigateTab: (tab: "transfer" | "accounts" | "transactions") => void;
}

export function OverviewTab({ onOpenAddFund, onNavigateTab }: OverviewTabProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<TransactionReceiptData | null>(null);
  const [walletPage, setWalletPage] = useState<WalletPageDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWallet() {
      try {
        const res = await fetch("/api/wallet");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setWalletPage(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to load wallet API", err);
      } finally {
        setLoading(false);
      }
    }
    fetchWallet();
  }, []);

  const formattedBalance = walletPage?.balances?.formattedAvailableBalance || "₦0.00";
  const formattedEscrow = walletPage?.balances?.formattedEscrowBalance || "₦0.00";
  const formattedFrozen = walletPage?.balances?.formattedFrozenBalance || "₦0.00";
  const formattedPending = walletPage?.balances?.formattedPendingWithdrawals || "₦0.00";

  const transactions = walletPage?.recentTransactions || [];

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner & Currency Accounts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Total Available Balance Banner */}
        <div className="lg:col-span-2 bg-[#0A3918] text-white rounded-[24px] p-6 md:p-8 flex flex-col justify-between relative overflow-hidden shadow-xl shadow-green-950/20 min-h-[220px]">
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-widest text-green-300 font-bold">
                TOTAL AVAILABLE BALANCE (NGN)
              </span>
              <span className="text-xs text-green-400 font-medium italic">+2.4% harvest growth</span>
            </div>

            <div className="flex items-center gap-4">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight font-mono">
                {isVisible ? formattedBalance : "••••••••"}
              </h2>
              <button
                onClick={() => setIsVisible(!isVisible)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                title={isVisible ? "Hide balance" : "Show balance"}
              >
                {isVisible ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>

            <div className="flex items-center gap-6 text-xs text-green-200/90 pt-1 flex-wrap">
              <div>
                <span className="text-[10px] font-mono text-green-400 block uppercase">Escrow Locked</span>
                <span className="font-mono font-bold">{isVisible ? formattedEscrow : "••••••"}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-amber-300 block uppercase">Pending Withdrawal</span>
                <span className="font-mono font-bold text-amber-200">{isVisible ? formattedPending : "••••••"}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-green-400 block uppercase">Dispute Frozen</span>
                <span className="font-mono font-bold">{isVisible ? formattedFrozen : "••••••"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-6 relative z-10">
            <button
              onClick={onOpenAddFund}
              className="bg-[#34A853] hover:bg-[#2e964a] text-white px-6 py-3 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-green-950/40"
            >
              <PlusCircle size={16} /> Fund Wallet
            </button>

            <button
              onClick={() => onNavigateTab("transfer")}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <ArrowUpRight size={16} /> Withdraw
            </button>
          </div>
        </div>

        {/* Currency & Account Balances Card */}
        <div className="bg-white rounded-[24px] border border-gray-100 p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
              COMMERCIAL WALLET
            </span>
            <button
              onClick={() => onNavigateTab("accounts")}
              className="text-[11px] font-bold text-[#1B4D28] hover:underline cursor-pointer"
            >
              Manage
            </button>
          </div>

          <div className="space-y-3">
            {/* Primary NGN Wallet */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-green-200 bg-green-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#1B4D28] text-white text-xs font-mono font-extrabold flex items-center justify-center">
                  NGN
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Nigerian Naira (Primary)</p>
                  <p className="text-sm font-mono font-bold text-gray-900">{formattedBalance}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-[#1B4D28]" />
            </div>

            {/* Escrow Balance Item */}
            <div className="flex items-center justify-between p-3 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono font-extrabold flex items-center justify-center">
                  ESC
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold">Active Escrow Hold</p>
                  <p className="text-xs font-mono font-bold text-gray-800">{formattedEscrow}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Network Trust & Limits Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-[24px] border border-gray-100 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-[#1B4D28]" />
              <h3 className="text-sm font-bold text-gray-800">Linked Bank Accounts</h3>
            </div>
            <button
              onClick={() => onNavigateTab("accounts")}
              className="text-xs font-bold text-[#1B4D28] hover:underline cursor-pointer"
            >
              + Manage Accounts
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {walletPage?.linkedBanks && walletPage.linkedBanks.length > 0 ? (
              walletPage.linkedBanks.slice(0, 2).map((bank) => (
                <div key={bank.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-1">
                  <p className="text-xs font-bold text-gray-800">{bank.bankName}</p>
                  <p className="text-[11px] font-mono text-gray-500">
                    {bank.accountName} •••• {bank.accountNumber.slice(-4)}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/30 text-xs text-gray-500 col-span-2">
                No bank accounts linked yet. Click "Manage Accounts" to link your NGN account.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-dashed border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-mono">
            <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-green-600" /> SSL SECURED</span>
            <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-green-600" /> PCI COMPLIANT</span>
            <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-green-600" /> FRAUD PROTECTION</span>
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-gray-100 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">Verification Tier</h3>
            <span className="text-[10px] font-mono font-bold bg-green-100 text-green-800 px-2.5 py-1 rounded-full">
              {walletPage?.limits?.tier || "TIER 1"}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Monthly Limit</span>
              <span className="font-mono font-bold text-gray-800">
                {walletPage?.limits?.formattedMonthlyLimit || "₦50,000.00"}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className="bg-[#1B4D28] h-full rounded-full w-[15%]" />
            </div>
            <p className="text-[10px] text-gray-400 italic">
              Remaining: {walletPage?.limits?.formattedRemainingLimit || "₦50,000.00"}
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-50 text-[#1B4D28] flex items-center justify-center flex-shrink-0">
              <Clock size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">24/7 Agro-Support</p>
              <p className="text-[10px] text-gray-400">Average response: 2 mins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-[24px] border border-gray-100 p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800">Recent Ledger Transactions</h3>
          <button
            onClick={() => onNavigateTab("transactions")}
            className="text-xs font-bold text-[#1B4D28] hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="overflow-x-auto">
          {transactions.length > 0 ? (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase font-mono text-[10px] tracking-wider">
                  <th className="py-3 px-2">DESCRIPTION</th>
                  <th className="py-3 px-2">REFERENCE</th>
                  <th className="py-3 px-2">DATE</th>
                  <th className="py-3 px-2">STATUS</th>
                  <th className="py-3 px-2 text-right">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((tx: WalletTransactionDTO) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedReceipt({
                      description: tx.description,
                      date: tx.date,
                      status: tx.status,
                      amount: tx.formattedAmount,
                      type: tx.type === "DEPOSIT" || tx.type === "REFUND" || tx.type === "ESCROW_RELEASE" ? "credit" : "debit",
                      transactionId: tx.reference,
                      method: tx.method,
                      payer: "SmartHub Agro System",
                      subtotal: tx.formattedAmount,
                      vat: "₦0.00",
                      fee: "₦0.00",
                      logistics: "₦0.00",
                      total: tx.formattedAmount,
                    })}
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-2 font-bold text-gray-800 flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          tx.type === "DEPOSIT" || tx.type === "REFUND" || tx.type === "ESCROW_RELEASE"
                            ? "bg-green-100 text-green-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {tx.type === "DEPOSIT" || tx.type === "REFUND" || tx.type === "ESCROW_RELEASE" ? "↓" : "↑"}
                      </div>
                      {tx.description}
                    </td>
                    <td className="py-4 px-2 font-mono text-gray-500 text-[11px]">{tx.reference}</td>
                    <td className="py-4 px-2 font-mono text-gray-500">{tx.date}</td>
                    <td className="py-4 px-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                          tx.status === "SUCCESS"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td
                      className={`py-4 px-2 text-right font-mono font-bold ${
                        tx.type === "DEPOSIT" || tx.type === "REFUND" || tx.type === "ESCROW_RELEASE" ? "text-green-700" : "text-rose-600"
                      }`}
                    >
                      {tx.formattedAmount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-xs text-gray-500">
              No transactions recorded yet in your wallet ledger.
            </div>
          )}
        </div>
      </div>

      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        data={selectedReceipt || undefined}
      />
    </div>
  );
}
