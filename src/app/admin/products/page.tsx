"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
    Download, Plus, Check, X, ArrowRight, Eye, CheckCircle2, 
    ShieldCheck, RefreshCw, Trash2, PauseCircle, PlayCircle, 
    User, Phone, Mail, MapPin, Package, AlertTriangle, ExternalLink 
} from "lucide-react";
import Image from "next/image";

export default function AdminProductsPage() {
    const [listings, setListings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("All Listings");
    const [filterFarmerId, setFilterFarmerId] = useState<string | null>(null);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedCrop, setSelectedCrop] = useState<any>(null);
    const [selectedFarmer, setSelectedFarmer] = useState<any>(null);
    const [toastMessage, setToastMessage] = useState("");
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Form inputs for Add modal
    const [cropName, setCropName] = useState("");
    const [farmerName, setFarmerName] = useState("");
    const [cropPrice, setCropPrice] = useState("");
    const [cropMoisture, setCropMoisture] = useState("10%");
    const [cropOrigin, setCropOrigin] = useState("Kano, Nigeria");

    const triggerToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage("");
        }, 3500);
    };

    const fetchSubmissions = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/products");
            if (!res.ok) {
                console.warn("Failed to fetch admin products status:", res.status);
                setIsLoading(false);
                return;
            }
            const data = await res.json();
            const list = data.products || data.produce || [];
            const mapped = list.map((p: any) => {
                let displayStatus = "Pending";
                if (p.status === "APPROVED") displayStatus = "Approved";
                else if (p.status === "SUSPENDED") displayStatus = "Suspended";
                else if (p.status === "REJECTED") displayStatus = "Rejected";
                else if (p.status === "ARCHIVED") displayStatus = "Archived";
                else if (p.isAvailable) displayStatus = "Approved";

                return {
                    id: p.id,
                    shortId: p.id.slice(-6).toUpperCase(),
                    product: p.name,
                    description: p.description || "Freshly harvested certified Nigerian export commodity.",
                    farmer: p.farmerProfile?.user?.fullName || p.farmerProfile?.farmName || "Verified Producer",
                    farmName: p.farmerProfile?.farmName || "Certified Producer Cluster",
                    farmerEmail: p.farmerProfile?.user?.email || "N/A",
                    farmerPhone: p.farmerProfile?.user?.phoneNumber || "+234 800 000 0000",
                    farmerProfile: p.farmerProfile,
                    farmerProfileId: p.farmerProfileId,
                    status: displayStatus,
                    rawStatus: p.status,
                    isAvailable: p.isAvailable,
                    priceRaw: parseFloat(p.price) || 0,
                    price: `₦${parseFloat(p.price).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
                    unit: p.unit || "KG",
                    availableQty: p.inventory?.availableQty ?? 0,
                    category: p.category?.name || "General Commodities",
                    imageUrl: p.images?.[0]?.imageUrl || "/agrochain-farmers.png",
                    moisture: "8.5%",
                    origin: `${p.farmState || p.farmerProfile?.state || "Taraba"}${p.farmLga ? `, ${p.farmLga}` : ""}, Nigeria`,
                    farmCommunity: p.farmCommunity || "",
                    grade: p.grade || "Grade A (Export Certified)",
                    condition: p.condition || "Freshly Harvested",
                    packaging: p.packaging || "Standard Bags",
                    packageSize: p.packageSize || "50kg",
                    moq: p.moq || 1,
                    storageCondition: p.storageCondition || "Ambient Store",
                    storageNotes: p.storageNotes || "",
                    harvestDate: p.harvestDate ? new Date(p.harvestDate).toLocaleDateString("en-GB") : "N/A",
                    organic: p.grade || "Certified Grade A",
                    certificate: "CERT-9018",
                    createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-GB") : "Recent",
                    rawProduct: p,
                };
            });
            setListings(mapped);
        } catch (err) {
            console.error("Fetch submissions error:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSubmissions();
        const interval = setInterval(fetchSubmissions, 10000);
        return () => clearInterval(interval);
    }, [fetchSubmissions]);

    // ─── MODERATION ACTIONS ───
    const handleApprove = async (id: string) => {
        setIsActionLoading(true);
        try {
            const res = await fetch(`/api/admin/products/${id}/approve`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "APPROVE", isApproved: true }),
            });
            if (res.ok) {
                triggerToast(`Listing approved and published live to showroom!`);
                await fetchSubmissions();
                if (selectedCrop?.id === id) setSelectedCrop(null);
            } else {
                triggerToast("Failed to approve listing.");
            }
        } catch (err) {
            console.error("Approve error:", err);
            triggerToast("Error communicating with server.");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleSuspend = async (id: string, reason?: string) => {
        setIsActionLoading(true);
        try {
            const res = await fetch(`/api/admin/products/${id}/approve`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "SUSPEND", reason: reason || "Quality audit suspension by administrator." }),
            });
            if (res.ok) {
                triggerToast(`Listing suspended and withdrawn from showroom.`);
                await fetchSubmissions();
                if (selectedCrop?.id === id) setSelectedCrop(null);
            } else {
                triggerToast("Failed to suspend listing.");
            }
        } catch (err) {
            console.error("Suspend error:", err);
            triggerToast("Error communicating with server.");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleReinstate = async (id: string) => {
        setIsActionLoading(true);
        try {
            const res = await fetch(`/api/admin/products/${id}/approve`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "REINSTATE" }),
            });
            if (res.ok) {
                triggerToast(`Listing reinstated and restored to active showroom!`);
                await fetchSubmissions();
                if (selectedCrop?.id === id) setSelectedCrop(null);
            } else {
                triggerToast("Failed to reinstate listing.");
            }
        } catch (err) {
            console.error("Reinstate error:", err);
            triggerToast("Error communicating with server.");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleReject = async (id: string, reason?: string) => {
        setIsActionLoading(true);
        try {
            const res = await fetch(`/api/admin/products/${id}/approve`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "REJECT", isApproved: false, rejectionReason: reason || "Listing did not meet quality standards." }),
            });
            if (res.ok) {
                triggerToast(`Listing rejected.`);
                await fetchSubmissions();
                if (selectedCrop?.id === id) setSelectedCrop(null);
            } else {
                triggerToast("Failed to reject listing.");
            }
        } catch (err) {
            console.error("Reject error:", err);
            triggerToast("Error communicating with server.");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete or archive "${name}"? This action cannot be undone.`)) {
            return;
        }
        setIsActionLoading(true);
        try {
            const res = await fetch(`/api/admin/products/${id}/approve`, {
                method: "DELETE",
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                triggerToast(data.message || `Listing "${name}" successfully deleted/archived.`);
                await fetchSubmissions();
                if (selectedCrop?.id === id) setSelectedCrop(null);
            } else {
                triggerToast(data.error || "Failed to delete listing.");
            }
        } catch (err) {
            console.error("Delete error:", err);
            triggerToast("Error communicating with server.");
        } finally {
            setIsActionLoading(false);
        }
    };

    // Export listings to CSV
    const handleExport = () => {
        if (!listings || listings.length === 0) {
            triggerToast("No listings available to export.");
            return;
        }
        const headers = ["ID", "Product", "Farmer", "Farm Name", "Farmer Email", "Status", "Available Qty", "Unit", "Price", "Origin"];
        const rows = listings.map(l => [
            `"${l.id}"`,
            `"${(l.product || '').replace(/"/g, '""')}"`,
            `"${(l.farmer || '').replace(/"/g, '""')}"`,
            `"${(l.farmName || '').replace(/"/g, '""')}"`,
            `"${(l.farmerEmail || '').replace(/"/g, '""')}"`,
            `"${l.status || ''}"`,
            `"${l.availableQty || 0}"`,
            `"${l.unit || 'KG'}"`,
            `"${(l.price || '').replace(/"/g, '""')}"`,
            `"${(l.origin || '').replace(/"/g, '""')}"`
        ]);
        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `marketplace_products_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        triggerToast("Product listings exported to CSV successfully!");
    };

    // Filter logic
    const filteredListings = listings.filter(item => {
        if (filterFarmerId && item.farmerProfileId !== filterFarmerId) return false;
        if (activeTab === "Live / Approved") return item.status === "Approved";
        if (activeTab === "Pending Review") return item.status === "Pending";
        if (activeTab === "Suspended") return item.status === "Suspended";
        if (activeTab === "Rejected") return item.status === "Rejected";
        return true;
    });

    const activeFarmerInfo = filterFarmerId ? listings.find(l => l.farmerProfileId === filterFarmerId) : null;

    return (
        <div className="space-y-6 animate-fadeIn font-sans pb-12">
            {/* Toast alert */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 bg-[#1B4D28] text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-[#2C5E39] animate-slideIn">
                    <CheckCircle2 size={20} className="text-[#4CAF50] flex-shrink-0" />
                    <span className="text-sm font-semibold">{toastMessage}</span>
                </div>
            )}

            {/* Header row */}
            <div className="-mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Produce Moderation & Catalog Control</h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        Inspect commodities, review farmer profiles, suspend listings, or safe-delete produce
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchSubmissions}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-gray-100 text-gray-700 text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-200 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-gray-100 text-gray-700 text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-200 shadow-sm transition-colors cursor-pointer"
                    >
                        <Download size={14} />
                        Export
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-[#1B4D28] text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-[#143d20] shadow-sm transition-colors cursor-pointer"
                    >
                        <Plus size={14} />
                        Add Listing
                    </button>
                </div>
            </div>

            {/* Active Farmer Filter Banner */}
            {filterFarmerId && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <User className="text-emerald-700" size={20} />
                        <div>
                            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Filtered By Producer</span>
                            <p className="text-sm font-bold text-emerald-950">
                                {activeFarmerInfo?.farmName || activeFarmerInfo?.farmer || "Selected Farmer"} ({filteredListings.length} commodities)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setFilterFarmerId(null)}
                        className="text-xs font-bold text-emerald-800 bg-white border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                    >
                        Clear Filter
                    </button>
                </div>
            )}

            {/* Banner element */}
            <div className="relative h-44 md:h-48 w-full rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                <Image
                    src="/agrochain-farmers.png"
                    alt="Farmers Working in Agro Field"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent flex items-center px-8">
                    <div className="text-white max-w-md">
                        <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-2">
                            Verified Producer Cluster
                        </span>
                        <h2 className="text-xl md:text-2xl font-black">Quality Assurance & Escrow Registry</h2>
                        <p className="text-xs md:text-sm text-gray-200 mt-1">
                            Commodities listed by verified farmers go live instantly in the showroom. Admin retains full authority to suspend or remove.
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-none gap-6 text-sm font-medium">
                {["All Listings", "Live / Approved", "Pending Review", "Suspended", "Rejected"].map(tab => {
                    const count = listings.filter(item => {
                        if (tab === "Live / Approved") return item.status === "Approved";
                        if (tab === "Pending Review") return item.status === "Pending";
                        if (tab === "Suspended") return item.status === "Suspended";
                        if (tab === "Rejected") return item.status === "Rejected";
                        return true;
                    }).length;

                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3.5 px-1 relative transition-colors font-semibold cursor-pointer flex items-center gap-2 ${
                                activeTab === tab
                                    ? "text-[#1B4D28] border-b-2 border-[#1B4D28]"
                                    : "text-gray-400 hover:text-gray-600"
                            }`}
                        >
                            <span>{tab}</span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                                activeTab === tab ? "bg-[#1B4D28]/10 text-[#1B4D28]" : "bg-gray-100 text-gray-400"
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Responsive Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Produce</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Farmer / Farm</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm font-medium">
                            {filteredListings.length > 0 ? (
                                filteredListings.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        {/* Produce column with thumbnail */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                                                    <Image
                                                        src={item.imageUrl}
                                                        alt={item.product}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <button 
                                                        onClick={() => setSelectedCrop(item)}
                                                        className="font-bold text-gray-900 hover:text-[#1B4D28] text-left transition-colors cursor-pointer block"
                                                    >
                                                        {item.product}
                                                    </button>
                                                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                                        <span>{item.category}</span>
                                                        <span>•</span>
                                                        <span>ID: #{item.shortId}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Farmer column (Clickable to view full Farmer Dossier) */}
                                        <td className="py-4 px-6">
                                            <button
                                                onClick={() => setSelectedFarmer(item.farmerProfile || {
                                                    farmName: item.farmName,
                                                    user: { fullName: item.farmer, email: item.farmerEmail, phoneNumber: item.farmerPhone },
                                                    state: item.origin.split(",")[0],
                                                    verificationStatus: "APPROVED"
                                                })}
                                                className="group text-left cursor-pointer"
                                                title="Click to view full Farmer Dossier"
                                            >
                                                <div className="flex items-center gap-1.5 font-bold text-gray-800 group-hover:text-[#1B4D28] transition-colors">
                                                    <span>{item.farmName}</span>
                                                    <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#1B4D28]" />
                                                </div>
                                                <div className="text-xs text-gray-400 mt-0.5 font-normal">
                                                    {item.farmer} ({item.origin})
                                                </div>
                                            </button>
                                        </td>

                                        {/* Status badge */}
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold tracking-tight border ${
                                                item.status === "Approved"
                                                    ? "bg-green-50 text-green-700 border-green-200"
                                                    : item.status === "Pending"
                                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                                    : item.status === "Suspended"
                                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                                    : item.status === "Archived"
                                                    ? "bg-gray-100 text-gray-600 border-gray-200"
                                                    : "bg-red-50 text-red-600 border-red-200"
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    item.status === "Approved" ? "bg-green-600 animate-pulse" :
                                                    item.status === "Pending" ? "bg-amber-600" :
                                                    item.status === "Suspended" ? "bg-purple-600" :
                                                    item.status === "Archived" ? "bg-gray-400" : "bg-red-600"
                                                }`} />
                                                {item.status}
                                            </span>
                                        </td>

                                        {/* Stock quantity */}
                                        <td className="py-4 px-6 font-semibold text-gray-700">
                                            {item.availableQty} {item.unit}
                                        </td>

                                        {/* Price */}
                                        <td className="py-4 px-6 text-gray-900 font-bold">
                                            {item.price}
                                        </td>

                                        {/* Actions column */}
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {/* Pending controls: Approve or Reject */}
                                                {item.status === "Pending" && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(item.id)}
                                                            disabled={isActionLoading}
                                                            className="p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-sm transition-transform active:scale-95 cursor-pointer"
                                                            title="Approve Listing"
                                                        >
                                                            <Check size={14} strokeWidth={2.5} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(item.id)}
                                                            disabled={isActionLoading}
                                                            className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-sm transition-transform active:scale-95 cursor-pointer"
                                                            title="Reject Listing"
                                                        >
                                                            <X size={14} strokeWidth={2.5} />
                                                        </button>
                                                    </>
                                                )}

                                                {/* Live/Approved controls: Suspend */}
                                                {item.status === "Approved" && (
                                                    <button
                                                        onClick={() => handleSuspend(item.id)}
                                                        disabled={isActionLoading}
                                                        className="p-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 shadow-sm transition-transform active:scale-95 cursor-pointer"
                                                        title="Suspend Listing (Withdraw from Showroom)"
                                                    >
                                                        <PauseCircle size={14} strokeWidth={2} />
                                                    </button>
                                                )}

                                                {/* Suspended controls: Reinstate */}
                                                {item.status === "Suspended" && (
                                                    <button
                                                        onClick={() => handleReinstate(item.id)}
                                                        disabled={isActionLoading}
                                                        className="p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-sm transition-transform active:scale-95 cursor-pointer"
                                                        title="Reinstate Listing (Restore to Showroom)"
                                                    >
                                                        <PlayCircle size={14} strokeWidth={2} />
                                                    </button>
                                                )}

                                                {/* Delete button (Available for all except archived) */}
                                                {item.status !== "Archived" && (
                                                    <button
                                                        onClick={() => handleDelete(item.id, item.product)}
                                                        disabled={isActionLoading}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                                        title="Safe Delete / Archive Listing"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}

                                                {/* View / Inspect details */}
                                                <button
                                                    onClick={() => setSelectedCrop(item)}
                                                    className="flex items-center gap-1 text-xs text-[#1B4D28] font-bold bg-[#1B4D28]/5 hover:bg-[#1B4D28]/10 px-3 py-2 rounded-xl transition-colors cursor-pointer ml-1"
                                                >
                                                    Inspect
                                                    <ArrowRight size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-400 font-semibold">
                                        No product listings match this status filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* ─── MODAL 1: PRODUCT INSPECTION & MODERATION DOSSIER ─── */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {selectedCrop && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between bg-gray-50 px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={20} className="text-[#1B4D28]" />
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base">Commodity Inspection Dossier</h3>
                                    <span className="text-xs text-gray-400">ID: #{selectedCrop.id}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedCrop(null)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5 overflow-y-auto flex-1">
                            {/* Product Header Card */}
                            <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-200 border border-gray-300 flex-shrink-0">
                                    <Image
                                        src={selectedCrop.imageUrl}
                                        alt={selectedCrop.product}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-[#1B4D28] uppercase tracking-wider">{selectedCrop.category}</span>
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                            selectedCrop.status === "Approved" ? "bg-green-50 text-green-700 border-green-200" :
                                            selectedCrop.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                            selectedCrop.status === "Suspended" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                            "bg-red-50 text-red-600 border-red-200"
                                        }`}>
                                            {selectedCrop.status}
                                        </span>
                                    </div>
                                    <h4 className="font-black text-gray-900 text-lg truncate mt-0.5">{selectedCrop.product}</h4>
                                    <p className="text-base font-extrabold text-gray-900 mt-1">
                                        {selectedCrop.price} <span className="text-xs text-gray-400 font-normal">/ {selectedCrop.unit}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                    Commodity Description
                                </label>
                                <p className="text-sm text-gray-700 bg-gray-50/70 p-3 rounded-xl border border-gray-100 leading-relaxed">
                                    {selectedCrop.description}
                                </p>
                            </div>

                            {/* Specifications Grid */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <span className="text-gray-400 font-semibold block">Available Inventory</span>
                                    <span className="text-gray-900 font-bold text-sm mt-0.5 block">
                                        {selectedCrop.availableQty} {selectedCrop.unit}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <span className="text-gray-400 font-semibold block">Quality Grade</span>
                                    <span className="text-green-700 font-bold text-sm mt-0.5 block">
                                        {selectedCrop.grade}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <span className="text-gray-400 font-semibold block">Physical Condition</span>
                                    <span className="text-gray-900 font-bold text-sm mt-0.5 block">
                                        {selectedCrop.condition}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <span className="text-gray-400 font-semibold block">Packaging & Size</span>
                                    <span className="text-gray-900 font-bold text-sm mt-0.5 block truncate">
                                        {selectedCrop.packaging} ({selectedCrop.packageSize})
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <span className="text-gray-400 font-semibold block">Minimum Order (MOQ)</span>
                                    <span className="text-gray-900 font-bold text-sm mt-0.5 block">
                                        {selectedCrop.moq} {selectedCrop.unit}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <span className="text-gray-400 font-semibold block">Harvest Date</span>
                                    <span className="text-gray-900 font-bold text-sm mt-0.5 block">
                                        {selectedCrop.harvestDate}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <span className="text-gray-400 font-semibold block">Harvest Origin</span>
                                    <span className="text-gray-900 font-bold text-sm mt-0.5 block">
                                        {selectedCrop.origin} {selectedCrop.farmCommunity ? `(${selectedCrop.farmCommunity})` : ""}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <span className="text-gray-400 font-semibold block">Storage Method</span>
                                    <span className="text-gray-900 font-bold text-sm mt-0.5 block truncate">
                                        {selectedCrop.storageCondition}
                                    </span>
                                </div>
                            </div>

                            {/* Producer Quick Card (Clickable) */}
                            <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <User size={18} className="text-[#1B4D28]" />
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Supplied By Producer</span>
                                        <span className="text-sm font-bold text-gray-900">{selectedCrop.farmName} ({selectedCrop.farmer})</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedFarmer(selectedCrop.farmerProfile || {
                                            farmName: selectedCrop.farmName,
                                            user: { fullName: selectedCrop.farmer, email: selectedCrop.farmerEmail, phoneNumber: selectedCrop.farmerPhone },
                                            state: selectedCrop.origin.split(",")[0],
                                            verificationStatus: "APPROVED"
                                        });
                                    }}
                                    className="text-xs font-bold text-[#1B4D28] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    View Farmer Dossier
                                    <ArrowRight size={12} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Action Footer */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
                            {/* Delete button */}
                            <button
                                onClick={() => handleDelete(selectedCrop.id, selectedCrop.product)}
                                disabled={isActionLoading}
                                className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-2.5 rounded-xl border border-red-200 transition-colors cursor-pointer"
                            >
                                <Trash2 size={14} />
                                Delete Listing
                            </button>

                            <div className="flex items-center gap-2">
                                {selectedCrop.status === "Approved" && (
                                    <button
                                        onClick={() => handleSuspend(selectedCrop.id)}
                                        disabled={isActionLoading}
                                        className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                                    >
                                        <PauseCircle size={14} />
                                        Suspend Listing
                                    </button>
                                )}

                                {selectedCrop.status === "Suspended" && (
                                    <button
                                        onClick={() => handleReinstate(selectedCrop.id)}
                                        disabled={isActionLoading}
                                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-4 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer"
                                    >
                                        <PlayCircle size={14} />
                                        Reinstate to Showroom
                                    </button>
                                )}

                                {selectedCrop.status === "Pending" && (
                                    <>
                                        <button
                                            onClick={() => handleReject(selectedCrop.id)}
                                            disabled={isActionLoading}
                                            className="text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleApprove(selectedCrop.id)}
                                            disabled={isActionLoading}
                                            className="text-xs font-bold text-white bg-[#1B4D28] hover:bg-[#143d20] px-5 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer"
                                        >
                                            Approve & Publish
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* ─── MODAL 2: FARMER PROFILE DOSSIER (CLICKABLE PRODUCER) ─── */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {selectedFarmer && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-scaleIn">
                        {/* Header */}
                        <div className="flex items-center justify-between bg-gradient-to-r from-[#1B4D28] to-[#256c38] px-6 py-5 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-lg">
                                    {(selectedFarmer.farmName || selectedFarmer.user?.fullName || "F")[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-snug">
                                        {selectedFarmer.farmName || "Verified Farm"}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-xs text-white/80 mt-0.5">
                                        <ShieldCheck size={14} className="text-emerald-300" />
                                        <span>Verified Producer Cluster</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedFarmer(null)}
                                className="text-white/80 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Farmer Details Content */}
                        <div className="p-6 space-y-4 text-sm">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Farmer Name</span>
                                    <span className="font-bold text-gray-900">
                                        {selectedFarmer.user?.fullName || "Registered Farmer"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</span>
                                    <a 
                                        href={`mailto:${selectedFarmer.user?.email}`}
                                        className="font-semibold text-[#1B4D28] hover:underline flex items-center gap-1"
                                    >
                                        <Mail size={13} />
                                        {selectedFarmer.user?.email || "N/A"}
                                    </a>
                                </div>
                                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone Number</span>
                                    <a 
                                        href={`tel:${selectedFarmer.user?.phoneNumber}`}
                                        className="font-semibold text-gray-800 flex items-center gap-1"
                                    >
                                        <Phone size={13} />
                                        {selectedFarmer.user?.phoneNumber || "+234 800 000 0000"}
                                    </a>
                                </div>
                                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location Origin</span>
                                    <span className="font-bold text-gray-800 flex items-center gap-1">
                                        <MapPin size={13} />
                                        {selectedFarmer.lga ? `${selectedFarmer.lga}, ` : ""}{selectedFarmer.state || "Nigeria"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Farm Address</span>
                                    <span className="font-semibold text-gray-700 text-right max-w-[200px] truncate">
                                        {selectedFarmer.farmAddress || "Agricultural Production Zone"}
                                    </span>
                                </div>
                            </div>

                            {/* Bio / Description if present */}
                            {selectedFarmer.farmDescription && (
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                        Farm Overview
                                    </span>
                                    <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed">
                                        {selectedFarmer.farmDescription}
                                    </p>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3 text-center">
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <span className="text-xs text-gray-400 block font-semibold">Total Commodities</span>
                                    <span className="text-base font-black text-gray-900 mt-0.5 block">
                                        {selectedFarmer._count?.products ?? 
                                         listings.filter(l => l.farmerProfileId === selectedFarmer.id || l.farmerEmail === selectedFarmer.user?.email).length} Listed
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <span className="text-xs text-gray-400 block font-semibold">Verification</span>
                                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full inline-block mt-1">
                                        {selectedFarmer.verificationStatus || "APPROVED"}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2 flex gap-3">
                                <button
                                    onClick={() => {
                                        setFilterFarmerId(selectedFarmer.id || null);
                                        setSelectedFarmer(null);
                                    }}
                                    className="flex-1 bg-[#1B4D28] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#143d20] shadow-sm transition-colors cursor-pointer text-center"
                                >
                                    Filter Listings By This Farmer
                                </button>
                                <button
                                    onClick={() => setSelectedFarmer(null)}
                                    className="text-xs font-bold text-gray-500 hover:bg-gray-100 border border-gray-200 px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* ─── MODAL 3: ADD NEW LISTING (MANUAL ENTRY) ─── */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-scaleIn">
                        <div className="flex items-center justify-between bg-gray-50 px-6 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800 text-base">Register Produce Listing</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!cropName || !cropPrice) return;
                            const cleanPrice = parseFloat(cropPrice.replace(/[^0-9.]/g, "")) || 0;
                            try {
                                const res = await fetch("/api/farmer/produce", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        name: cropName,
                                        farmerName: farmerName || "Verified Producer",
                                        price: cleanPrice,
                                        unit: "KG",
                                        stockQuantity: 100,
                                        description: `Verified ${cropName} harvested from ${cropOrigin}`,
                                    }),
                                });
                                if (res.ok) {
                                    setShowAddModal(false);
                                    setCropName("");
                                    setFarmerName("");
                                    setCropPrice("");
                                    triggerToast(`Listing for ${cropName} registered!`);
                                    fetchSubmissions();
                                } else {
                                    const data = await res.json().catch(() => ({}));
                                    triggerToast(data.error || "Failed to register produce.");
                                }
                            } catch (err) {
                                triggerToast("Error submitting produce.");
                            }
                        }} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Commodity Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. White Maize Grain"
                                    value={cropName}
                                    onChange={(e) => setCropName(e.target.value)}
                                    required
                                    className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1B4D28] text-gray-700 font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Farmer / Cluster Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Musa Bello / Northern Agro Cluster"
                                    value={farmerName}
                                    onChange={(e) => setFarmerName(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1B4D28] text-gray-700 font-semibold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Price (₦ per KG)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 450"
                                        value={cropPrice}
                                        onChange={(e) => setCropPrice(e.target.value)}
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1B4D28] text-gray-700 font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Moisture Level
                                    </label>
                                    <input
                                        type="text"
                                        value={cropMoisture}
                                        onChange={(e) => setCropMoisture(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1B4D28] text-gray-700 font-semibold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Harvest Location Origin
                                </label>
                                <input
                                    type="text"
                                    value={cropOrigin}
                                    onChange={(e) => setCropOrigin(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1B4D28] text-gray-700 font-semibold"
                                />
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="text-xs font-bold text-gray-500 hover:bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-[#1B4D28] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#143d20] shadow-sm transition-all cursor-pointer"
                                >
                                    Register Listing
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
