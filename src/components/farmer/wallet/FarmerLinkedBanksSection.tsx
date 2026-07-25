"use client";

import { useState } from "react";
import { Building2, Plus, Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { LinkedBankDTO } from "@/types/wallet.dto";

interface FarmerLinkedBanksSectionProps {
  linkedBanks: LinkedBankDTO[];
  onRefresh: () => void;
}

export function FarmerLinkedBanksSection({ linkedBanks, onRefresh }: FarmerLinkedBanksSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("011");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountNumber || !accountName) {
      setError("Please fill in all bank details.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/wallet/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName,
          bankCode: bankCode || "011",
          accountNumber,
          accountName,
          isDefault: linkedBanks.length === 0,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to link bank account.");
      }

      setBankName("");
      setAccountNumber("");
      setAccountName("");
      setIsAdding(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to add bank account.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBank = async (bankId: string) => {
    if (!confirm("Are you sure you want to remove this bank account?")) return;
    try {
      const res = await fetch(`/api/wallet/bank-accounts?id=${bankId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onRefresh();
      }
    } catch {
      console.error("Failed to delete bank account");
    }
  };

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm md:text-base font-bold text-gray-900 flex items-center gap-2">
          <Building2 size={18} className="text-[#1B4D28]" /> Linked Bank Accounts
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs font-bold text-[#1B4D28] hover:bg-green-50 px-3 py-1.5 rounded-full border border-green-200 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Plus size={14} /> Add Bank
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddBank} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
          <p className="text-xs font-bold text-gray-800">Add New Payout Account</p>

          {error && (
            <p className="text-[11px] font-medium text-red-600 bg-red-50 p-2 rounded-xl flex items-center gap-1">
              <AlertCircle size={14} /> {error}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Bank Name</label>
              <input
                type="text"
                placeholder="e.g. Access Bank / First Bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-full text-xs focus:outline-none focus:border-[#1B4D28]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Bank Code (CBN 3-Digit)</label>
              <input
                type="text"
                placeholder="011"
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-full text-xs focus:outline-none focus:border-[#1B4D28]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Account Number</label>
              <input
                type="text"
                maxLength={10}
                placeholder="0123456789"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-full text-xs focus:outline-none focus:border-[#1B4D28]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Account Name</label>
              <input
                type="text"
                placeholder="Name registered with bank"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-full text-xs focus:outline-none focus:border-[#1B4D28]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-1.5 text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-1.5 bg-[#1B4D28] text-white text-xs font-bold rounded-full hover:bg-[#143d20] transition-colors flex items-center gap-1"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : "Save Bank Account"}
            </button>
          </div>
        </form>
      )}

      {linkedBanks.length === 0 ? (
        <p className="text-xs text-gray-400 italic py-2 text-center">
          No bank accounts linked yet. Click "Add Bank" to add payout details.
        </p>
      ) : (
        <div className="space-y-2">
          {linkedBanks.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 text-[#1B4D28] rounded-full flex items-center justify-center font-bold text-xs">
                  <Building2 size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-gray-800">{b.bankName}</p>
                    {b.isDefault && (
                      <span className="text-[9px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500">
                    {b.accountNumber} • {b.accountName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDeleteBank(b.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                title="Remove account"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
