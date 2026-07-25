"use client";

import { useState, useEffect } from "react";
import { Lock, Unlock, Clock, ShieldCheck, Truck } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function EscrowTab() {
  const { toast } = useToast();
  const [escrowState, setEscrowState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await fetch("/api/wallet/escrow");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setEscrowState(json.data);
        }
      }
    } catch (err) {
      console.error("Error fetching escrow data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReleaseFunds = async (dbOrderId: string, orderId: string, amount: string) => {
    toast(`Initiating release of ${amount} for order ${orderId}...`, "info");
    try {
      const res = await fetch("/api/wallet/escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dbOrderId }),
      });
      const json = await res.json();
      if (json.success) {
        toast(`Escrow funds for order ${orderId} released to farmer!`, "success");
        await loadData();
      } else {
        toast(json.error?.message || "Failed to release escrow.", "error");
      }
    } catch (err) {
      toast("Error processing escrow release.", "error");
    }
  };

  const escrowOrders = escrowState?.orders || [];

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Escrow & Milestone Release</h2>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Track and release funds locked in secure smart-contract escrow for pending farm fulfillment.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0A3918] text-white rounded-[24px] p-6 space-y-3 shadow-xl shadow-green-950/20">
          <div className="flex items-center justify-between text-green-300 text-[10px] font-mono font-bold uppercase tracking-wider">
            <span>FUNDS IN ESCROW (NGN)</span>
            <Lock size={16} />
          </div>
          <h3 className="text-3xl font-extrabold font-mono text-white">
            {escrowState?.formattedTotalLockedEscrow || "₦0.00"}
          </h3>
          <p className="text-xs text-green-200/80 font-serif italic">Locked until delivery verification</p>
        </div>

        <div className="bg-white rounded-[24px] border border-gray-100 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">ACTIVE PROTECTED ORDERS</p>
            <h3 className="text-3xl font-extrabold font-mono text-gray-900">
              {String(escrowState?.activeProtectedOrdersCount || 0).padStart(2, "0")} Orders
            </h3>
            <p className="text-xs text-gray-500 font-medium">100% Escrow Protected</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-100 text-[#1B4D28] flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-gray-100 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">NEXT AUTO-RELEASE</p>
            <h3 className="text-2xl font-extrabold font-mono text-gray-900">
              {escrowState?.nextScheduledRelease || "₦0.00"}
            </h3>
            <p className="text-xs text-emerald-700 font-medium font-mono">Upon Delivery Sign-off</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Clock size={24} />
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-[24px] border border-gray-100 p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Active Escrow Vaults</h3>
          <span className="text-[10px] font-mono font-bold bg-green-100 text-green-800 px-2.5 py-1 rounded-full">
            SMART-CONTRACT VERIFIED
          </span>
        </div>

        {escrowOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl">
            No active orders in escrow currently.
          </div>
        ) : (
          <div className="space-y-4">
            {escrowOrders.map((item: any) => (
              <div
                key={item.dbOrderId}
                className="p-6 rounded-[20px] border border-gray-200 bg-gray-50/40 space-y-4 shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#1B4D28] bg-green-100 px-2.5 py-0.5 rounded-md">
                        {item.orderId}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900">{item.produce}</h4>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">{item.farmer}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-mono">ESCROW AMOUNT</p>
                    <p className="text-xl font-mono font-extrabold text-gray-900">{item.formattedAmount}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                      <Truck size={14} className="text-[#1B4D28]" /> {item.milestone}
                    </span>
                    <span className="font-mono font-bold text-green-700">{item.logisticsProgress}% Completed</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      style={{ width: `${item.logisticsProgress}%` }}
                      className="bg-[#0A3918] h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <span className="text-gray-500 font-mono text-[11px]">
                    Delivery ETA: <strong className="text-gray-800">{item.deliveryEta}</strong>
                  </span>

                  <div className="flex items-center gap-3">
                    {item.canRelease ? (
                      <button
                        onClick={() => handleReleaseFunds(item.dbOrderId, item.orderId, item.formattedAmount)}
                        className="bg-[#0A3918] hover:bg-[#062610] text-white px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                      >
                        <Unlock size={14} /> Release Payment Early
                      </button>
                    ) : (
                      <span className="text-gray-400 text-[11px] font-medium flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full">
                        <Lock size={12} /> Awaiting Quality Sign-off
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
