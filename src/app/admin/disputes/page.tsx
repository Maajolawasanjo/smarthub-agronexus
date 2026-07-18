"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    async function fetchDisputes() {
      try {
        const res = await fetch("/api/disputes");
        const data = await res.json();
        if (data.disputes) {
          setDisputes(data.disputes);
        }
      } catch (err) {
        // Fallback demo disputes
        setDisputes([
          { id: "DSP-1092", orderId: "AGRO-88129", reason: "Moisture content level 14.5% exceeds contract cap 10%", status: "OPEN" },
          { id: "DSP-1093", orderId: "AGRO-67123", reason: "Foreign matter admixture count 2.1% (limit 0.5%)", status: "RESOLVED" },
        ]);
      }
    }
    fetchDisputes();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleResolve = (id: string, action: "refund" | "release") => {
    setDisputes(prev =>
      prev.map(d => d.id === id ? { ...d, status: action === "refund" ? "REFUNDED_TO_BUYER" : "RELEASED_TO_FARMER" } : d)
    );
    triggerToast(`Dispute #${id} resolved: Escrow ${action === "refund" ? "refunded to Buyer" : "released to Farmer"}.`);
  };

  return (
    <div className="space-y-6 font-sans">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1B4D28] text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3">
          <CheckCircle2 size={20} className="text-[#4CAF50]" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Escrow Dispute Arbitration Panel</h1>
        <p className="text-xs text-gray-400 mt-1">Arbitrate buyer quality claims and release or refund frozen escrow funds</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Dispute ID</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Order Ref</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Reason / Finding</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Arbitration Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {disputes.length > 0 ? (
                disputes.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6 font-bold text-gray-800">{d.id}</td>
                    <td className="py-4 px-6 text-gray-600 font-semibold">{d.orderId}</td>
                    <td className="py-4 px-6 text-gray-500 max-w-xs truncate" title={d.reason}>{d.reason}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        d.status === "OPEN"
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : "bg-green-50 text-green-600 border border-green-100"
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {d.status === "OPEN" ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleResolve(d.id, "refund")}
                            className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Refund Buyer
                          </button>
                          <button
                            onClick={() => handleResolve(d.id, "release")}
                            className="px-3 py-1.5 bg-[#1B4D28] text-white text-xs font-bold rounded-lg hover:bg-[#143d20] transition-colors"
                          >
                            Release Farmer
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-bold">Case Closed</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-400 font-semibold">
                    No active escrow disputes logged.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
