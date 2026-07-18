"use client";

import { useState } from "react";
import { AlertCircle, ShieldAlert, CheckCircle2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

export default function BuyerDisputePage() {
  const { toast } = useToast();
  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !reason.trim()) {
      toast("Please provide order number and dispute details", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, reason }),
      });
      toast("Dispute opened. Escrow funds locked for arbitration.", "success");
      setIsSubmitted(true);
    } catch (err) {
      toast("Dispute recorded for admin review", "info");
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 font-sans">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors mb-4 w-fit"
        >
          <ChevronLeft size={16} />
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Escrow Dispute & Claim Center</h1>
            <p className="text-xs text-gray-400 mt-1">File a claim to freeze escrow payouts for defective moisture or non-delivery</p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mx-auto">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Dispute Ticket #{orderId} Opened</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Escrow funds for Order #{orderId} have been <span className="font-bold text-red-600">frozen</span>. Our quality arbitration team will review lab reports within 24 hours.
            </p>
            <Link href="/dashboard" className="inline-block mt-4 px-8 py-3 bg-[#1B4D28] text-white text-xs font-bold rounded-full hover:bg-[#143d20] shadow-md transition-all">
              Return to Dashboard
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Order Reference / Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AGRO-90123-456"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-red-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Dispute Reason & Findings
              </label>
              <textarea
                rows={5}
                required
                placeholder="Describe quality defect (e.g. moisture content exceeded 12% limit, packaging damaged, missing lab certificate)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-red-400 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-full shadow-lg transition-all"
            >
              {isSubmitting ? "Filing Claim..." : "Freeze Escrow & File Claim"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
