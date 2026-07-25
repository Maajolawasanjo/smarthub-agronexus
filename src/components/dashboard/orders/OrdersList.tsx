"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { CheckCircle2 } from "lucide-react";

interface Order {
  id: string;
  date: string;
  status: "Pending" | "In Transit" | "Delivered" | "Canceled";
  rawStatus: string;
  total: string;
  rawId: string;
}

const tabs = ["All Orders", "Active Orders", "Pending Orders", "Cancel Orders"];

interface OrdersListProps {
  searchQuery: string;
}

export function OrdersList({ searchQuery }: OrdersListProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("All Orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [releasingId, setReleasingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.orders) {
        const mapped: Order[] = data.orders.map((o: any) => {
          const rawStatus = o.status;
          let statusDisplay: Order["status"] = "Pending";
          if (rawStatus === "CANCELLED") statusDisplay = "Canceled";
          else if (rawStatus === "COMPLETED" || rawStatus === "DELIVERED") statusDisplay = "Delivered";
          else if (rawStatus === "IN_TRANSIT" || rawStatus === "READY_FOR_PICKUP") statusDisplay = "In Transit";

          return {
            id: o.orderNumber,
            date: new Date(o.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" }),
            status: statusDisplay,
            rawStatus,
            total: `₦${Number(o.totalAmount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
            rawId: o.id,
          };
        });
        setOrders(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (rawId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to cancel order ${orderNumber}? Locked funds will be instantly refunded to your wallet.`)) {
      return;
    }

    setCancellingId(rawId);
    try {
      const res = await fetch(`/api/orders/${rawId}/cancel`, {
        method: "POST",
      });
      const json = await res.json();

      if (json.success) {
        toast(`Order ${orderNumber} cancelled! Refund credited to wallet.`, "success");
        fetchOrders();
      } else {
        toast(json.error?.message || "Failed to cancel order", "error");
      }
    } catch (err) {
      toast("Network error cancelling order", "error");
    } finally {
      setCancellingId(null);
    }
  };

  const handleReleaseEscrow = async (rawId: string, orderNumber: string) => {
    if (!confirm(`Confirm receipt of goods for order ${orderNumber}? Escrow funds will be released to the farmer wallet.`)) {
      return;
    }

    setReleasingId(rawId);
    try {
      const res = await fetch(`/api/orders/${rawId}/release-escrow`, {
        method: "POST",
      });
      const json = await res.json();

      if (json.success) {
        toast(`Delivery confirmed! Escrow funds released to farmer for ${orderNumber}.`, "success");
        fetchOrders();
      } else {
        toast(json.error?.message || "Failed to release escrow", "error");
      }
    } catch (err) {
      toast("Network error releasing escrow", "error");
    } finally {
      setReleasingId(null);
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "Pending":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "In Transit":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "Delivered":
        return "bg-green-50 text-green-700 border border-green-200";
      case "Canceled":
        return "bg-red-50 text-red-700 border border-red-200";
      default:
        return "bg-gray-50 text-gray-600";
    }
  };

  const filteredOrders = orders.filter((order) => {
    let matchesTab = true;
    if (activeTab === "Pending Orders") matchesTab = order.status === "Pending";
    else if (activeTab === "Cancel Orders") matchesTab = order.status === "Canceled";
    else if (activeTab === "Active Orders") matchesTab = ["Pending", "In Transit", "Delivered"].includes(order.status);

    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.total.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.date.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 font-sans">
      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-gray-100 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap cursor-pointer ${
              activeTab === tab ? "text-gray-900 font-bold" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#1B4D28] rounded-full" />}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 text-xs font-bold uppercase border-b border-gray-100">
              <th className="pb-4 pl-4">Order ID</th>
              <th className="pb-4">Date</th>
              <th className="pb-4">Status</th>
              <th className="pb-4">Total Amount (₦)</th>
              <th className="pb-4 text-right pr-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-gray-400">
                  Loading orders...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-gray-400">
                  No orders found.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.rawId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 pl-4 text-gray-900 font-bold">
                    <Link href={`/dashboard/tracking?orderId=${order.rawId}`} className="hover:text-[#1B4D28] transition-colors">
                      {order.id}
                    </Link>
                  </td>
                  <td className="py-4 text-gray-600 text-sm">{order.date}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 text-gray-900 font-mono font-bold text-sm">{order.total}</td>
                  <td className="py-4 text-right pr-4 flex items-center justify-end gap-2">
                    <a
                      href={`/api/orders/${order.rawId}/print`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-700 hover:text-[#1B4D28] font-semibold px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-all"
                      title="Print / Save PDF Invoice"
                    >
                      Invoice PDF
                    </a>

                    {order.status === "Pending" && (
                      <button
                        onClick={() => handleCancelOrder(order.rawId, order.id)}
                        disabled={cancellingId === order.rawId}
                        className="text-xs text-rose-600 hover:text-rose-800 font-bold px-3 py-1.5 rounded-full border border-rose-200 hover:bg-rose-50 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {cancellingId === order.rawId ? "Cancelling..." : "Cancel & Refund"}
                      </button>
                    )}

                    {(order.status === "In Transit" || order.rawStatus === "IN_TRANSIT" || order.rawStatus === "DELIVERED") && order.rawStatus !== "COMPLETED" && (
                      <button
                        onClick={() => handleReleaseEscrow(order.rawId, order.id)}
                        disabled={releasingId === order.rawId}
                        className="text-xs bg-[#1B4D28] text-white hover:bg-[#143d20] font-bold px-3 py-1.5 rounded-full shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        <CheckCircle2 size={13} />
                        {releasingId === order.rawId ? "Releasing..." : "Confirm Delivery"}
                      </button>
                    )}

                    {order.rawStatus === "COMPLETED" && (
                      <span className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={12} /> Escrow Released
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
