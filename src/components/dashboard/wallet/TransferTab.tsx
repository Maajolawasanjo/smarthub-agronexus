"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Building2, ShieldCheck, ArrowRight, Wallet, Clock } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { WalletPageDTO, LinkedBankDTO } from "@/types/wallet.dto";

export function TransferTab() {
  const { toast } = useToast();
  const [transferAmount, setTransferAmount] = useState("");
  const [selectedBankId, setSelectedBankId] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletPage, setWalletPage] = useState<WalletPageDTO | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch("/api/wallet");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setWalletPage(json.data);
          if (json.data.linkedBanks?.length > 0) {
            const defaultBank = json.data.linkedBanks.find((b: LinkedBankDTO) => b.isDefault) || json.data.linkedBanks[0];
            setSelectedBankId(defaultBank.id);
          }
        }
      }
    } catch (err) {
      console.error("Error loading wallet data in TransferTab:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const availableBalance = walletPage?.balances?.availableBalance || 0;
  const amountNum = parseFloat(transferAmount) || 0;

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountNum <= 0) {
      toast("Please enter a valid transfer amount.", "error");
      return;
    }

    if (amountNum > availableBalance) {
      toast(`Transfer amount exceeds available balance (₦${availableBalance.toLocaleString()})`, "error");
      return;
    }

    if (!selectedBankId) {
      toast("Please select a verified destination bank account.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          bankAccountId: selectedBankId,
        }),
      });

      const json = await res.json();

      if (json.success) {
        toast(
          `Withdrawal request sent! ₦${amountNum.toLocaleString()} moved to Pending — funds will be released to your bank once Flutterwave confirms the transfer. Ref: ${json.data.transactionRef}`,
          "success"
        );
        setTransferAmount("");
        await loadData();
      } else {
        toast(json.error?.message || "Withdrawal failed.", "error");
      }
    } catch (err) {
      toast("Network error processing bank transfer.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Transfer & Withdraw Funds</h2>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Move money from your commercial wallet to a verified NGN bank account instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">

          {/* Available Balance Box */}
          <div className="bg-[#F6F8F5] border border-gray-200/80 rounded-[24px] p-6 md:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-widest text-gray-500 font-bold">
                  AVAILABLE BALANCE (NGN)
                </span>
                <h3 className="text-3xl md:text-4xl font-extrabold font-mono text-gray-900 tracking-tight">
                  {walletPage?.balances?.formattedAvailableBalance || "₦0.00"}
                </h3>
                <p className="text-xs text-gray-500 font-serif italic">Ready for instant withdrawal</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-gray-400 block mb-1">Tier Policy</span>
                <span className="bg-white border border-gray-200 font-mono font-bold text-xs px-3 py-1.5 rounded-lg text-[#1B4D28]">
                  {walletPage?.limits?.tier || "TIER 1"}
                </span>
              </div>
            </div>

            {/* Pending Withdrawal Row */}
            {walletPage?.balances?.pendingWithdrawals !== undefined && walletPage.balances.pendingWithdrawals > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
                <Clock size={14} className="text-amber-600 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-amber-800">Pending Withdrawal: {walletPage.balances.formattedPendingWithdrawals}</p>
                  <p className="text-[10px] text-amber-600">Funds in transit — awaiting bank confirmation via Flutterwave webhook.</p>
                </div>
              </div>
            )}
          </div>

          {/* Withdrawal Form */}
          <form onSubmit={handleWithdrawal} className="bg-white rounded-[24px] border border-gray-100 p-6 md:p-8 space-y-6 shadow-sm">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2 uppercase tracking-wider">
                Select Destination Bank Account
              </label>
              {walletPage?.linkedBanks && walletPage.linkedBanks.length > 0 ? (
                <div className="space-y-3">
                  {walletPage.linkedBanks.map((bank) => (
                    <label
                      key={bank.id}
                      onClick={() => setSelectedBankId(bank.id)}
                      className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                        selectedBankId === bank.id
                          ? "bg-green-50/60 border-[#1B4D28]"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Building2 size={20} className="text-[#1B4D28]" />
                        <div>
                          <p className="text-xs font-bold text-gray-900">{bank.bankName}</p>
                          <p className="text-[11px] font-mono text-gray-500">
                            {bank.accountName} • {bank.accountNumber}
                          </p>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="destinationBank"
                        checked={selectedBankId === bank.id}
                        onChange={() => setSelectedBankId(bank.id)}
                        className="accent-[#1B4D28]"
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 font-medium">
                  No verified bank account linked. Please link a bank account in the "Linked Accounts" tab first.
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5 uppercase tracking-wider">
                Withdrawal Amount (NGN)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">₦</span>
                <input
                  type="number"
                  min="100"
                  step="any"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-lg font-bold text-gray-900 focus:outline-none focus:border-[#1B4D28]"
                  placeholder="50,000.00"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedBankId}
              className="w-full bg-[#1B4D28] text-white py-4 rounded-full text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#153a1e] transition-all cursor-pointer shadow-lg disabled:opacity-50"
            >
              {loading ? "Processing Withdrawal..." : <>Execute Bank Withdrawal <ArrowRight size={14} /></>}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
