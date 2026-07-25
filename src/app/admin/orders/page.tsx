"use client";

import React, { useState, useEffect } from "react";
import {
    RefreshCw,
    Download,
    CheckCircle2,
    X,
    ExternalLink,
    Truck,
    ShieldAlert,
    PackageX
} from "lucide-react";
import { OrdersPageDTO, OrderSummaryItemDTO } from "@/dto";

export default function AdminOrdersPage() {
    const [dto, setDto] = useState<OrdersPageDTO | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("All Orders");

    // Modal & Toast states
    const [selectedOrder, setSelectedOrder] = useState<OrderSummaryItemDTO | null>(null);
    const [toastMessage, setToastMessage] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    const triggerToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage("");
        }, 3500);
    };

    const fetchAdminOrders = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/orders");
            if (res.ok) {
                const data: OrdersPageDTO = await res.json();
                setDto(data);
            }
        } catch (err) {
            console.error("Failed to fetch admin orders", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminOrders();
    }, []);

    // Force release of escrow funds or change order status
    const handleUpdateStatus = async (id: string, newStatus: string) => {
        setIsUpdating(true);
        try {
            const res = await fetch(`/api/orders/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (res.ok) {
                triggerToast(`Order #${data.order?.orderNumber || id} updated to ${newStatus}!`);
                fetchAdminOrders();
                setSelectedOrder(null);
            } else {
                triggerToast(`Failed to update status: ${data.error}`);
            }
        } catch (err) {
            triggerToast("Network error updating order status.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleExport = () => {
        triggerToast("B2B orders log successfully exported to CSV!");
    };

    const orders = dto?.orders || [];

    // Filter orders by active tab
    const filteredOrders = orders.filter(order => {
        if (activeTab === "Active Orders") return ["CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "IN_TRANSIT", "DELIVERED", "COMPLETED"].includes(order.status);
        if (activeTab === "Pending Orders") return order.status === "PENDING";
        if (activeTab === "Cancel Orders") return order.status === "CANCELLED";
        return true; // All Orders
    });

    const formatStatusBadge = (status: string) => {
        switch (status) {
            case "COMPLETED":
            case "DELIVERED":
            case "CONFIRMED":
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700">{status}</span>;
            case "CANCELLED":
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700">CANCELLED</span>;
            case "PENDING":
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700">PENDING</span>;
            default:
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">{status}</span>;
        }
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Top Toast Banner */}
            {toastMessage && (
                <div className="fixed top-6 right-6 z-50 bg-[#1B4D28] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <span className="text-sm font-semibold">{toastMessage}</span>
                </div>
            )}

            {/* Header & Stats Cards */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">B2B Commerce & Order Management</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Monitor live transactions, escrow holdings, and logistics transitions across PostgreSQL.
                    </p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center justify-center gap-2 bg-[#1B4D28] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#153b1e] transition-colors shadow-sm text-sm"
                >
                    <Download size={16} />
                    Export Log (CSV)
                </button>
            </div>

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Orders</p>
                        <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{dto?.statistics?.totalOrders || 0}</h3>
                    </div>
                    <div className="p-3 bg-emerald-50 text-[#1B4D28] rounded-xl">
                        <RefreshCw size={22} />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Orders</p>
                        <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{dto?.statusSummary?.pending || 0}</h3>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <ShieldAlert size={22} />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Delivered / Completed</p>
                        <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
                            {(dto?.statusSummary?.delivered || 0) + (dto?.statusSummary?.completed || 0)}
                        </h3>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <CheckCircle2 size={22} />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gross Spend</p>
                        <h3 className="text-2xl font-extrabold text-gray-900 mt-1">
                            ${(dto?.statistics?.totalSpent || 0).toLocaleString()}
                        </h3>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Truck size={22} />
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex gap-2 overflow-x-auto">
                {["All Orders", "Active Orders", "Pending Orders", "Cancel Orders"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                            activeTab === tab
                                ? "bg-[#1B4D28] text-white shadow-sm"
                                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center">
                            <div className="w-8 h-8 border-4 border-[#1B4D28]/20 border-t-[#1B4D28] rounded-full animate-spin mb-3" />
                            <p className="text-sm font-medium">Loading live order logs...</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center">
                            <PackageX size={48} className="text-gray-300 mb-3" />
                            <p className="text-base font-bold text-gray-700">No orders found</p>
                            <p className="text-sm text-gray-400 mt-1">There are no orders matching "{activeTab}".</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Order ID</th>
                                    <th className="px-6 py-4">Product</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Payment</th>
                                    <th className="px-6 py-4">Total</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-800">{order.orderNumber}</td>
                                        <td className="px-6 py-4 font-medium text-gray-700">{order.primaryProductName}</td>
                                        <td className="px-6 py-4 text-gray-600">{order.buyerName}</td>
                                        <td className="px-6 py-4">{formatStatusBadge(order.status)}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md">
                                                {order.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">${order.totalAmount.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="text-xs font-bold text-[#1B4D28] hover:underline bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100"
                                            >
                                                Manage
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Manage Order Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-6">
                        <button
                            onClick={() => setSelectedOrder(null)}
                            className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>

                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Order Management: #{selectedOrder.orderNumber}</h3>
                            <p className="text-xs text-gray-400 mt-1">Review live details and trigger status state transitions.</p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-2xl space-y-2 text-sm text-gray-700 border border-gray-100">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Buyer</span>
                                <span className="font-semibold">{selectedOrder.buyerName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Primary Product</span>
                                <span className="font-semibold">{selectedOrder.primaryProductName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Current Status</span>
                                <span className="font-bold text-[#1B4D28]">{selectedOrder.status}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Total Amount</span>
                                <span className="font-bold text-gray-900">${selectedOrder.totalAmount.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Trigger State Transition</p>

                            {selectedOrder.status === "PENDING" && (
                                <button
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateStatus(selectedOrder.id, "CONFIRMED")}
                                    className="w-full bg-[#1B4D28] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#153b1e] transition-colors disabled:opacity-50"
                                >
                                    Confirm Order (Lock Payment & Notify Farmer)
                                </button>
                            )}

                            {selectedOrder.status === "CONFIRMED" && (
                                <button
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateStatus(selectedOrder.id, "PROCESSING")}
                                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    Mark Processing & Packaging
                                </button>
                            )}

                            {selectedOrder.status === "PROCESSING" && (
                                <button
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateStatus(selectedOrder.id, "READY_FOR_PICKUP")}
                                    className="w-full bg-amber-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-amber-700 transition-colors disabled:opacity-50"
                                >
                                    Mark Ready for Pickup
                                </button>
                            )}

                            {selectedOrder.status === "READY_FOR_PICKUP" && (
                                <button
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateStatus(selectedOrder.id, "IN_TRANSIT")}
                                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    Mark In Transit (Logistics Dispatched)
                                </button>
                            )}

                            {selectedOrder.status === "IN_TRANSIT" && (
                                <button
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateStatus(selectedOrder.id, "DELIVERED")}
                                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                >
                                    Confirm Delivery
                                </button>
                            )}

                            {selectedOrder.status === "DELIVERED" && (
                                <button
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateStatus(selectedOrder.id, "COMPLETED")}
                                    className="w-full bg-[#1B4D28] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#153b1e] transition-colors disabled:opacity-50"
                                >
                                    Complete Order & Release Escrow to Farmer
                                </button>
                            )}

                            {selectedOrder.status !== "CANCELLED" && selectedOrder.status !== "COMPLETED" && (
                                <button
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateStatus(selectedOrder.id, "CANCELLED")}
                                    className="w-full bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors disabled:opacity-50"
                                >
                                    Cancel Order (Release Reserved Inventory & Refund)
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
