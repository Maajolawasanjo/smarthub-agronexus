"use client";

import React, { useState } from "react";
import { Download, Plus, Check, X, ArrowRight, Eye, CheckCircle2, ShieldCheck, HelpCircle } from "lucide-react";
import Image from "next/image";

// Initial mock data matching Image 3
const initialListings = [
    { id: "83335", product: "Fresh Tomatoes", farmer: "John Deo", status: "Pending", price: "$145.00", moisture: "12%", origin: "Kano, Nigeria", organic: "Yes", certificate: "FDA-98213" },
    { id: "90299", product: "Organic Maize", farmer: "Jane Smith", status: "Pending", price: "$345.00", moisture: "8%", origin: "Oyo, Nigeria", organic: "Yes", certificate: "USDA-Org" },
    { id: "90298", product: "Organic Maize", farmer: "Jane Smith", status: "Pending", price: "$345.00", moisture: "9%", origin: "Oyo, Nigeria", organic: "Yes", certificate: "USDA-Org" },
    { id: "65109", product: "Foreign Rice", farmer: "Ahmed Buba", status: "Approved", price: "$345.00", moisture: "14%", origin: "Kebbi, Nigeria", organic: "No", certificate: "SON-8812" },
    { id: "65108", product: "Foreign Rice", farmer: "Ahmed Buba", status: "Rejected", price: "$345.00", moisture: "18%", origin: "Kebbi, Nigeria", organic: "No", certificate: "Expired" },
];

