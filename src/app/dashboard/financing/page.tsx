"use client";

import { useState } from "react";
import { Coins, ShieldCheck, CheckCircle2, ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

export default function TradeFinancingPage() {
  const { toast } = useToast();
  const [requestedCredit, setRequestedCredit] = useState("5000000");
  const [tenor, setTenor] = useState("60");
  const [isApplied, setIsApplied] = useState(false);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    toast("Trade credit application submitted to financial partner desk!", "success");
    setIsApplied(true);
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 font-sans">
      <div className="bg-[#1B4D28] text-white rounded-[28px] p-8 md:p-12 mb-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="bg-white/10 text-[#81C784] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
            B2B Trade Credit & BNPL
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-4 mb-3">
            Procure Crops Now. Pay Upon Port Loading.
          </h1>
          <p className="text-gray-200 text-sm leading-relaxed">
            Smarthub Agrochain partners with trade financing institutions to provide 30-90 day revolving working capital for international commodity importers.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-10">
        {isApplied ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-[#1B4D28] mx-auto">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Trade Credit Application Submitted!</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Your application for <span className="font-bold text-gray-800">₦{parseInt(requestedCredit).toLocaleString()}</span> revolving credit is under review by our underwriting desk.
            </p>
            <Link href="/dashboard" className="inline-block mt-4 px-8 py-3 bg-[#1B4D28] text-white text-xs font-bold rounded-full hover:bg-[#143d20] shadow-md transition-all">
              Return to Buyer Dashboard
            </Link>
          </div>
        ) : (
          <form onSubmit={handleApply} className="space-y-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Request Trade Credit Line</h2>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Requested Credit Line Amount (₦)
              </label>
              <input
                type="number"
                required
                value={requestedCredit}
                onChange={(e) => setRequestedCredit(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#1B4D28]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Repayment Tenor
              </label>
              <select
                value={tenor}
                onChange={(e) => setTenor(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#1B4D28]"
              >
                <option value="30">30 Days Deferred Payment (0.8% Fee)</option>
                <option value="60">60 Days Deferred Payment (1.5% Fee)</option>
                <option value="90">90 Days Deferred Payment (2.2% Fee)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-[#1B4D28] hover:bg-[#143d20] text-white text-sm font-bold rounded-full shadow-lg transition-all"
            >
              Submit Trade Credit Application
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
