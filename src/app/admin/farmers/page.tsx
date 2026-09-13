"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Search,
    RefreshCw,
    ShieldCheck,
    Clock,
    XCircle,
    Eye,
    Phone,
    Mail,
    MapPin,
    Package,
    AlertTriangle,
    ExternalLink,
    Tractor,
    CheckCircle2,
    X,
    Filter,
    Store,
    UserCheck,
    UserX,
    FileText,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface SampleProduct {
    id: string;
    name: string;
    price: number;
    unit: string;
    status: string;
    image: string | null;
    availableQty: number;
}

interface KycDocument {
    id: string;
    documentType: string;
    documentNumber: string | null;
    documentUrl: string;
    reviewedAt: string | null;
    remarks: string | null;
}

interface FarmerItem {
    id: string;
    userId: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    profileImage: string | null;
    isActive: boolean;
    farmName: string;
    farmDescription: string | null;
    farmAddress: string;
    state: string;
    lga: string;
    verificationStatus: "APPROVED" | "PENDING" | "REJECTED";
    hasKycDoc: boolean;
    kycDocument: KycDocument | null;
    totalProducts: number;
    activeProducts: number;
    totalOrders: number;
    totalInventoryQty: number;
    sampleProducts: SampleProduct[];
    createdAt: string;
}

interface Statistics {
    totalFarmers: number;
    verifiedProducers: number;
    pendingVerification: number;
    suspendedAccounts: number;
}

