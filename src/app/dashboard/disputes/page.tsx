"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ShieldAlert, CheckCircle2, ChevronLeft, Loader2, RefreshCw, Clock } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

interface DisputeItem {
  id: string;
  orderId: string;
  title: string;
  description: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";
  resolution: string | null;
  closedAt: string | null;
  createdAt: string;
  order?: {
    orderNumber: string;
    totalAmount: number | string;
  };
}

interface OrderOption {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
}

function BuyerDisputeContent() {
  const searchParams = useSearchParams();
  const prefilledOrderId = searchParams.get("orderId");
  const { toast } = useToast();

  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState(prefilledOrderId || "");
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [isLoadingDisputes, setIsLoadingDisputes] = useState(true);
  const [activeView, setActiveView] = useState<"LIST" | "NEW">("LIST");

  // Fetch buyer's orders to populate dropdown
  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          if (data.orders) {
            setOrders(data.orders);
            if (prefilledOrderId) {
              setSelectedOrderId(prefilledOrderId);
              setActiveView("NEW");
            }
          }
        }
      } catch (err) {
        console.error("Failed to load orders for dispute selection:", err);
      }
    }
    fetchOrders();
  }, [prefilledOrderId]);

  // Fetch buyer's filed disputes
  const fetchDisputes = async () => {
    setIsLoadingDisputes(true);
    try {
      const res = await fetch("/api/disputes");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.disputes) {
          setDisputes(data.data.disputes);
        } else if (data.disputes) {
          setDisputes(data.disputes);
        } else {
          setDisputes([]);
        }
      }
    } catch (err) {
      console.error("Failed to load user disputes:", err);
    } finally {
      setIsLoadingDisputes(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId.trim() || !reason.trim()) {
      toast("Please select an order and provide dispute details", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrderId,
          title: title.trim() || "Quality / Delivery Dispute",
          description: reason.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast("Dispute claim lodged successfully! Escrow funds frozen for arbitration.", "success");
        setTitle("");
        setReason("");
        setActiveView("LIST");
        await fetchDisputes();
      } else {
        toast(data.error?.message || "Failed to lodge dispute claim.", "error");
      }
    } catch (err: any) {
      toast(err.message || "Network error submitting dispute", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 font-sans space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors w-fit"
        >
          <ChevronLeft size={16} />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView("LIST")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === "LIST"
                ? "bg-[#1B4D28] text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            My Dispute Claims ({disputes.length})
          </button>
          <button
            onClick={() => setActiveView("NEW")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === "NEW"
                ? "bg-red-600 text-white shadow-sm"
                : "bg-white text-red-600 border border-red-200 hover:bg-red-50"
            }`}
          >
            + File New Claim
          </button>
        </div>
      </div>

      {activeView === "NEW" ? (
        /* Form for filing dispute */
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">File Escrow Dispute & Quality Claim</h1>
              <p className="text-xs text-gray-400 mt-1">
                Lodge a formal claim to freeze escrow payouts for lab defect, high moisture, or delivery failure
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Target Order
              </label>
              {orders.length > 0 ? (
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  required
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#1B4D28]"
                >
                  <option value="">Select an order to dispute...</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      Order #{o.orderNumber} — ₦{Number(o.totalAmount).toLocaleString()} ({o.status})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  placeholder="Paste Order ID or Reference (e.g. AGRO-...)"
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#1B4D28]"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Dispute Subject / Claim Category
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Moisture content exceeds contract limit (14.5% vs 10% max)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#1B4D28]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Evidence Details & Inspection Findings
              </label>
              <textarea
                rows={5}
                required
                placeholder="Provide specific details regarding the produce quality, moisture inspection readings, damaged bags, or delivery timeline non-compliance..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#1B4D28] resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setActiveView("LIST")}
                className="px-6 py-4 border border-gray-200 text-gray-600 text-sm font-bold rounded-full hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-sm font-bold rounded-full shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Freezing Escrow & Lodging Claim...
                  </>
                ) : (
                  "Freeze Escrow & Lodge Formal Claim"
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* List of user disputes */
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Your Dispute Claims & Resolution History</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Real-time tracking of arbitration status and administrative decisions
              </p>
            </div>
            <button
              onClick={fetchDisputes}
              disabled={isLoadingDisputes}
              className="p-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 cursor-pointer"
              title="Refresh disputes"
            >
              <RefreshCw size={16} className={isLoadingDisputes ? "animate-spin" : ""} />
            </button>
          </div>

          {isLoadingDisputes ? (
            <div className="py-12 text-center text-gray-400 font-semibold">
              <Loader2 size={24} className="animate-spin inline-block mr-2 text-[#1B4D28]" />
              Loading your dispute claims...
            </div>
          ) : disputes.length > 0 ? (
            <div className="space-y-4">
              {disputes.map((d) => {
                const orderNumber = d.order?.orderNumber || d.orderId;
                return (
                  <div
                    key={d.id}
                    className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gray-700 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                          #{d.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500 font-semibold">
                          Order: {orderNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            d.status === "OPEN" || d.status === "UNDER_REVIEW"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : d.status === "RESOLVED"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {d.status}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {new Date(d.createdAt).toLocaleDateString("en-NG", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">{d.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{d.description}</p>
                    </div>

                    {d.resolution && (
                      <div className="p-3 bg-green-50 rounded-xl border border-green-100 text-xs text-[#1B4D28] space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-[#4CAF50]" />
                          Arbitration Resolution:
                        </div>
                        <p>{d.resolution}</p>
                        {d.closedAt && (
                          <div className="text-[10px] text-gray-400">
                            Closed: {new Date(d.closedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400 space-y-3">
              <ShieldAlert size={40} className="mx-auto text-gray-300" />
              <p className="text-sm font-semibold text-gray-600">No active dispute claims filed.</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                If you encounter any quality or delivery discrepancy with an order, you can file a claim to lock escrow funds.
              </p>
              <button
                onClick={() => setActiveView("NEW")}
                className="px-6 py-2.5 bg-[#1B4D28] text-white text-xs font-bold rounded-xl hover:bg-[#143d20] shadow-sm cursor-pointer"
              >
                Lodge a Claim
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BuyerDisputePage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#1B4D28]/20 border-t-[#1B4D28] rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium">Loading dispute center...</p>
        </div>
      }
    >
      <BuyerDisputeContent />
    </Suspense>
  );
}
