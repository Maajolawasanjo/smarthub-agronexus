"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, CheckCircle2, XCircle, ArrowRight, Loader2, AlertTriangle, RefreshCw } from "lucide-react";

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
    buyer?: {
      user?: {
        fullName: string;
        email: string;
      };
    };
  };
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [arbitrationAction, setArbitrationAction] = useState<"REFUND_BUYER" | "RELEASE_TO_FARMER" | null>(null);
  const [arbitrationNotes, setArbitrationNotes] = useState("");
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchDisputes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/disputes");
      const data = await res.json();
      if (data.success && data.data?.disputes) {
        setDisputes(data.data.disputes);
      } else if (data.disputes) {
        setDisputes(data.disputes);
      } else {
        setDisputes([]);
      }
    } catch (err) {
      console.error("Failed to load disputes from API:", err);
      triggerToast("Failed to fetch live disputes from server.", "error");
      setDisputes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const triggerToast = (text: string, type: "success" | "error") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const openArbitrationModal = (dispute: DisputeItem, action: "REFUND_BUYER" | "RELEASE_TO_FARMER") => {
    setSelectedDispute(dispute);
    setArbitrationAction(action);
    setArbitrationNotes("");
  };

  const handleConfirmArbitration = async () => {
    if (!selectedDispute || !arbitrationAction) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/disputes/${selectedDispute.id}/resolve`, {
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
            ? `Dispute #${selectedDispute.id.slice(0, 8)} resolved: Escrow refunded to Buyer.`
            : `Dispute #${selectedDispute.id.slice(0, 8)} resolved: Escrow released to Farmer.`,
          "success"
        );
        setSelectedDispute(null);
        setArbitrationAction(null);
        await fetchDisputes();
      } else {
        triggerToast(data.error?.message || "Failed to adjudicate dispute.", "error");
      }
    } catch (err: any) {
      triggerToast(err.message || "Network error adjudicating dispute.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Escrow Dispute Arbitration Panel</h1>
          <p className="text-xs text-gray-400 mt-1">
            Governed dispute resolution: adjudicate buyer quality claims and release or refund frozen escrow funds
          </p>
        </div>
        <button
          onClick={fetchDisputes}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          Refresh Claims
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Dispute ID</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Order Ref</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Claim Reason / Description</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Escrow Value</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Arbitration Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 font-semibold">
                    <Loader2 size={24} className="animate-spin inline-block mr-2 text-[#1B4D28]" />
                    Loading live disputes from PostgreSQL...
                  </td>
                </tr>
              ) : disputes.length > 0 ? (
                disputes.map((d) => {
                  const orderRef = d.order?.orderNumber || d.orderId;
                  const buyerName = d.order?.buyer?.user?.fullName || "Buyer";
                  const orderAmount = d.order?.totalAmount
                    ? `₦${Number(d.order.totalAmount).toLocaleString()}`
                    : "—";

                  return (
                    <tr key={d.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs font-bold text-gray-800">
                        <Link
                          href={`/admin/disputes/${d.id}`}
                          className="text-[#1B4D28] hover:underline font-bold"
                          title="Inspect Dispute Dossier"
                        >
                          {d.id.length > 12 ? `${d.id.slice(0, 8)}...` : d.id}
                        </Link>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-800 text-xs">{orderRef}</div>
                        <div className="text-[11px] text-gray-400">{buyerName}</div>
                      </td>
                      <td className="py-4 px-6 max-w-xs">
                        <div className="font-semibold text-gray-800 text-xs truncate" title={d.title}>
                          {d.title}
                        </div>
                        <div className="text-xs text-gray-500 truncate" title={d.description}>
                          {d.description}
                        </div>
                        {d.resolution && (
                          <div className="mt-1 text-[11px] text-[#1B4D28] font-medium bg-green-50/80 p-1.5 rounded-lg border border-green-100">
                            <strong>Resolution:</strong> {d.resolution}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 font-bold text-gray-800 text-xs">{orderAmount}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            d.status === "OPEN" || d.status === "UNDER_REVIEW"
                              ? "bg-amber-50 text-amber-600 border border-amber-100"
                              : d.status === "RESOLVED"
                              ? "bg-green-50 text-green-700 border border-green-100"
                              : "bg-gray-50 text-gray-600 border border-gray-100"
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {d.status === "OPEN" || d.status === "UNDER_REVIEW" ? (
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/disputes/${d.id}`}
                              className="px-2.5 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              Dossier
                            </Link>
                            <button
                              onClick={() => openArbitrationModal(d, "REFUND_BUYER")}
                              className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
                            >
                              Refund Buyer
                            </button>
                            <button
                              onClick={() => openArbitrationModal(d, "RELEASE_TO_FARMER")}
                              className="px-3 py-1.5 bg-[#1B4D28] text-white text-xs font-bold rounded-lg hover:bg-[#143d20] transition-colors shadow-sm cursor-pointer"
                            >
                              Release Farmer
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/admin/disputes/${d.id}`}
                              className="px-2.5 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              Dossier
                            </Link>
                            <span className="text-xs text-gray-400 font-medium">
                              Closed {d.closedAt ? new Date(d.closedAt).toLocaleDateString() : ""}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 font-medium">
                    <ShieldAlert size={32} className="mx-auto mb-2 text-gray-300" />
                    No active escrow disputes logged in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Arbitration Modal */}
      {selectedDispute && arbitrationAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl ${
                  arbitrationAction === "REFUND_BUYER"
                    ? "bg-red-50 text-red-600"
                    : "bg-green-50 text-[#1B4D28]"
                }`}
              >
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {arbitrationAction === "REFUND_BUYER"
                    ? "Refund Escrow to Buyer"
                    : "Release Escrow to Farmer"}
                </h3>
                <p className="text-xs text-gray-500">
                  Case ID: #{selectedDispute.id.slice(0, 10)} | Order: {selectedDispute.order?.orderNumber || selectedDispute.orderId}
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl text-xs space-y-1 text-gray-600">
              <p>
                <strong>Claim:</strong> {selectedDispute.title}
              </p>
              <p className="line-clamp-2">
                <strong>Details:</strong> {selectedDispute.description}
              </p>
              {selectedDispute.order?.totalAmount && (
                <p>
                  <strong>Total Value:</strong> ₦{Number(selectedDispute.order.totalAmount).toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Arbitration Notes & Justification (Recorded in Audit Ledger)
              </label>
              <textarea
                value={arbitrationNotes}
                onChange={(e) => setArbitrationNotes(e.target.value)}
                placeholder="Specify inspection findings, grain moisture test results, or contract non-compliance rationale..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#1B4D28]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setSelectedDispute(null);
                  setArbitrationAction(null);
                }}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmArbitration}
                disabled={isSubmitting}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 cursor-pointer ${
                  arbitrationAction === "REFUND_BUYER"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#1B4D28] hover:bg-[#143d20]"
                }`}
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                Confirm Arbitration Execution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
