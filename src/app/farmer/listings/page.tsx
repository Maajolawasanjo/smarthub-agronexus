"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Save,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

interface ProduceItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  isAvailable: boolean;
  createdAt: string;
  description: string;
  category?: {
    id: string;
    name: string;
  };
  images?: { id: string; imageUrl: string }[];
  inventory?: {
    availableQty: number;
    reservedQty: number;
  };
}

export default function FarmerListingsPage() {
  const { toast } = useToast();
  const [produce, setProduce] = useState<ProduceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editQty, setEditQty] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [bulkChanges, setBulkChanges] = useState<Record<string, { price?: number; availableQty?: number }>>({});

  const fetchProduce = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/farmer/produce");
      if (res.ok) {
        const data = await res.json();
        setProduce(data.produce || []);
      } else {
        toast("Failed to load produce listings.", "error");
      }
    } catch (err) {
      console.error("Error fetching produce listings", err);
      toast("Network error loading produce listings.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProduce();
  }, [fetchProduce]);

  // Toggle produce availability live
  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });

      if (res.ok) {
        toast(`Produce availability updated to ${!currentStatus ? "ACTIVE" : "PAUSED"}`, "success");
        setProduce((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isAvailable: !currentStatus } : item))
        );
      } else {
        const err = await res.json();
        toast(err.error || "Failed to update availability.", "error");
      }
    } catch (err) {
      toast("Error updating produce status.", "error");
    }
  };

  // Save single item edit inline
  const handleSaveSingleItem = async (item: ProduceItem) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/products/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: editPrice,
          availableQty: editQty,
        }),
      });

      if (res.ok) {
        toast(`Updated ${item.name} stock and pricing!`, "success");
        setEditingId(null);
        setProduce((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? {
                  ...p,
                  price: editPrice,
                  inventory: {
                    availableQty: editQty,
                    reservedQty: p.inventory?.reservedQty || 0,
                  },
                }
              : p
          )
        );
        await fetchProduce();
      } else {
        const json = await res.json();
        toast(json.error || "Failed to save produce update.", "error");
      }
    } catch (err) {
      toast("Network error saving changes.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete produce item
  const handleDeleteProduce = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" listing?`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast(`Deleted ${name} from inventory.`, "success");
        setProduce((prev) => prev.filter((p) => p.id !== id));
      } else {
        const err = await res.json();
        toast(err.error || "Could not delete produce listing.", "error");
      }
    } catch (err) {
      toast("Error deleting listing.", "error");
    }
  };

  const categories = Array.from(new Set(produce.map((p) => p.category?.name).filter(Boolean)));

  const filteredProduce = produce.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.category?.name || "").toLowerCase().includes(search.toLowerCase());

    const matchesCategory = filterCategory === "ALL" || item.category?.name === filterCategory;

    const matchesStatus =
      filterStatus === "ALL" ||
      (filterStatus === "APPROVED" && item.isAvailable) ||
      (filterStatus === "PENDING" && !item.isAvailable) ||
      (filterStatus === "PAUSED" && !item.isAvailable) ||
      (filterStatus === "LOW_STOCK" && (item.inventory?.availableQty ?? 0) <= 20);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalActive = produce.filter((p) => p.isAvailable).length;
  const totalStockQty = produce.reduce((acc, p) => acc + (p.inventory?.availableQty || 0), 0);
  const lowStockCount = produce.filter((p) => (p.inventory?.availableQty || 0) <= 20).length;

  return (
    <div className="max-w-7xl mx-auto pb-12 font-sans space-y-6 px-4 md:px-0">
      {/* Page Header */}
      <div className="bg-[#1B4D28] text-white rounded-[28px] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-green-950/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-green-900/60 border border-green-700/50 text-green-300 px-3 py-1 rounded-full">
              HARVEST INVENTORY & CATALOG
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">
            Produce Listings Control Center
          </h1>
          <p className="text-xs md:text-sm text-green-100/80 mt-1 max-w-xl font-serif italic">
            Manage your harvest listings, adjust wholesale pricing, toggle availability on the Buyer Marketplace, and track stock levels in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchProduce}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Catalog
          </button>
          <Link
            href="/farmer/sell"
            className="bg-white text-[#1B4D28] hover:bg-green-50 px-5 py-2.5 rounded-full text-xs font-extrabold transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
          >
            <Plus size={16} /> Publish New Harvest
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-[22px] border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Produce Listings</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{totalActive} / {produce.length}</p>
            <p className="text-[11px] text-green-600 font-semibold mt-0.5">Live on Buyer Marketplace</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-700 flex items-center justify-center font-bold">
            <Package size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[22px] border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Inventory Stock</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{totalStockQty.toLocaleString()} <span className="text-xs font-semibold text-gray-400">units</span></p>
            <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Across all produce batches</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Layers size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[22px] border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Low Stock Alerts</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{lowStockCount}</p>
            <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Below 20 units threshold</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <AlertCircle size={22} />
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search produce name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-xs md:text-sm font-medium text-gray-800 focus:outline-none focus:border-[#1B4D28]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs font-bold text-gray-700 focus:outline-none focus:border-[#1B4D28]"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs font-bold text-gray-700 focus:outline-none focus:border-[#1B4D28]"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">✅ Approved & Live</option>
              <option value="PENDING">⏳ Pending Admin Inspection</option>
              <option value="PAUSED">Paused Only</option>
              <option value="LOW_STOCK">Low Stock Only</option>
            </select>
          </div>
        </div>

        {/* Produce Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 text-center text-xs text-gray-400 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-[#1B4D28]/20 border-t-[#1B4D28] rounded-full animate-spin mb-3" />
              <p className="font-semibold text-gray-600">Loading produce inventory...</p>
            </div>
          ) : filteredProduce.length === 0 ? (
            <div className="p-16 text-center text-xs text-gray-400 space-y-2">
              <Package size={40} className="mx-auto text-gray-300 mb-2" />
              <p className="font-bold text-gray-700 text-sm">No produce listings found</p>
              <p className="text-gray-400 max-w-sm mx-auto">
                No items match your search or filter parameters. Click "Publish New Harvest" to add produce to your farm inventory.
              </p>
              <Link
                href="/farmer/sell"
                className="inline-flex items-center gap-1 text-[#1B4D28] font-bold text-xs hover:underline mt-2"
              >
                <Plus size={14} /> Add Harvest Stock Now
              </Link>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-4">Produce Detail</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Wholesale Price</th>
                  <th className="py-4 px-4">Available Stock</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProduce.map((item) => {
                  const isEditing = editingId === item.id;
                  const availableQty = item.inventory?.availableQty ?? 0;
                  const reservedQty = item.inventory?.reservedQty ?? 0;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Produce Name & Image */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200 flex items-center justify-center">
                            {item.images && item.images.length > 0 ? (
                              <img
                                src={item.images[0].imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package size={20} className="text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-extrabold text-gray-900">{item.name}</p>
                            <p className="text-[11px] text-gray-400 truncate max-w-xs font-mono">
                              ID: {item.id.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-[11px] font-bold">
                          {item.category?.name || "Uncategorized"}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-gray-500">₦</span>
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 bg-gray-50 border border-gray-300 rounded text-xs font-bold text-gray-900 focus:outline-none"
                            />
                            <span className="text-[10px] text-gray-400 uppercase">/ {item.unit}</span>
                          </div>
                        ) : (
                          <div className="text-sm font-black text-gray-900">
                            ₦{Number(item.price).toLocaleString("en-NG", { minimumFractionDigits: 2 })}{" "}
                            <span className="text-[10px] font-semibold text-gray-400 uppercase">/ {item.unit}</span>
                          </div>
                        )}
                      </td>

                      {/* Available Qty */}
                      <td className="py-4 px-4">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={editQty}
                              onChange={(e) => setEditQty(parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 bg-gray-50 border border-gray-300 rounded text-xs font-bold text-gray-900 focus:outline-none"
                            />
                            <span className="text-[10px] text-gray-400 uppercase">{item.unit}</span>
                          </div>
                        ) : (
                          <div>
                            <span
                              className={cn(
                                "text-sm font-black",
                                availableQty <= 20 ? "text-amber-600" : "text-gray-900"
                              )}
                            >
                              {availableQty.toLocaleString()} {item.unit}
                            </span>
                            {reservedQty > 0 && (
                              <p className="text-[10px] text-blue-600 font-semibold">
                                ({reservedQty} reserved)
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status & Approval Column */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1.5">
                          {item.isAvailable ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-[11px] font-extrabold w-fit shadow-xs">
                              <ShieldCheck size={14} className="text-green-600" />
                              Approved & Live
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-extrabold w-fit shadow-xs" title="Pending Admin Quality Review">
                              <AlertCircle size={14} className="text-amber-600 animate-pulse" />
                              Pending Admin Review
                            </span>
                          )}
                          <button
                            onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                            className="text-[10px] font-bold text-gray-500 hover:text-gray-800 underline transition-colors w-fit"
                          >
                            {item.isAvailable ? "Pause Listing" : "Request Re-Verification"}
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveSingleItem(item)}
                                disabled={isSaving}
                                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                              >
                                <Save size={14} /> {isSaving ? "Saving..." : "Save"}
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition-all"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingId(item.id);
                                  setEditPrice(Number(item.price));
                                  setEditQty(availableQty);
                                }}
                                title="Edit Pricing & Stock"
                                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduce(item.id, item.name)}
                                title="Delete Listing"
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

