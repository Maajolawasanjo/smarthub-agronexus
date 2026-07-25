"use client";

import { useState, useEffect } from "react";
import { X, Building2, AlertCircle, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { LinkedBankDTO } from "@/types/wallet.dto";

interface FarmerWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  formattedAvailableBalance: string;
  linkedBanks: LinkedBankDTO[];
  onSuccess: () => void;
}

export function FarmerWithdrawModal({
  isOpen,
  onClose,
  availableBalance,
  formattedAvailableBalance,
  linkedBanks,
  onSuccess,
}: FarmerWithdrawModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (linkedBanks.length > 0 && !selectedBankId) {
      const defaultBank = linkedBanks.find((b) => b.isDefault) || linkedBanks[0];
      setSelectedBankId(defaultBank.id);
    }
  }, [linkedBanks, selectedBankId]);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const isOverBalance = numAmount > availableBalance;
  const isValidAmount = numAmount > 0 && !isOverBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!isValidAmount) {
      setError("Please enter a valid withdrawal amount within your available balance.");
      return;
    }

    if (!selectedBankId) {
      setError("Please select or add a verified bank account for payout.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          bankAccountId: selectedBankId,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Bank withdrawal request failed.");
      }

      setSuccessMsg(
        `Withdrawal of ₦${numAmount.toLocaleString("en-NG")} initiated! Status is PENDING settlement via Flutterwave bank transfer.`
      );
      setAmount("");
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccessMsg(null);
      }, 2500);
    } catch (err: any) {
      setError(err.message || "Failed to process withdrawal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans animate-fadeIn">
      <div className="bg-white rounded-[28px] max-w-md w-full p-6 md:p-8 shadow-2xl border border-gray-100 space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={18} />
        </button>

        <div>
          <div className="w-10 h-10 bg-green-50 text-[#1B4D28] rounded-2xl flex items-center justify-center mb-3">
            <Building2 size={20} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Withdraw Funds</h2>
          <p className="text-xs text-gray-500 mt-1">
            Payout directly to your verified bank account via Flutterwave Transfers API.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200/80 rounded-2xl flex items-start gap-2 text-xs text-red-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-green-50 border border-green-200/80 rounded-2xl flex items-start gap-2 text-xs text-green-800">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-green-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Available Balance Banner */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available Balance</span>
            <span className="text-base font-extrabold text-gray-900">{formattedAvailableBalance}</span>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Withdrawal Amount (₦)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₦</span>
              <input
                type="number"
                min="100"
                step="0.01"
                placeholder="50,000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full pl-9 pr-14 py-3 bg-white border ${
                  isOverBalance ? "border-red-400 focus:ring-red-200" : "border-gray-200 focus:border-[#1B4D28]"
                } rounded-full text-sm font-bold text-gray-900 focus:outline-none transition-all`}
              />
              <button
                type="button"
                onClick={() => setAmount(availableBalance.toString())}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#1B4D28] bg-green-50 px-2 py-1 rounded-full hover:bg-green-100 transition-colors"
              >
                MAX
              </button>
            </div>
            {isOverBalance && (
              <p className="text-[11px] font-semibold text-red-500">Amount exceeds available balance.</p>
            )}
          </div>

          {/* Bank Account Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Destination Bank Account</label>
            {linkedBanks.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs text-amber-800 space-y-2">
                <p>No verified bank account linked yet.</p>
                <p className="text-[11px] text-amber-700">Please link a bank account below before requesting payout.</p>
              </div>
            ) : (
              <select
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#1B4D28] transition-all"
              >
                {linkedBanks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} — {b.accountNumber} ({b.accountName})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isValidAmount || linkedBanks.length === 0}
            className="w-full py-3.5 bg-[#1B4D28] text-white font-bold text-sm rounded-full shadow-lg shadow-green-950/20 hover:bg-[#143d20] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Processing Payout…
              </>
            ) : (
              <>
                Confirm Bank Withdrawal <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
