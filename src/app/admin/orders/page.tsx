"use client";

import React, { useState } from "react";
import {
    Users as UsersIcon,
    RefreshCw,
    CheckCircle,
    XCircle,
    Download,
    CheckCircle2,
    X,
    ExternalLink,
    Truck,
    ShieldAlert
} from "lucide-react";
import Image from "next/image";

// Initial mock data matching Image 4
const initialOrders = [
    { id: "83335", product: "Fresh Tomatoes", customer: "John Deo", status: "Pending", price: "$145.00", quantity: "60kg", date: "23-06-2026", container: "SH-Tom83", carrier: "MSC Logistics", departure: "Port of Kano, NG", destination: "Port of Rotterdam, NL", contract: "0x39a1...fa88" },
    { id: "90299", product: "Organic Maize", customer: "Jane Smith", status: "Pending", price: "$345.00", quantity: "130kg", date: "23-06-2026", container: "SH-Maiz90", carrier: "Maersk Line", departure: "Port of Lagos, NG", destination: "Port of Hamburg, DE", contract: "0x8fa3...c22b" },
    { id: "90298", product: "Organic Maize", customer: "Jane Smith", status: "Pending", price: "$345.00", quantity: "420kg", date: "23-06-2026", container: "SH-Maiz91", carrier: "Maersk Line", departure: "Port of Lagos, NG", destination: "Port of Antwerp, BE", contract: "0x9ab2...44f9" },
    { id: "65109", product: "Foreign Rice", customer: "Ahmed Buba", status: "Approved", price: "$345.00", quantity: "180kg", date: "23-06-2026", container: "SH-Rice65", carrier: "CMA CGM", departure: "Port of Lagos, NG", destination: "Port of London, UK", contract: "0x12d3...32a1" },
    { id: "65108", product: "Foreign Rice", customer: "Ahmed Buba", status: "Rejected", price: "$345.00", quantity: "220kg", date: "23-06-2026", container: "None", carrier: "None", departure: "N/A", destination: "N/A", contract: "Cancelled" },
];

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState(initialOrders);
    const [activeTab, setActiveTab] = useState("All Orders");

    // Modal & Toast states
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [toastMessage, setToastMessage] = useState("");

    const triggerToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage("");
        }, 3500);
    };

    // Force release of escrow funds
    const handleReleaseEscrow = (id: string) => {
        setOrders(prev =>
            prev.map(order => order.id === id ? { ...order, status: "Approved" } : order)
        );
        triggerToast(`Escrow funds for Order #${id} successfully cleared & wired to farmer!`);
    };

    const handleExport = () => {
        triggerToast("B2B orders log successfully exported to CSV!");
    };

    // Filter orders by active tab
    const filteredOrders = orders.filter(order => {
        if (activeTab === "Active Orders") return order.status === "Approved";
        if (activeTab === "Pending Orders") return order.status === "Pending";
        if (activeTab === "Cancel Orders") return order.status === "Rejected";
        return true; // All Orders
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
                    Welcome Back, OLAK! Here's your admin overview for today.
                </p>
                <div>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-[#1B4D28] text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-[#143d20] shadow-sm transition-colors cursor-pointer"
                    >
                        <Download size={14} />
                        Export Orders Log
                    </button>
                </div>
            </div>

            {/* ─── ORDERS METRICS ROW (Image 4) ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Users */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-green-50 text-[#1B4D28] rounded-xl flex-shrink-0">
                        <UsersIcon size={22} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-bold text-gray-800 tracking-tight leading-none">2,847</span>
                        <span className="text-xs font-semibold text-gray-400 mt-1.5 uppercase tracking-wider">Total Users</span>
                    </div>
                </div>

                {/* Pending Orders */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-green-50 text-[#1B4D28] rounded-xl flex-shrink-0">
                        <RefreshCw size={22} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-bold text-gray-800 tracking-tight leading-none">013</span>
                        <span className="text-xs font-semibold text-gray-400 mt-1.5 uppercase tracking-wider">Pending Orders</span>
                    </div>
                </div>

                {/* Completed */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-green-50 text-[#1B4D28] rounded-xl flex-shrink-0">
                        <CheckCircle size={22} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-bold text-gray-800 tracking-tight leading-none">384</span>
                        <span className="text-xs font-semibold text-gray-400 mt-1.5 uppercase tracking-wider">Completed</span>
                    </div>
                </div>

                {/* Cancel */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-green-50 text-[#1B4D28] rounded-xl flex-shrink-0">
                        <XCircle size={22} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-bold text-gray-800 tracking-tight leading-none">5265</span>
                        <span className="text-xs font-semibold text-gray-400 mt-1.5 uppercase tracking-wider">Cancel</span>
                    </div>
                </div>
            </div>

            {/* Banner (Produce graphic matching Image 4) */}
            <div className="relative h-44 md:h-52 w-full rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                <Image
                    src="/agrochain-logistics.png"
                    alt="Agricultural Produce and Veggies banner"
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

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden font-sans">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm font-medium">
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map(item => (
                                    <tr
                                        key={item.id}
                                        onClick={() => setSelectedOrder(item)}
                                        className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                                    >
                                        <td className="py-4.5 px-6 text-gray-800 font-bold">{item.id}</td>
                                        <td className="py-4.5 px-6 text-gray-600 font-semibold">{item.product}</td>
                                        <td className="py-4.5 px-6 text-gray-500">{item.customer}</td>
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
                                        <td className="py-4.5 px-6 text-gray-600">{item.quantity}</td>
                                        <td className="py-4.5 px-6">
                                            <button className="text-xs text-[#1B4D28] font-bold hover:underline">
                                                Inspect
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-10 text-center text-gray-400 font-semibold">
                                        No orders match this status filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── SHIPPING & ESCROW AUDIT DETAIL MODAL ─── */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-scaleIn">
                        <div className="flex items-center justify-between bg-gray-50 px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <Truck size={18} className="text-[#1B4D28]" />
                                <h3 className="font-bold text-gray-800 text-base">Escrow & Cargo Audit</h3>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                                <div>
                                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Order Reference</span>
                                    <span className="block font-bold text-gray-800 mt-0.5">#{selectedOrder.id}</span>
                                </div>
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                    selectedOrder.status === "Pending"
                                        ? "bg-amber-50 text-amber-600 border-amber-100"
                                        : selectedOrder.status === "Approved"
                                        ? "bg-green-50 text-green-600 border-green-100"
                                        : "bg-red-50 text-red-500 border-red-100"
                                }`}>
                                    {selectedOrder.status}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between py-1.5 border-b border-gray-50">
                                    <span className="text-gray-400 font-semibold">Commodity Item</span>
                                    <span className="text-gray-700 font-bold">{selectedOrder.product}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-gray-50">
                                    <span className="text-gray-400 font-semibold">Buyer Customer</span>
                                    <span className="text-gray-700 font-bold">{selectedOrder.customer}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-gray-50">
                                    <span className="text-gray-400 font-semibold">Carrier / Container</span>
                                    <span className="text-gray-700 font-bold">{selectedOrder.carrier} ({selectedOrder.container})</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-gray-50">
                                    <span className="text-gray-400 font-semibold">Transit Ports</span>
                                    <span className="text-gray-700 font-bold text-xs truncate max-w-[200px]" title={`${selectedOrder.departure} → ${selectedOrder.destination}`}>
                                        {selectedOrder.departure} → {selectedOrder.destination}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-gray-50">
                                    <span className="text-gray-400 font-semibold">Escrow Smart Contract</span>
                                    <span className="text-green-600 font-bold flex items-center gap-1 text-xs">
                                        {selectedOrder.contract}
                                        <ExternalLink size={10} className="mt-0.5" />
                                    </span>
                                </div>
                            </div>

                            {selectedOrder.status === "Pending" && (
                                <div className="pt-4 flex gap-3">
                                    <button
                                        onClick={() => {
                                            handleReleaseEscrow(selectedOrder.id);
                                            setSelectedOrder(null);
                                        }}
                                        className="w-full text-center font-bold text-white bg-[#1B4D28] hover:bg-[#143d20] py-2.5 rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
                                    >
                                        Authorize Escrow Release (Wire Payment)
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
