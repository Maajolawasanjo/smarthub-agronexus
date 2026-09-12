"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  Package,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { ProductDTO } from "@/dto";
import { cn } from "@/lib/utils";

export default function EditProducePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [product, setProduct] = useState<ProductDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);

  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [stockQty, setStockQty] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error("Could not load produce details.");
        const data: ProductDTO = await res.json();
        setProduct(data);
        setName(data.name);
        setPrice(data.price);
        setStockQty(data.inventory?.availableQty ?? 0);
        setDescription(data.description || "");
        setIsAvailable(data.isAvailable);
      } catch (err: any) {
        toast(err.message || "Failed to load produce.", "error");
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id, toast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price: Number(price),
          availableQty: Number(stockQty),
          description,
          isAvailable: product?.status === "APPROVED" ? isAvailable : false,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update produce.");
      }

      toast("Produce details updated successfully!", "success");
      router.push(`/farmer/produce/${id}`);
    } catch (err: any) {
      toast(err.message || "Save failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResubmit = async () => {
    setResubmitting(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price: Number(price),
          availableQty: Number(stockQty),
          description,
          resubmitForApproval: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to resubmit produce.");
      }

      toast("Listing resubmitted for Admin Quality Review!", "success");
      router.push(`/farmer/produce/${id}`);
    } catch (err: any) {
      toast(err.message || "Resubmission failed.", "error");
    } finally {
      setResubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto pb-12 flex flex-col items-center justify-center min-h-[60vh] font-sans">
        <div className="w-8 h-8 border-4 border-[#1B4D28]/20 border-t-[#1B4D28] rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading produce listing specifications...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto pb-12 font-sans text-center py-16">
        <Package size={44} className="mx-auto text-gray-300 mb-2" />
        <h1 className="text-xl font-bold text-gray-800">Produce Not Found</h1>
        <Link href="/farmer/listings" className="text-xs text-[#1B4D28] font-bold underline mt-3 inline-block">
          Return to My Listings
        </Link>
      </div>
    );
  }

  const isApproved = product.status === "APPROVED";
  const isRejected = product.status === "REJECTED";

  return (
    <div className="max-w-4xl mx-auto pb-12 font-sans space-y-6">
      <div>
        <Link
          href={`/farmer/produce/${id}`}
          className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors mb-4 w-fit"
        >
          <ChevronLeft size={16} /> Back to Produce Details
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-[#1B4D28] text-white rounded-[28px] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl shadow-green-950/20">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-green-300">
            COMMODITY BATCH MANAGEMENT
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
            Edit Produce Specifications
          </h1>
          <p className="text-xs text-green-100/80 mt-0.5">
            Update contract asking prices, stock quantities, and quality descriptions.
          </p>
        </div>

        <span
          className={cn(
            "px-3 py-1 rounded-full text-xs font-bold self-start md:self-auto uppercase tracking-wider",
            isApproved
              ? "bg-green-400/20 text-green-200 border border-green-400/30"
              : isRejected
              ? "bg-red-500/20 text-red-200 border border-red-500/30"
              : "bg-amber-400/20 text-amber-200 border border-amber-400/30"
          )}
        >
          Status: {product.status?.replace(/_/g, " ") || "UNDER REVIEW"}
        </span>
      </div>

      {/* Rejection Notice & Quick Resubmit */}
      {isRejected && (
        <div className="bg-red-50 border border-red-200 rounded-[24px] p-6 text-red-900 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle size={22} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-red-900">Moderation Rejection Reason</p>
              <p className="text-xs text-red-700 mt-1 leading-relaxed">
                {product.rejectionReason || "This produce listing did not pass quality review standards. Please update your specifications."}
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-red-200/60 flex items-center justify-between flex-wrap gap-2">
            <p className="text-[11px] text-red-600 font-medium">
              After adjusting your details below, click "Resubmit for Review" to re-enter the moderation queue.
            </p>
            <button
              type="button"
              onClick={handleResubmit}
              disabled={resubmitting}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RotateCcw size={14} className={resubmitting ? "animate-spin" : ""} />
              <span>{resubmitting ? "Resubmitting..." : "Resubmit for Review"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Form */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Produce Title
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#1B4D28]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Contract Asking Price (₦ / {product.unit})
              </label>
              <input
                type="number"
                required
                min={1}
                step="any"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#1B4D28]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Available Stock Quantity ({product.unit}s)
              </label>
              <input
                type="number"
                required
                min={0}
                value={stockQty}
                onChange={(e) => setStockQty(parseInt(e.target.value) || 0)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#1B4D28]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Batch Description & Harvest Notes
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 focus:outline-none focus:border-[#1B4D28] leading-relaxed"
            />
          </div>

          {/* Availability Toggle */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-800">Public Marketplace Availability</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {isApproved
                  ? "When active, buyers can discover and purchase this produce."
                  : "Listing must be APPROVED by moderation before activation is allowed."}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAvailable}
                disabled={!isApproved}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B4D28] disabled:opacity-50"></div>
            </label>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Link
              href={`/farmer/produce/${id}`}
              className="px-6 py-3 border border-gray-200 hover:bg-gray-50 rounded-full text-xs font-bold text-gray-600 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-[#1B4D28] hover:bg-[#153b1e] text-white rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save size={14} />
              <span>{saving ? "Saving Changes..." : "Save Produce Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
