"use client";

import { useState, useEffect } from "react";
import { Search, Download, FileText, ArrowDownLeft, ArrowUpRight, RotateCcw } from "lucide-react";
import { ReceiptModal, TransactionReceiptData } from "./ReceiptModal";
import { useToast } from "@/components/ui/Toast";
import { WalletPageDTO, WalletTransactionDTO } from "@/types/wallet.dto";

export function TransactionsTab() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedReceipt, setSelectedReceipt] = useState<TransactionReceiptData | null>(null);
  const [walletData, setWalletData] = useState<WalletPageDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await fetch("/api/wallet");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setWalletData(json.data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch wallet transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const transactions = walletData?.recentTransactions || [];

  const filtered = transactions.filter((t) => {
    const matchSearch =
      (t.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.reference || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.id || "").toLowerCase().includes(searchTerm.toLowerCase());

    const isCredit = t.type === "DEPOSIT" || t.type === "REFUND" || t.type === "ESCROW_RELEASE";
    const matchType =
      typeFilter === "ALL" ||
      (typeFilter === "credit" && isCredit) ||
      (typeFilter === "debit" && !isCredit);

    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;

    return matchSearch && matchType && matchStatus;
  });

  const handleExportCSV = () => {
    window.open("/api/admin/ledger/export?format=csv", "_blank");
    toast("Downloading CSV audit report from PostgreSQL...", "success");
  };

  const handleExportPDF = () => {
    window.open("/api/admin/ledger/export?format=pdf", "_blank");
    toast("Downloading PDF audit report from PostgreSQL...", "success");
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transactions Audit</h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Monitor and export your live agro-supply financial history in NGN.
          </p>
        </div>

        <button
          onClick={handleExportPDF}
          className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
        >
          <Download size={14} /> Export Audit Report
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[24px] border border-gray-100 p-6 space-y-2 shadow-sm">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
            TOTAL AVAILABLE BALANCE
          </p>
          <h3 className="text-3xl font-extrabold font-mono text-gray-900 tracking-tight">
            {walletData?.balances?.formattedAvailableBalance || "₦0.00"}
          </h3>
          <p className="text-xs text-green-600 font-mono font-semibold">Live Single Source of Truth</p>
        </div>

        <div className="bg-white rounded-[24px] border border-gray-100 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">TOTAL DEPOSITED</p>
            <h3 className="text-2xl font-extrabold font-mono text-gray-900 tracking-tight">
              {walletData?.summary?.formattedTotalDeposits || "₦0.00"}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
            <ArrowDownLeft size={24} />
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-gray-100 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">TOTAL WITHDRAWN</p>
            <h3 className="text-2xl font-extrabold font-mono text-gray-900 tracking-tight">
              {walletData?.summary?.formattedTotalWithdrawals || "₦0.00"}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
            <ArrowUpRight size={24} />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-[24px] border border-gray-100 p-6 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Transaction Reference or Description..."
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200/80 rounded-2xl text-xs text-gray-800 focus:outline-none focus:border-[#1B4D28]"
            />
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <button
              onClick={handleExportPDF}
              className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <FileText size={14} /> PDF
            </button>

            <button
              onClick={handleExportCSV}
              className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} /> CSV
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400 uppercase font-mono text-[10px] tracking-wider">
                <th className="py-4 px-6">TYPE</th>
                <th className="py-4 px-4">DESCRIPTION</th>
                <th className="py-4 px-4 font-mono">REFERENCE</th>
                <th className="py-4 px-4">DATE</th>
                <th className="py-4 px-4 text-right">AMOUNT</th>
                <th className="py-4 px-6 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 font-medium">
                    No transactions recorded yet in PostgreSQL.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  const isCredit = tx.type === "DEPOSIT" || tx.type === "REFUND" || tx.type === "ESCROW_RELEASE";
                  return (
                    <tr
                      key={tx.id}
                      onClick={() =>
                        setSelectedReceipt({
                          transactionId: tx.reference,
                          date: tx.date,
                          method: tx.method,
                          payer: "SmartHub Agro System",
                          subtotal: tx.formattedAmount,
                          vat: "₦0.00",
                          fee: "₦0.00",
                          logistics: "₦0.00",
                          total: tx.formattedAmount,
                        })
                      }
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-6">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ${
                            isCredit ? "bg-green-100 text-green-800" : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {isCredit ? "↓" : "↑"}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold text-gray-900">{tx.description || tx.type}</td>
                      <td className="py-4 px-4 font-mono font-semibold text-gray-600">{tx.reference}</td>
                      <td className="py-4 px-4 font-mono text-gray-500">{tx.date}</td>
                      <td
                        className={`py-4 px-4 text-right font-mono font-extrabold text-sm ${
                          isCredit ? "text-green-700" : "text-rose-600"
                        }`}
                      >
                        {tx.formattedAmount}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-[10px] font-bold font-mono">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
