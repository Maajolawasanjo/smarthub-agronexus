"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Plus, MessageSquare, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function DisputesTab() {
  const { toast } = useToast();
  const [disputesData, setDisputesData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [orderId, setOrderId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const loadData = async () => {
    try {
      const res = await fetch("/api/wallet/disputes");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setDisputesData(json.data);
        }
      }
    } catch (err) {
      console.error("Failed to load disputes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !title || !description) {
      toast("Please complete all required fields.", "error");
      return;
    }

    try {
      const res = await fetch("/api/wallet/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, title, description }),
      });
      const json = await res.json();
      if (json.success) {
        toast("Dispute claim lodged successfully!", "success");
        setOrderId("");
        setTitle("");
        setDescription("");
        setShowForm(false);
        await loadData();
      } else {
        toast(json.error?.message || "Failed to lodge dispute.", "error");
      }
    } catch (err) {
      toast("Error submitting dispute claim.", "error");
    }
  };

  const tickets = disputesData?.disputes || [];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Disputes & Claims</h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Manage frozen dispute funds, lodge quality complaints, and review refund claims in PostgreSQL.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-rose-700 hover:bg-rose-800 text-white px-5 py-3 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
        >
          <Plus size={16} /> {showForm ? "Close Form" : "Open New Claim / Refund"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateDispute} className="bg-white rounded-[24px] border border-gray-100 p-6 space-y-4 shadow-md max-w-xl">
          <h3 className="text-sm font-bold text-gray-900">Lodge New Dispute Claim</h3>

          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-1">Order Number / ID</label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. ORD-991823"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold font-mono text-gray-800"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-1">Claim Subject</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Quality mismatch or missing item"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-1">Detailed Description & Evidence</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide complete details of the issue..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-rose-700 hover:bg-rose-800 text-white py-3.5 rounded-full text-xs font-bold"
          >
            Submit Dispute Ticket
          </button>
        </form>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-rose-950 text-white rounded-[24px] p-6 space-y-3 shadow-xl">
          <div className="flex items-center justify-between text-rose-300 text-[10px] font-mono font-bold uppercase tracking-wider">
            <span>FROZEN DISPUTE FUNDS (NGN)</span>
            <AlertTriangle size={16} />
          </div>
          <h3 className="text-3xl font-extrabold font-mono text-white">
            {disputesData?.formattedFrozenDisputeFunds || "₦0.00"}
          </h3>
          <p className="text-xs text-rose-200/80 font-serif italic">Held safely pending arbitration</p>
        </div>

        <div className="bg-white rounded-[24px] border border-gray-100 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">ACTIVE TICKETS</p>
            <h3 className="text-3xl font-extrabold font-mono text-gray-900">
              {String(disputesData?.activeTicketsCount || 0).padStart(2, "0")} Open
            </h3>
            <p className="text-xs text-amber-600 font-medium">Under Admin Review</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-gray-100 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">RESOLVED REFUNDS</p>
            <h3 className="text-2xl font-extrabold font-mono text-gray-900">
              {disputesData?.formattedTotalRefunded || "₦0.00"}
            </h3>
            <p className="text-xs text-green-700 font-medium font-mono">Credited to wallet</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-100 text-[#1B4D28] flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-[24px] border border-gray-100 p-6 space-y-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900">Dispute Claims History</h3>

        {tickets.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl">
            No active or historical dispute claims found in PostgreSQL.
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket: any) => (
              <div
                key={ticket.id}
                className="p-6 rounded-[20px] border border-gray-200 bg-gray-50/40 space-y-4 shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-md">
                        {ticket.ticketId}
                      </span>
                      <span className="font-mono text-xs text-gray-500">Order: {ticket.orderId}</span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">{ticket.subject}</h4>
                    <p className="text-xs text-gray-600">{ticket.description}</p>
                  </div>

                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-amber-100 text-amber-900">
                      {ticket.status}
                    </span>
                    <p className="text-lg font-mono font-extrabold text-gray-900 mt-1">{ticket.formattedAmount}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span className="font-mono text-[11px] text-gray-400">{ticket.lastUpdate}</span>
                  <button
                    onClick={() => toast(`Viewing ticket ${ticket.ticketId} details`, "info")}
                    className="font-bold text-[#1B4D28] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <MessageSquare size={14} /> Open Discussion
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
