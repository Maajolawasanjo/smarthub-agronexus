"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  Check,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowRight,
  User,
  MapPin,
  Calendar,
} from "lucide-react";
import { OrdersPageDTO, OrderSummaryItemDTO } from "@/dto";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "ALL", label: "All Orders" },
  { id: "PENDING", label: "Awaiting Acceptance" },
  { id: "CONFIRMED", label: "Accepted / Preparing" },
  { id: "PROCESSING", label: "Processing & Packaging" },
  { id: "IN_TRANSIT", label: "In Transit" },
  { id: "DELIVERED", label: "Delivered & Settled" },
];

export default function FarmerOrdersPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("ALL");
  const [dto, setDto] = useState<OrdersPageDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = activeTab === "ALL" ? "/api/orders" : `/api/orders?status=${activeTab}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch incoming farmer orders.");
      }
      const data: OrdersPageDTO = await res.json();
      setDto(data);
    } catch (err: any) {
      setError(err.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to update order status.");
      }

      toast(`Order status updated to ${nextStatus}!`, "success");
      await fetchOrders();
    } catch (err: any) {
      toast(err.message || "Status transition error.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const orders = dto?.orders || [];
  const filteredOrders = orders.filter((o) =>
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.buyerName.toLowerCase().includes(search.toLowerCase()) ||
    o.primaryProductName.toLowerCase().includes(search.toLowerCase())
  );

  const getNextStatusAction = (status: string) => {
    switch (status) {
      case "PENDING":
        return { next: "CONFIRMED", label: "Accept Order", icon: CheckCircle2, bg: "bg-green-600 hover:bg-green-700" };
      case "CONFIRMED":
        return { next: "PROCESSING", label: "Start Processing", icon: Package, bg: "bg-blue-600 hover:bg-blue-700" };
      case "PROCESSING":
        return { next: "READY_FOR_PICKUP", label: "Ready For Logistics", icon: Clock, bg: "bg-purple-600 hover:bg-purple-700" };
      case "READY_FOR_PICKUP":
        return { next: "IN_TRANSIT", label: "Mark Dispatched", icon: Truck, bg: "bg-indigo-600 hover:bg-indigo-700" };
      case "IN_TRANSIT":
        return { next: "DELIVERED", label: "Mark Delivered", icon: Check, bg: "bg-emerald-600 hover:bg-emerald-700" };
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 font-sans space-y-6">
      {/* Header Banner */}
      <div className="bg-[#1B4D28] text-white rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl shadow-green-950/20">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-green-300">
            PRODUCER FULFILLMENT CENTER
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
            Incoming Produce Orders
          </h1>
          <p className="text-xs text-green-100/80 font-serif italic mt-0.5">
            Accept buyer purchases, trigger inventory reservations, and manage fulfillment stages.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 self-start md:self-center cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Orders
        </button>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                isActive
                  ? "bg-[#1B4D28] text-white shadow-md shadow-green-900/10"
                  : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Orders List Container */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50 pb-4">
          <p className="text-xs text-gray-500 font-semibold">
            Showing {filteredOrders.length} incoming orders
          </p>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order #, buyer, produce..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-800 focus:outline-none focus:border-[#1B4D28]"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs text-gray-400 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#1B4D28]/20 border-t-[#1B4D28] rounded-full animate-spin mb-3" />
            <p className="font-semibold text-gray-600">Loading incoming orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center text-xs text-gray-400">
            No orders found matching selected tab or search criteria.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const action = getNextStatusAction(order.status);
              const ActionIcon = action?.icon;
              const isUpdating = updatingId === order.id;

              return (
                <div
                  key={order.id}
                  className="p-5 border border-gray-100 rounded-2xl bg-white hover:border-gray-200 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-gray-900">{order.orderNumber}</span>
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          order.status === "PENDING"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : order.status === "CONFIRMED" || order.status === "PROCESSING"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : order.status === "IN_TRANSIT"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : order.status === "DELIVERED" || order.status === "COMPLETED"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        )}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1 font-semibold text-gray-800">
                        <Package size={14} className="text-[#1B4D28]" /> {order.primaryProductName} ({order.itemCount} items)
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={14} className="text-gray-400" /> Buyer: <strong className="text-gray-700">{order.buyerName}</strong>
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar size={14} className="text-gray-400" /> {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-gray-50">
                    <div className="text-left md:text-right">
                      <p className="text-[10px] text-gray-400 font-mono uppercase">Order Total</p>
                      <p className="text-base font-bold text-gray-900">
                        ₦{order.totalAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    {action && ActionIcon && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, action.next)}
                        disabled={isUpdating}
                        className={cn(
                          "px-5 py-2.5 rounded-full text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50",
                          action.bg
                        )}
                      >
                        <ActionIcon size={14} />
                        {isUpdating ? "Updating..." : action.label}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