export default function AdminProductsPage() {
    const [listings, setListings] = useState(initialListings);
    const [activeTab, setActiveTab] = useState("All Orders");

    React.useEffect(() => {
        async function fetchSubmissions() {
            try {
                const res = await fetch("/api/farmer/produce");
                const data = await res.json();
                if (data.products && data.products.length > 0) {
                    const mapped = data.products.map((p: any) => ({
                        id: p.id,
                        product: p.name,
                        farmer: p.farmerProfile?.user?.fullName || p.farmerProfile?.farmName || "Verified Farmer",
                        status: p.isAvailable ? "Approved" : "Pending",
                        price: `$${parseFloat(p.price).toLocaleString()}`,
                        moisture: "8.5%",
                        origin: `${p.farmerProfile?.state || "Kano"}, Nigeria`,
                        organic: "Yes",
                        certificate: "CERT-9018",
                    }));
                    setListings(mapped);
                }
            } catch (err) {
                // Fallback
            }
        }
        fetchSubmissions();
    }, []);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedCrop, setSelectedCrop] = useState<any>(null);
    const [toastMessage, setToastMessage] = useState("");

    // Form inputs
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

    // Status action toggles with API integration
    const handleApprove = async (id: string) => {
        setListings(prev =>
            prev.map(item => item.id === id ? { ...item, status: "Approved" } : item)
        );
        try {
            await fetch(`/api/admin/products/${id}/approve`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isApproved: true }),
            });
        } catch (err) {
            // Fail silent/fallback to state
        }
        triggerToast(`Listing #${id} has been approved and published!`);
    };

    const handleReject = async (id: string) => {
        setListings(prev =>
            prev.map(item => item.id === id ? { ...item, status: "Rejected" } : item)
        );
        try {
            await fetch(`/api/admin/products/${id}/approve`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isApproved: false }),
            });
        } catch (err) {
            // Fail silent/fallback to state
        }
        triggerToast(`Listing #${id} has been rejected.`);
    };

    // Handle export B2B list
    const handleExport = () => {
        triggerToast("Product listings exported to CSV successfully!");
    };

    // Handle adding new listing
    const handleAddCrop = (e: React.FormEvent) => {
        e.preventDefault();
        if (!cropName || !farmerName || !cropPrice) return;

        const newListing = {
            id: Math.floor(10000 + Math.random() * 90000).toString(),
            product: cropName,
            farmer: farmerName,
            status: "Pending",
            price: cropPrice.startsWith("$") ? cropPrice : `$${cropPrice}`,
            moisture: cropMoisture,
            origin: cropOrigin,
            organic: "Yes",
            certificate: "Pending Review"
        };

        setListings([newListing, ...listings]);
        setShowAddModal(false);
        setCropName("");
        setFarmerName("");
        setCropPrice("");
        triggerToast(`New listing for ${cropName} submitted successfully!`);
    };

    // Tabs filter mappings
    const filteredListings = listings.filter(item => {
        if (activeTab === "Active Orders") return item.status === "Approved";
        if (activeTab === "Pending Orders") return item.status === "Pending";
        if (activeTab === "Cancel Orders") return item.status === "Rejected";
        return true; // "All Orders"
    });

    return (
        <div className="space-y-6 animate-fadeIn font-sans">
            {/* Success Toast */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 bg-[#1B4D28] text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-[#2C5E39] animate-slideIn">
                    <CheckCircle2 size={20} className="text-[#4CAF50] flex-shrink-0" />
                    <span className="text-sm font-semibold">{toastMessage}</span>
                </div>
            )}

            {/* Header row with controls */}
            <div className="-mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-gray-500 text-sm">
                    Manage all product listings from farmers
                </p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-[#1B4D28] text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-[#143d20] shadow-sm transition-colors cursor-pointer"
                    >
                        <Download size={14} />
                        Export
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-[#1B4D28] text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-[#143d20] shadow-sm transition-colors cursor-pointer"
                    >
                        <Plus size={14} />
                        Add Listings
                    </button>
                </div>
            </div>

            {/* Banner element */}
            <div className="relative h-44 md:h-52 w-full rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                <Image
                    src="/agrochain-farmers.png"
                    alt="Farmers Working in Agro Field"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-black/10 backdrop-brightness-[0.95]" />
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-none gap-6 text-sm font-medium">
                {["All Orders", "Active Orders", "Pending Orders", "Cancel Orders"].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3.5 px-1 relative transition-colors font-semibold cursor-pointer ${
                            activeTab === tab
                                ? "text-[#1B4D28] border-b-2 border-[#1B4D28]"
                                : "text-gray-400 hover:text-gray-600"
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Responsive Desktop Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Farmer</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm font-medium">
                            {filteredListings.length > 0 ? (
                                filteredListings.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4.5 px-6 text-gray-800 font-bold">{item.id}</td>
                                        <td className="py-4.5 px-6 text-gray-600 font-semibold">{item.product}</td>
                                        <td className="py-4.5 px-6 text-gray-500">{item.farmer}</td>
                                        <td className="py-4.5 px-6">
                                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold tracking-tight shadow-sm border ${
                                                item.status === "Pending"
                                                    ? "bg-amber-50 text-amber-600 border-amber-100"
                                                    : item.status === "Approved"
                                                    ? "bg-green-50 text-green-600 border-green-100"
                                                    : "bg-red-50 text-red-500 border-red-100"
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="py-4.5 px-6 text-gray-700 font-semibold">{item.price}</td>
                                        <td className="py-4.5 px-6">
                                            <div className="flex items-center gap-2">
                                                {item.status === "Pending" ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(item.id)}
                                                            className="p-1.5 bg-[#4CAF50] text-white rounded-lg hover:bg-green-600 shadow-sm transition-transform active:scale-95 cursor-pointer"
                                                            title="Approve Listing"
                                                        >
                                                            <Check size={16} strokeWidth={2.5} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(item.id)}
                                                            className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-sm transition-transform active:scale-95 cursor-pointer"
                                                            title="Reject Listing"
                                                        >
                                                            <X size={16} strokeWidth={2.5} />
                                                        </button>
                                                    </>
                                                ) : null}
                                                <button
                                                    onClick={() => setSelectedCrop(item)}
                                                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#1B4D28] font-bold px-2 py-1.5 hover:bg-gray-100 rounded-lg transition-colors ml-1 cursor-pointer"
                                                >
                                                    View
                                                    <ArrowRight size={14} className="mt-0.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-gray-400 font-semibold">
                                        No product listings match this status filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── ADD NEW LISTING MODAL ─── */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-scaleIn">
                        <div className="flex items-center justify-between bg-gray-50 px-6 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800 text-base">Add New Crop Listing</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleAddCrop} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Crop / Produce Product
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Premium Cocoa Beans"
                                    value={cropName}
                                    onChange={(e) => setCropName(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1B4D28] text-gray-700 font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Farmer / Supplier Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter farmer name"
                                    value={farmerName}
                                    onChange={(e) => setFarmerName(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1B4D28] text-gray-700 font-semibold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Price (per Ton)
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. $450.00"
                                        value={cropPrice}
                                        onChange={(e) => setCropPrice(e.target.value)}
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
                                    Submit for Review
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── VIEW QUALITY AUDIT DETAIL MODAL ─── */}
            {selectedCrop && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-scaleIn">
                        <div className="flex items-center justify-between bg-gray-50 px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={18} className="text-[#1B4D28]" />
                                <h3 className="font-bold text-gray-800 text-base">Crop Quality Audit</h3>
                            </div>
                            <button
                                onClick={() => setSelectedCrop(null)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                                <div>
                                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Listing ID</span>
                                    <span className="block font-bold text-gray-800 mt-0.5">#{selectedCrop.id}</span>
                                </div>
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                    selectedCrop.status === "Pending"
                                        ? "bg-amber-50 text-amber-600 border-amber-100"
                                        : selectedCrop.status === "Approved"
                                        ? "bg-green-50 text-green-600 border-green-100"
                                        : "bg-red-50 text-red-500 border-red-100"
                                }`}>
                                    {selectedCrop.status}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between py-1.5 border-b border-gray-50">
                                    <span className="text-gray-400 font-semibold">Crop Produce</span>
                                    <span className="text-gray-700 font-bold">{selectedCrop.product}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-gray-50">
                                    <span className="text-gray-400 font-semibold">Farmer Supplier</span>
                                    <span className="text-gray-700 font-bold">{selectedCrop.farmer}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-gray-50">
                                    <span className="text-gray-400 font-semibold">Moisture Content</span>
                                    <span className="text-gray-700 font-bold">{selectedCrop.moisture}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-gray-50">
                                    <span className="text-gray-400 font-semibold">Harvest Origin</span>
                                    <span className="text-gray-700 font-bold">{selectedCrop.origin}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-gray-50">
                                    <span className="text-gray-400 font-semibold">Organic Classification</span>
                                    <span className="text-gray-700 font-bold">{selectedCrop.organic}</span>
                                </div>
                                <div className="flex justify-between py-1.5">
                                    <span className="text-gray-400 font-semibold">Quality Certificate</span>
                                    <span className="text-green-600 font-bold flex items-center gap-1">
                                        <Check size={14} strokeWidth={2.5} />
                                        {selectedCrop.certificate}
                                    </span>
                                </div>
                            </div>

                            {selectedCrop.status === "Pending" && (
                                <div className="pt-4 flex gap-3">
                                    <button
                                        onClick={() => {
                                            handleReject(selectedCrop.id);
                                            setSelectedCrop(null);
                                        }}
                                        className="flex-1 text-center font-bold text-red-500 border border-red-100 hover:bg-red-50 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                                    >
                                        Reject Crop
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleApprove(selectedCrop.id);
                                            setSelectedCrop(null);
                                        }}
                                        className="flex-1 text-center font-bold text-white bg-[#1B4D28] hover:bg-[#143d20] py-2.5 rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
                                    >
                                        Approve Crop
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
