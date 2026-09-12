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
  Layers,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface SellerSubOrder {
  id: string;
  sellerOrderNumber: string;
  subtotal: number;
  status: string;
  createdAt: string;
  order: {
    orderNumber: string;
    buyer?: {
      user?: {
        fullName?: string;
        email?: string;
        phoneNumber?: string;
      };
    };
    shippingAddress?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
    } | null;
    delivery?: {
      deliveryAddress?: string;
      trackingNumber?: string;
    } | null;
    payment?: {
      paymentMethod?: string;
      paymentStatus?: string;
    } | null;
  };
  orderItems: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    product: {
      id: string;
      name: string;
      unit: string;
      images?: Array<{ imageUrl: string }>;
    };
  }>;
}

const TABS = [
  { id: "ALL", label: "All Sub-Orders" },
  { id: "PENDING", label: "Awaiting Acceptance" },
  { id: "CONFIRMED", label: "Accepted & Preparing" },
  { id: "PROCESSING", label: "Packaging" },
  { id: "READY_FOR_PICKUP", label: "Ready for Pickup" },
  { id: "IN_TRANSIT", label: "In Transit" },
  { id: "DELIVERED", label: "Delivered & Settled" },
];

export default function FarmerOrdersPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("ALL");
  const [subOrders, setSubOrders] = useState<SellerSubOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = activeTab === "ALL" ? "/api/farmer/sub-orders" : `/api/farmer/sub-orders?status=${activeTab}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch incoming farmer seller orders.");
      }
      const data = await res.json();
      const list = data?.data?.subOrders || data?.subOrders || [];
      setSubOrders(list);
    } catch (err: any) {
      setError(err.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (subOrderId: string, nextStatus: string) => {
    setUpdatingId(subOrderId);
    try {
      const res = await fetch(`/api/farmer/sub-orders/${subOrderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || json.error || "Failed to update sub-order status.");
      }

      toast(`Sub-order status transitioned to ${nextStatus}!`, "success");
      await fetchOrders();
    } catch (err: any) {
      toast(err.message || "Status transition error.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = subOrders.filter((so) => {
    const s = search.toLowerCase();
    const buyerName = so.order?.buyer?.user?.fullName?.toLowerCase() || "";
    const primaryProd = so.orderItems?.[0]?.product?.name?.toLowerCase() || "";
    return (
      so.sellerOrderNumber.toLowerCase().includes(s) ||
      so.order?.orderNumber.toLowerCase().includes(s) ||
      buyerName.includes(s) ||
      primaryProd.includes(s)
    );
  });

  const getNextStatusAction = (status: string) => {
    switch (status) {
      case "PENDING":
        return { next: "CONFIRMED", label: "Accept Order", icon: CheckCircle2, bg: "bg-green-600 hover:bg-green-700" };
      case "CONFIRMED":
        return { next: "PROCESSING", label: "Begin Packaging", icon: Package, bg: "bg-blue-600 hover:bg-blue-700" };
      case "PROCESSING":
        return { next: "READY_FOR_PICKUP", label: "Ready for Pickup", icon: Clock, bg: "bg-purple-600 hover:bg-purple-700" };
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
            {filteredOrders.map((so) => {
              const action = getNextStatusAction(so.status);
              const ActionIcon = action?.icon;
              const isUpdating = updatingId === so.id;
              const buyerName = so.order?.buyer?.user?.fullName || "Verified Buyer";
              const buyerPhone = so.order?.buyer?.user?.phoneNumber || so.order?.buyer?.user?.email || "";
              const deliveryDest = so.order?.shippingAddress
                ? `${so.order.shippingAddress.street || ""}, ${so.order.shippingAddress.city || ""} (${so.order.shippingAddress.state || ""})`
                : so.order?.delivery?.deliveryAddress || "Standard Hub Delivery";

              return (
                <div
                  key={so.id}
                  className="p-5 border border-gray-100 rounded-2xl bg-white hover:border-gray-200 transition-all flex flex-col gap-4 shadow-xs"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-gray-50 pb-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono font-bold text-sm text-[#1B4D28] bg-green-50 px-2.5 py-1 rounded-lg border border-green-200">
                        {so.sellerOrderNumber}
                      </span>
                      <span className="text-[11px] text-gray-400 font-mono">
                        (Order: {so.order?.orderNumber})
                      </span>
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          so.status === "PENDING"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : so.status === "CONFIRMED" || so.status === "PROCESSING"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : so.status === "READY_FOR_PICKUP"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : so.status === "IN_TRANSIT"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : so.status === "DELIVERED" || so.status === "COMPLETED"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        )}
                      >
                        {so.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto">
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-mono uppercase">Farmer Allocation</p>
                        <p className="text-base font-extrabold text-gray-900">
                          ₦{so.subtotal.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      {action && ActionIcon && (
                        <button
                          onClick={() => handleUpdateStatus(so.id, action.next)}
                          disabled={isUpdating}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50",
                            action.bg
                          )}
                        >
                          <ActionIcon size={14} />
                          {isUpdating ? "Updating..." : action.label}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Line Items List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Commodities to Fulfill</p>
                      {so.orderItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-2.5 text-xs bg-gray-50/70 p-2 rounded-xl border border-gray-100">
                          <div className="w-8 h-8 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {item.product?.images?.[0]?.imageUrl ? (
                              <img src={item.product.images[0].imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package size={14} className="text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800 truncate">{item.product.name}</p>
                            <p className="text-[10px] text-gray-500">
                              {item.quantity} {item.product.unit || "units"} @ ₦{item.unitPrice.toLocaleString()}
                            </p>
                          </div>
                          <span className="font-bold text-gray-900 text-xs">
                            ₦{item.subtotal.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Buyer & Logistics Info */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Buyer & Delivery Info</p>
                      <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100 space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-gray-800 font-semibold">
                          <User size={13} className="text-[#1B4D28]" />
                          <span>{buyerName}</span>
                          {buyerPhone && <span className="text-[11px] text-gray-400">({buyerPhone})</span>}
                        </div>
                        <div className="flex items-start gap-1.5 text-gray-600">
                          <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
                          <span className="text-[11px] leading-relaxed">{deliveryDest}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400 text-[11px] pt-1">
                          <Calendar size={12} />
                          <span>Created {new Date(so.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                      </div>
                    </div>
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