export default function AdminFarmersPage() {
    const [farmers, setFarmers] = useState<FarmerItem[]>([]);
    const [statistics, setStatistics] = useState<Statistics>({
        totalFarmers: 0,
        verifiedProducers: 0,
        pendingVerification: 0,
        suspendedAccounts: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeVerificationFilter, setActiveVerificationFilter] = useState<string>("ALL");
    const [activeStatusFilter, setActiveStatusFilter] = useState<string>("ALL");

    // Modal state
    const [selectedFarmer, setSelectedFarmer] = useState<FarmerItem | null>(null);
    const [fullFarmerDetail, setFullFarmerDetail] = useState<any>(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [activeModalTab, setActiveModalTab] = useState<"profile" | "products" | "kyc">("profile");

    const triggerToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(""), 4000);
    };

    const fetchFarmers = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.set("search", searchQuery);
            if (activeVerificationFilter !== "ALL") params.set("verification", activeVerificationFilter);
            if (activeStatusFilter !== "ALL") params.set("status", activeStatusFilter);

            const res = await fetch(`/api/admin/farmers?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to load farmers");
            const data = await res.json();
            setFarmers(data.farmers || []);
            if (data.statistics) setStatistics(data.statistics);
        } catch (err) {
            console.error("Error fetching farmers:", err);
            triggerToast("Failed to fetch farmers directory.");
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, activeVerificationFilter, activeStatusFilter]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchFarmers();
        }, 300);
        return () => clearTimeout(timeout);
    }, [fetchFarmers]);

    // Fetch deep 360 details when farmer is selected
    const openFarmerDossier = async (farmer: FarmerItem) => {
        setSelectedFarmer(farmer);
        setActiveModalTab("profile");
        setIsDetailLoading(true);
        try {
            const res = await fetch(`/api/admin/farmers/${farmer.id}`);
            if (res.ok) {
                const data = await res.json();
                setFullFarmerDetail(data.farmer);
            } else {
                setFullFarmerDetail(null);
            }
        } catch (err) {
            console.error("Error fetching 360 detail:", err);
            setFullFarmerDetail(null);
        } finally {
            setIsDetailLoading(false);
        }
    };

    // Handle Verification Status mutation
    const handleUpdateVerification = async (farmerId: string, newStatus: "APPROVED" | "PENDING" | "REJECTED") => {
        setIsActionLoading(true);
        try {
            const res = await fetch(`/api/admin/farmers/${farmerId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ verificationStatus: newStatus }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update verification status");
            }

            triggerToast(`Producer badge updated to: ${newStatus}`);
            await fetchFarmers();
            if (selectedFarmer && selectedFarmer.id === farmerId) {
                setSelectedFarmer((prev) => (prev ? { ...prev, verificationStatus: newStatus } : null));
                if (fullFarmerDetail) {
                    setFullFarmerDetail((prev: any) => ({ ...prev, verificationStatus: newStatus }));
                }
            }
        } catch (err: any) {
            alert(err.message || "Failed to update verification status");
        } finally {
            setIsActionLoading(false);
        }
    };

    // Handle Suspension / Activation mutation
    const handleToggleAccountStatus = async (farmerId: string, currentIsActive: boolean) => {
        const actionText = currentIsActive ? "SUSPEND" : "REACTIVATE";
        const confirmed = window.confirm(
            `Are you sure you want to ${actionText} this farmer's account? ${
                currentIsActive
                    ? "They will immediately be logged out and their farm store will be inaccessible."
                    : "Their account will be restored to active standing."
            }`
        );
        if (!confirmed) return;

        setIsActionLoading(true);
        try {
            const res = await fetch(`/api/admin/farmers/${farmerId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentIsActive }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update account status");
            }

            triggerToast(`Farmer account ${!currentIsActive ? "reinstated" : "suspended"}.`);
            await fetchFarmers();
            if (selectedFarmer && selectedFarmer.id === farmerId) {
                setSelectedFarmer((prev) => (prev ? { ...prev, isActive: !currentIsActive } : null));
                if (fullFarmerDetail) {
                    setFullFarmerDetail((prev: any) => ({
                        ...prev,
                        user: { ...prev.user, isActive: !currentIsActive },
                    }));
                }
            }
        } catch (err: any) {
            alert(err.message || "Failed to toggle account status");
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Toast Alert */}
            {toastMessage && (
                <div className="fixed bottom-5 right-5 z-50 bg-emerald-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-emerald-700 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-medium">{toastMessage}</span>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-800">
                            <Tractor className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Farmers Directory & Operations</h1>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        Comprehensive dossier of registered agricultural producers: manage verified credentials, inspect produce listings, and audit compliance.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchFarmers()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors shadow-sm"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
                        <span>Refresh</span>
                    </button>
                    <Link
                        href="/admin/products"
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#1B4D28] text-white rounded-xl text-sm font-medium hover:bg-[#153e20] transition-colors shadow-sm"
                    >
                        <Package className="w-4 h-4" />
                        <span>Moderate Produce</span>
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Farmers</span>
                        <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                            <Tractor className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{statistics.totalFarmers}</p>
                    <p className="text-xs text-gray-400 mt-1">Registered farm enterprises</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Verified Producers</span>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700 mt-2">{statistics.verifiedProducers}</p>
                    <p className="text-xs text-emerald-600/80 mt-1">Granted Verified Producer Badge</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending Verification</span>
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-amber-700 mt-2">{statistics.pendingVerification}</p>
                    <p className="text-xs text-amber-600/80 mt-1">Awaiting admin review</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Suspended Accounts</span>
                        <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-red-600 mt-2">{statistics.suspendedAccounts}</p>
                    <p className="text-xs text-red-500/80 mt-1">Access revoked by admin</p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by farm name, owner, phone, state..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">Verification:</span>
                    {(["ALL", "APPROVED", "PENDING", "REJECTED"] as const).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveVerificationFilter(filter)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                activeVerificationFilter === filter
                                    ? "bg-[#1B4D28] text-white shadow-sm"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            {filter === "ALL" ? "All Status" : filter === "APPROVED" ? "Verified" : filter === "PENDING" ? "Pending" : "Rejected"}
                        </button>
                    ))}

                    <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block"></div>

                    <select
                        value={activeStatusFilter}
                        onChange={(e) => setActiveStatusFilter(e.target.value)}
                        className="px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium focus:outline-none"
                    >
                        <option value="ALL">All Account Standings</option>
                        <option value="ACTIVE">Active Only</option>
                        <option value="SUSPENDED">Suspended Only</option>
                    </select>
                </div>
            </div>

            {/* Farmers Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="py-3.5 px-6">Farmer & Farm Entity</th>
                                <th className="py-3.5 px-6">Location</th>
                                <th className="py-3.5 px-6">Producer Status</th>
                                <th className="py-3.5 px-6">Listings / Stock</th>
                                <th className="py-3.5 px-6">Account Status</th>
                                <th className="py-3.5 px-6">Registered</th>
                                <th className="py-3.5 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-500">
                                        <div className="inline-flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-600 border-t-transparent"></div>
                                            <span>Loading farmers directory...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : farmers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Tractor className="w-8 h-8 text-gray-300" />
                                            <p className="font-medium text-gray-600">No farmers found matching filters</p>
                                            <p className="text-xs text-gray-400">Try modifying your search or status query.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                farmers.map((farmer) => (
                                    <tr key={farmer.id} className="hover:bg-gray-50/60 transition-colors">
                                        {/* Farmer & Farm */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 font-bold flex items-center justify-center border border-emerald-100 flex-shrink-0 text-sm">
                                                    {farmer.profileImage ? (
                                                        <Image
                                                            src={farmer.profileImage}
                                                            alt={farmer.fullName}
                                                            width={40}
                                                            height={40}
                                                            className="rounded-xl object-cover"
                                                        />
                                                    ) : (
                                                        farmer.fullName.slice(0, 2).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                                                        <span>{farmer.farmName}</span>
                                                        {farmer.verificationStatus === "APPROVED" && (
                                                            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{farmer.fullName}</p>
                                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                                                        <span>{farmer.email}</span>
                                                        <span>•</span>
                                                        <span>{farmer.phoneNumber}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Location */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-start gap-1 text-gray-700">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                                                <div className="text-xs">
                                                    <p className="font-medium">{farmer.state}, Nigeria</p>
                                                    <p className="text-gray-400">{farmer.lga}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Producer Status */}
                                        <td className="py-4 px-6">
                                            {farmer.verificationStatus === "APPROVED" ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <ShieldCheck className="w-3.5 h-3.5" />
                                                    <span>Verified Producer</span>
                                                </span>
                                            ) : farmer.verificationStatus === "PENDING" ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>Pending Review</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    <span>Rejected</span>
                                                </span>
                                            )}
                                        </td>

                                        {/* Listings & Stock */}
                                        <td className="py-4 px-6">
                                            <div className="text-xs">
                                                <p className="font-semibold text-gray-900">{farmer.totalProducts} Products</p>
                                                <p className="text-gray-500">{farmer.totalInventoryQty.toLocaleString()} units in stock</p>
                                            </div>
                                        </td>

                                        {/* Account Status */}
                                        <td className="py-4 px-6">
                                            {farmer.isActive ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                                                    <span>Active</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                                                    <span>Suspended</span>
                                                </span>
                                            )}
                                        </td>

                                        {/* Joined */}
                                        <td className="py-4 px-6 text-xs text-gray-500 whitespace-nowrap">
                                            {new Date(farmer.createdAt).toLocaleDateString("en-GB", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openFarmerDossier(farmer)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors"
                                                    title="Inspect Farmer 360 Dossier"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span>Inspect</span>
                                                </button>

                                                {farmer.verificationStatus !== "APPROVED" ? (
                                                    <button
                                                        onClick={() => handleUpdateVerification(farmer.id, "APPROVED")}
                                                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                        title="Grant Verified Producer Badge"
                                                    >
                                                        <ShieldCheck className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleUpdateVerification(farmer.id, "PENDING")}
                                                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                        title="Revoke Verified Badge"
                                                    >
                                                        <Clock className="w-4 h-4" />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleToggleAccountStatus(farmer.id, farmer.isActive)}
                                                    className={`p-1.5 rounded-lg transition-colors ${
                                                        farmer.isActive
                                                            ? "text-red-500 hover:bg-red-50"
                                                            : "text-green-600 hover:bg-green-50"
                                                    }`}
                                                    title={farmer.isActive ? "Suspend Farmer" : "Reactivate Farmer"}
                                                >
                                                    {farmer.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Farmer 360 Dossier Modal */}
            {selectedFarmer && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gradient-to-r from-emerald-900 to-[#1B4D28] text-white">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl font-bold flex-shrink-0">
                                    {selectedFarmer.profileImage ? (
                                        <Image
                                            src={selectedFarmer.profileImage}
                                            alt={selectedFarmer.fullName}
                                            width={56}
                                            height={56}
                                            className="rounded-2xl object-cover"
                                        />
                                    ) : (
                                        selectedFarmer.fullName.slice(0, 2).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-bold">{selectedFarmer.farmName}</h2>
                                        {selectedFarmer.verificationStatus === "APPROVED" && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                                                <ShieldCheck className="w-3.5 h-3.5" />
                                                <span>Verified Producer</span>
                                            </span>
                                        )}
                                        {!selectedFarmer.isActive && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-200 border border-red-400/30">
                                                <span>Suspended</span>
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-emerald-100 text-sm mt-0.5">
                                        Owner: <span className="font-semibold text-white">{selectedFarmer.fullName}</span> • Joined{" "}
                                        {new Date(selectedFarmer.createdAt).toLocaleDateString("en-GB")}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedFarmer(null)}
                                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Action Bar */}
                        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setActiveModalTab("profile")}
                                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                                        activeModalTab === "profile"
                                            ? "bg-[#1B4D28] text-white shadow-sm"
                                            : "text-gray-600 hover:bg-gray-200"
                                    }`}
                                >
                                    Farm Profile & Contact
                                </button>
                                <button
                                    onClick={() => setActiveModalTab("products")}
                                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                        activeModalTab === "products"
                                            ? "bg-[#1B4D28] text-white shadow-sm"
                                            : "text-gray-600 hover:bg-gray-200"
                                    }`}
                                >
                                    <span>Produce Catalog</span>
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
                                        {fullFarmerDetail?.products?.length || selectedFarmer.totalProducts}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveModalTab("kyc")}
                                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                        activeModalTab === "kyc"
                                            ? "bg-[#1B4D28] text-white shadow-sm"
                                            : "text-gray-600 hover:bg-gray-200"
                                    }`}
                                >
                                    <span>KYC Credentials</span>
                                    {selectedFarmer.hasKycDoc && (
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    )}
                                </button>
                            </div>

                            {/* Authoritative Admin Controls */}
                            <div className="flex items-center gap-2">
                                {selectedFarmer.verificationStatus !== "APPROVED" ? (
                                    <button
                                        disabled={isActionLoading}
                                        onClick={() => handleUpdateVerification(selectedFarmer.id, "APPROVED")}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                                    >
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        <span>Grant Verified Producer</span>
                                    </button>
                                ) : (
                                    <button
                                        disabled={isActionLoading}
                                        onClick={() => handleUpdateVerification(selectedFarmer.id, "PENDING")}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                                    >
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>Revoke Verified Status</span>
                                    </button>
                                )}

                                <button
                                    disabled={isActionLoading}
                                    onClick={() => handleToggleAccountStatus(selectedFarmer.id, selectedFarmer.isActive)}
                                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 ${
                                        selectedFarmer.isActive
                                            ? "bg-red-600 hover:bg-red-700 text-white"
                                            : "bg-green-600 hover:bg-green-700 text-white"
                                    }`}
                                >
                                    {selectedFarmer.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                    <span>{selectedFarmer.isActive ? "Suspend Farmer" : "Reinstate Farmer"}</span>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {isDetailLoading ? (
                                <div className="py-16 text-center text-gray-400">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent mx-auto mb-3"></div>
                                    <p className="text-sm">Fetching complete farm dossier...</p>
                                </div>
                            ) : (
                                <>
                                    {/* TAB 1: Profile & Contact */}
                                    {activeModalTab === "profile" && (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                                        Farm Location & Address
                                                    </h3>
                                                    <div className="space-y-2 text-sm text-gray-700">
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="w-4 h-4 text-gray-400" />
                                                            <span className="font-semibold text-gray-900">
                                                                {selectedFarmer.farmAddress}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 pl-6">
                                                            State: <strong className="text-gray-700">{selectedFarmer.state}</strong> | LGA:{" "}
                                                            <strong className="text-gray-700">{selectedFarmer.lga}</strong>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                                        Direct Communication
                                                    </h3>
                                                    <div className="space-y-2 text-sm">
                                                        <a
                                                            href={`tel:${selectedFarmer.phoneNumber}`}
                                                            className="flex items-center gap-2 text-emerald-800 font-medium hover:underline"
                                                        >
                                                            <Phone className="w-4 h-4 text-emerald-600" />
                                                            <span>{selectedFarmer.phoneNumber}</span>
                                                        </a>
                                                        <a
                                                            href={`mailto:${selectedFarmer.email}`}
                                                            className="flex items-center gap-2 text-emerald-800 font-medium hover:underline"
                                                        >
                                                            <Mail className="w-4 h-4 text-emerald-600" />
                                                            <span>{selectedFarmer.email}</span>
                                                        </a>
                                                        <a
                                                            href={`https://wa.me/${selectedFarmer.phoneNumber.replace(/[^0-9]/g, "")}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold mt-1 hover:underline"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                            <span>Open WhatsApp Chat</span>
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Farm Description */}
                                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                                    Farm Enterprise Description
                                                </h3>
                                                <p className="text-sm text-gray-700 leading-relaxed">
                                                    {selectedFarmer.farmDescription || "No enterprise description provided by farmer."}
                                                </p>
                                            </div>

                                            {/* Quick Operational Metrics */}
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl text-center">
                                                    <p className="text-xs text-emerald-700 font-semibold uppercase">Total Listed Products</p>
                                                    <p className="text-2xl font-bold text-emerald-900 mt-1">{selectedFarmer.totalProducts}</p>
                                                </div>
                                                <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl text-center">
                                                    <p className="text-xs text-emerald-700 font-semibold uppercase">Available Units</p>
                                                    <p className="text-2xl font-bold text-emerald-900 mt-1">
                                                        {selectedFarmer.totalInventoryQty.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl text-center">
                                                    <p className="text-xs text-emerald-700 font-semibold uppercase">Orders Received</p>
                                                    <p className="text-2xl font-bold text-emerald-900 mt-1">{selectedFarmer.totalOrders}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 2: Produce Catalog */}
                                    {activeModalTab === "products" && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-bold text-gray-900">
                                                    Listed Farm Produce ({fullFarmerDetail?.products?.length || 0})
                                                </h3>
                                                <Link
                                                    href="/admin/products"
                                                    className="text-xs text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1"
                                                >
                                                    <span>Open Full Produce Moderator</span>
                                                    <ExternalLink className="w-3 h-3" />
                                                </Link>
                                            </div>

                                            {(!fullFarmerDetail?.products || fullFarmerDetail.products.length === 0) ? (
                                                <div className="py-12 text-center text-gray-400 bg-gray-50 rounded-2xl border border-gray-100">
                                                    <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                    <p className="text-sm font-medium text-gray-600">No produce listings yet</p>
                                                    <p className="text-xs text-gray-400">This farmer has not published any agricultural products.</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {fullFarmerDetail.products.map((p: any) => (
                                                        <div
                                                            key={p.id}
                                                            className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3"
                                                        >
                                                            <div className="w-14 h-14 rounded-xl bg-gray-200 relative overflow-hidden flex-shrink-0">
                                                                {p.images && p.images[0]?.imageUrl ? (
                                                                    <Image
                                                                        src={p.images[0].imageUrl}
                                                                        alt={p.name}
                                                                        fill
                                                                        className="object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                        <Package className="w-6 h-6" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-1">
                                                                    <p className="font-semibold text-gray-900 text-sm truncate">{p.name}</p>
                                                                    <span
                                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                            p.status === "APPROVED"
                                                                                ? "bg-emerald-100 text-emerald-800"
                                                                                : p.status === "PENDING_APPROVAL"
                                                                                ? "bg-amber-100 text-amber-800"
                                                                                : "bg-red-100 text-red-800"
                                                                        }`}
                                                                    >
                                                                        {p.status}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs font-bold text-emerald-800 mt-0.5">
                                                                    ₦{Number(p.price).toLocaleString()} / {p.unit?.toLowerCase()}
                                                                </p>
                                                                <p className="text-[11px] text-gray-400 mt-0.5">
                                                                    Stock: {p.inventory?.availableQty || 0} units available
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* TAB 3: KYC Credentials */}
                                    {activeModalTab === "kyc" && (
                                        <div className="space-y-4">
                                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-emerald-700" />
                                                    <span>Farmer Identity & Farm Verification Document</span>
                                                </h3>

                                                {selectedFarmer.kycDocument || fullFarmerDetail?.verification ? (
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                                            <div>
                                                                <span className="text-gray-400 block uppercase">Document Type</span>
                                                                <span className="font-semibold text-gray-800 text-sm">
                                                                    {selectedFarmer.kycDocument?.documentType ||
                                                                        fullFarmerDetail?.verification?.documentType}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-400 block uppercase">Document Number</span>
                                                                <span className="font-semibold text-gray-800 text-sm">
                                                                    {selectedFarmer.kycDocument?.documentNumber ||
                                                                        fullFarmerDetail?.verification?.documentNumber ||
                                                                        "N/A"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {selectedFarmer.kycDocument?.remarks && (
                                                            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-800">
                                                                <strong>Reviewer Remarks:</strong> {selectedFarmer.kycDocument.remarks}
                                                            </div>
                                                        )}

                                                        <div className="pt-2">
                                                            <a
                                                                href={
                                                                    selectedFarmer.kycDocument?.documentUrl ||
                                                                    fullFarmerDetail?.verification?.documentUrl
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-emerald-800 font-semibold rounded-xl text-xs hover:bg-emerald-50 transition-colors shadow-sm"
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                                <span>View Submitted Document File</span>
                                                            </a>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="py-8 text-center text-gray-400">
                                                        <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                        <p className="text-sm font-medium text-gray-600">No KYC Document Submitted</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            This farmer has not yet uploaded government ID or farm certification documents.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
                            <button
                                onClick={() => setSelectedFarmer(null)}
                                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                            >
                                Close Dossier
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
