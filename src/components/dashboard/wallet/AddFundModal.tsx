"use client";

import { useState, useEffect } from "react";
import {
  X, CreditCard, ShieldCheck, ExternalLink, Zap, ArrowRight
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { FundingInstructionsDTO } from "@/types/wallet.dto";

interface AddFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type FundMethod = "FLUTTERWAVE" | "SIMULATED";

const QUICK_AMOUNTS = [5000, 10000, 25000, 50000, 100000];

export function AddFundModal({ isOpen, onClose, onSuccess }: AddFundModalProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("50000");
  const [selectedOption, setSelectedOption] = useState<FundMethod>("FLUTTERWAVE");
  const [loading, setLoading] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [fundingInfo, setFundingInfo] = useState<FundingInstructionsDTO | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/wallet")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data?.fundingInstructions) {
            setFundingInfo(json.data.fundingInstructions);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Flutterwave hosted checkout — all card / USSD / bank transfer routes go through here
  const handleFlutterwaveFund = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 100) {
      toast("Minimum funding amount is ₦100.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/payments/flutterwave/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalAmount: numAmount, purpose: "WALLET_FUNDING" }),
      });
      const json = await res.json();
      if (json.status === "success" && json.link) {
        window.location.href = json.link;
      } else {
        toast(json.error || "Failed to initialize payment. Try again.", "error");
      }
    } catch {
      toast("Network error connecting to payment gateway.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Dev/test-only: bypass gateway and credit wallet directly
  const handleSimulateDeposit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast("Please enter a valid deposit amount.", "error");
      return;
    }
    setSimLoading(true);
    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmount, simulateWebhook: true }),
      });
      const json = await res.json();
      if (json.success) {
        toast(`Wallet credited with ₦${numAmount.toLocaleString("en-NG")}!`, "success");
        onSuccess?.();
        onClose();
      } else {
        toast(json.error?.message || "Failed to process deposit.", "error");
      }
    } catch {
      toast("Network error simulating deposit.", "error");
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1B4D28] text-white rounded-full flex items-center justify-center font-bold text-base">
              ₦
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Fund Your Wallet</h3>
              <p className="text-[11px] text-gray-500">Powered by Flutterwave — Card, USSD, Bank Transfer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Tab Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setSelectedOption("FLUTTERWAVE")}
              className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                selectedOption === "FLUTTERWAVE"
                  ? "bg-white text-[#1B4D28] shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Pay via Flutterwave
            </button>
            <button
              onClick={() => setSelectedOption("SIMULATED")}
              className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                selectedOption === "SIMULATED"
                  ? "bg-white text-rose-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Dev Test Only
            </button>
          </div>

          {/* FLUTTERWAVE — Main Funding Option */}
          {selectedOption === "FLUTTERWAVE" && (
            <div className="space-y-5">
              {/* Amount Input */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2 uppercase tracking-wider">
                  Amount to Fund (NGN)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-gray-400 text-lg">₦</span>
                  <input
                    type="number"
                    min="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-2xl font-extrabold text-gray-900 focus:outline-none focus:border-[#1B4D28] transition-colors font-mono"
                    placeholder="50,000"
                  />
                </div>
              </div>

              {/* Quick Amount Chips */}
              <div className="flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((q) => (
                  <button
                    key={q}
                    onClick={() => setAmount(String(q))}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                      amount === String(q)
                        ? "bg-[#1B4D28] text-white border-[#1B4D28]"
                        : "bg-white text-gray-700 border-gray-200 hover:border-[#1B4D28] hover:text-[#1B4D28]"
                    }`}
                  >
                    ₦{q.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Payment Methods Badge Row */}
              <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold text-gray-500">
                <span className="bg-gray-100 px-2.5 py-1 rounded-full">💳 Debit/Credit Card</span>
                <span className="bg-gray-100 px-2.5 py-1 rounded-full">🏦 Bank Transfer</span>
                <span className="bg-gray-100 px-2.5 py-1 rounded-full">📱 USSD</span>
                <span className="bg-gray-100 px-2.5 py-1 rounded-full">📲 Mobile Banking</span>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleFlutterwaveFund}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#F5A623] via-[#e8951f] to-[#F5A623] hover:brightness-105 text-white py-4 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-orange-900/20 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  "Connecting to Flutterwave..."
                ) : (
                  <>
                    <CreditCard size={16} />
                    Pay ₦{Number(amount || 0).toLocaleString()} via Flutterwave
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              {/* Security Footer */}
              <div className="flex items-center justify-center gap-4 pt-1 text-[10px] font-mono text-gray-400">
                <span className="flex items-center gap-1"><ShieldCheck size={11} className="text-green-600" /> SSL SECURED</span>
                <span className="flex items-center gap-1"><ShieldCheck size={11} className="text-green-600" /> PCI COMPLIANT</span>
                <span className="flex items-center gap-1"><ShieldCheck size={11} className="text-green-600" /> FLUTTERWAVE VERIFIED</span>
              </div>

              <p className="text-[10px] text-gray-400 text-center">
                Your wallet is credited automatically after Flutterwave confirms payment via secure webhook.
              </p>
            </div>
          )}

          {/* DEV TEST — Bypass gateway for development only */}
          {selectedOption === "SIMULATED" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                <p className="text-[11px] font-bold text-rose-700">⚠ Development Mode Only</p>
                <p className="text-[11px] text-rose-600 mt-0.5">
                  This bypasses Flutterwave and instantly credits the wallet without going through the banking network.
                  Do not use in production.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5 uppercase tracking-wider">
                  Simulation Amount (NGN)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">₦</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-9 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-lg font-bold text-gray-900 focus:outline-none focus:border-rose-400 font-mono"
                  />
                </div>
              </div>

              <button
                onClick={handleSimulateDeposit}
                disabled={simLoading}
                className="w-full bg-rose-600 text-white py-4 rounded-full text-xs font-bold flex items-center justify-center gap-2 hover:bg-rose-700 transition-all cursor-pointer shadow-lg disabled:opacity-50"
              >
                {simLoading ? "Processing..." : <><Zap size={16} /> Credit ₦{Number(amount).toLocaleString()} (Dev Only)</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
