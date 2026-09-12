"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  User,
  Truck,
  Wallet,
  Clock,
  History,
  Loader2,
} from "lucide-react";

export default function AdminDisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const disputeId = resolvedParams.id;

  const [dossier, setDossier] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [arbitrationAction, setArbitrationAction] = useState<"REFUND_BUYER" | "RELEASE_TO_FARMER" | null>(null);
  const [arbitrationNotes, setArbitrationNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchDossier = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/disputes/${disputeId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setDossier(data.data);
      } else {
        setDossier(null);
      }
    } catch (err) {
      console.error("Failed to load dispute dossier", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDossier();
  }, [disputeId]);

  const triggerToast = (text: string, type: "success" | "error") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleExecuteArbitration = async () => {
    if (!arbitrationAction) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: arbitrationAction,
          notes: arbitrationNotes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(
          arbitrationAction === "REFUND_BUYER"
            ? "Dispute resolved: 100% Escrow refunded to Buyer wallet."
            : "Dispute resolved: Escrow released to Farmer wallet (minus commission).",
          "success"
        );
        setArbitrationAction(null);
        await fetchDossier();
      } else {
        triggerToast(data.error?.message || "Failed to execute arbitration.", "error");
      }
    } catch (err: any) {
      triggerToast(err.message || "Network error executing arbitration", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-gray-400 bg-white rounded-3xl border border-gray-100 flex flex-col items-center justify-center font-sans">
        <Loader2 size={32} className="text-[#1B4D28] animate-spin mb-3" />
        <p className="text-sm font-semibold">Loading dispute investigation dossier...</p>
      </div>
    );
  }

  if (!dossier || !dossier.dispute) {
    return (
      <div className="p-16 text-center text-gray-400 bg-white rounded-3xl border border-gray-100 space-y-4 font-sans">
        <ShieldAlert size={48} className="mx-auto text-gray-300" />
        <h2 className="text-xl font-bold text-gray-800">Dispute Claim Not Found</h2>
        <p className="text-xs text-gray-500">The requested dispute ID does not exist or has been purged.</p>
        <Link
          href="/admin/disputes"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1B4D28] text-white text-xs font-bold rounded-xl"
        >
          <ChevronLeft size={16} /> Back to Disputes
        </Link>
      </div>
    );
  }

  const { dispute, auditLogs } = dossier;
  const order = dispute.order;
  const orderTotal = Number(order.totalAmount || 0);

  return (
    <div className="max-w-6xl mx-auto pb-12 font-sans space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 ${
            toastMessage.type === "success" ? "bg-[#1B4D28]" : "bg-red-600"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 size={20} className="text-[#4CAF50]" />
          ) : (
            <XCircle size={20} className="text-white" />
          )}
          <span className="text-sm font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/disputes"
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-2 w-fit"
          >
            <ChevronLeft size={16} /> Back to Arbitration Panel
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">
              Dispute Dossier #{dispute.id.slice(0, 8).toUpperCase()}
            </h1>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold ${
                dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : dispute.status === "RESOLVED"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {dispute.status}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Filed on {new Date(dispute.createdAt).toLocaleString()} | Target Order: #{order.orderNumber}
          </p>
        </div>
      </div>

      {/* Main Grid: Left Dossier vs Right Arbitration Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Investigation Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Claim Summary Card */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Buyer Quality & Delivery Claim</h3>
                <p className="text-xs text-gray-400">Formal grievance registered against produce delivery</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-2">
              <div className="font-bold text-sm text-gray-800">{dispute.title}</div>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{dispute.description}</p>
            </div>

            {dispute.resolution && (
              <div className="p-4 bg-green-50 rounded-2xl border border-green-200 space-y-1.5">
                <div className="text-xs font-bold text-[#1B4D28] flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-[#4CAF50]" />
                  Adjudicated Resolution:
                </div>
                <p className="text-xs text-green-900">{dispute.resolution}</p>
                {dispute.closedAt && (
                  <div className="text-[10px] text-gray-500 pt-1">
                    Closed: {new Date(dispute.closedAt).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Order & Sub-Orders Breakdown */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Order & Seller Allocations</h3>
              <span className="text-xs font-bold text-[#1B4D28]">Order Status: {order.status}</span>
            </div>

            {/* Line Items */}
            <div className="divide-y divide-gray-100">
              {order.orderItems?.map((item: any) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-gray-800">{item.product?.name}</div>
                    <div className="text-[11px] text-gray-400">
                      Cooperative: {item.product?.farmerProfile?.farmName || "Verified Producer"} | Qty: {item.quantity} {item.product?.unit || "kg"}
                    </div>
                  </div>
                  <div className="font-bold text-gray-800">
                    ₦{Number(item.subtotal).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Seller Orders Partition */}
            {order.sellerOrders && order.sellerOrders.length > 0 && (
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Associated Seller Sub-Orders
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {order.sellerOrders.map((so: any) => (
                    <div key={so.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs">
                      <div className="font-mono font-bold text-gray-700">#{so.sellerOrderNumber}</div>
                      <div className="text-gray-500 mt-0.5">{so.farmerProfile?.farmName}</div>
                      <div className="flex items-center justify-between mt-2 font-semibold">
                        <span>Status: {so.status}</span>
                        <span>₦{Number(so.subtotal).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Forensic Audit Events Log */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <History size={18} className="text-[#1B4D28]" />
              Immutable Audit Events
            </h3>
            {auditLogs && auditLogs.length > 0 ? (
              <div className="space-y-2">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="p-2.5 bg-gray-50 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-gray-800">{log.action}</span>
                      <span className="text-gray-400 text-[11px] ml-2">by {log.actorEmail || log.actorId}</span>
                    </div>
                    <span className="text-gray-400 text-[11px]">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No previous audit records tied to this dispute.</p>
            )}
          </div>
        </div>

        {/* Right Column: Stakeholders & Arbitration Panel */}
        <div className="space-y-6">
          {/* Stakeholders Card */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Stakeholders</h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-2xl">
                <div className="text-[11px] text-gray-400 font-bold uppercase">Buyer / Claimant</div>
                <div className="font-bold text-gray-800 mt-0.5">
                  {order.buyer?.user?.fullName || dispute.user?.fullName || "Buyer"}
                </div>
                <div className="text-gray-500">{order.buyer?.user?.email || dispute.user?.email}</div>
                {order.buyer?.user?.phoneNumber && (
                  <div className="text-gray-500">{order.buyer?.user?.phoneNumber}</div>
                )}
              </div>

              <div className="p-3 bg-gray-50 rounded-2xl">
                <div className="text-[11px] text-gray-400 font-bold uppercase">Escrow Locked Funds</div>
                <div className="text-lg font-bold text-gray-900 mt-0.5">
                  ₦{orderTotal.toLocaleString()}
                </div>
                <div className="text-gray-500 text-[11px]">Payment Ref: {order.payment?.transactionRef || "ESCROW-LOCKED"}</div>
              </div>
            </div>
          </div>

          {/* Arbitration Execution Box */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={16} className="text-amber-600" />
              Arbitration Ruling
            </h3>

            {dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW" ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-500">
                  Select an authoritative ruling. Escrow funds will immediately execute via atomic ledger transaction.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setArbitrationAction("REFUND_BUYER")}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      arbitrationAction === "REFUND_BUYER"
                        ? "bg-red-600 text-white border-red-600 shadow-md"
                        : "bg-white text-red-600 border-red-200 hover:bg-red-50"
                    }`}
                  >
                    Refund Buyer (100%)
                  </button>
                  <button
                    onClick={() => setArbitrationAction("RELEASE_TO_FARMER")}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      arbitrationAction === "RELEASE_TO_FARMER"
                        ? "bg-[#1B4D28] text-white border-[#1B4D28] shadow-md"
                        : "bg-white text-[#1B4D28] border-green-200 hover:bg-green-50"
                    }`}
                  >
                    Release Farmer
                  </button>
                </div>

                {arbitrationAction && (
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-bold text-gray-700">
                      Arbitration Justification & Inspection Findings:
                    </label>
                    <textarea
                      rows={3}
                      value={arbitrationNotes}
                      onChange={(e) => setArbitrationNotes(e.target.value)}
                      placeholder="Specify grain inspection lab metrics, photographic proof of damaged packaging, or non-delivery timeline rationale..."
                      className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#1B4D28]"
                    />

                    <button
                      onClick={handleExecuteArbitration}
                      disabled={isSubmitting}
                      className="w-full py-3 bg-[#1B4D28] hover:bg-[#143d20] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Executing Ledger Transaction...
                        </>
                      ) : (
                        "Commit Arbitration Decision"
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-2xl text-center text-xs text-gray-400 font-semibold space-y-1">
                <CheckCircle2 size={24} className="mx-auto text-green-600 mb-1" />
                <div>Case Adjudicated & Closed</div>
                <div className="text-[11px] text-gray-500">
                  {dispute.closedAt ? new Date(dispute.closedAt).toLocaleDateString() : ""}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
