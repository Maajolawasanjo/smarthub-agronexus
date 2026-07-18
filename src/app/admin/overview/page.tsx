"use client";

import React, { useState } from "react";
import {
    LayoutDashboard,
    Box,
    ShoppingCart,
    Users,
    ArrowRight,
    TrendingUp,
    ShieldCheck,
    AlertCircle,
    BadgeCheck,
    CheckCircle2,
    Check,
    X
} from "lucide-react";
import Link from "next/link";

// Mock operational tasks matching layout
const initialTasks = [
    { id: "83335", type: "Fresh Tomatoes verification request", farmer: "John Deo", status: "Pending" },
    { id: "90299", type: "Organic Maize listing certification", farmer: "Jane Smith", status: "Pending" },
    { id: "65109", type: "Foreign Rice verification request", farmer: "Ahmed Buba", status: "Approved" },
];

export default function AdminOverviewPage() {
    const [tasks, setTasks] = useState(initialTasks);
    const [toastMessage, setToastMessage] = useState("");
    const [analytics, setAnalytics] = useState<any>(null);

    React.useEffect(() => {
        async function fetchAnalytics() {
            try {
                const res = await fetch("/api/analytics");
                const data = await res.json();
                if (data.metrics) {
                    setAnalytics(data.metrics);
                }
            } catch (err) {
                // Fallback
            }
        }
        fetchAnalytics();
    }, []);

    const triggerToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage("");
        }, 3500);
    };

    const handleApproveTask = (id: string) => {
        setTasks(prev =>
            prev.map(t => t.id === id ? { ...t, status: "Approved" } : t)
        );
        triggerToast(`Listing #${id} successfully approved directly from overview!`);
    };

    const handleRejectTask = (id: string) => {
        setTasks(prev =>
            prev.map(t => t.id === id ? { ...t, status: "Rejected" } : t)
        );
        triggerToast(`Listing #${id} has been marked rejected.`);
    };

    const pendingCount = tasks.filter(t => t.status === "Pending").length;

    return (
        <div className="space-y-6 animate-fadeIn font-sans">
            {/* Success Toast */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 bg-[#1B4D28] text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-[#2C5E39] animate-slideIn">
                    <CheckCircle2 size={20} className="text-[#4CAF50] flex-shrink-0" />
                    <span className="text-sm font-semibold">{toastMessage}</span>
                </div>
            )}

            {/* Subtitle */}
            <div className="-mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <p className="text-gray-500 text-sm">
                    Platform health and operations command center
                </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Platform Health Card */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">System Status</span>
                            <span className="text-xl font-bold text-gray-800 tracking-tight mt-1.5 flex items-center gap-2">
                                <ShieldCheck size={20} className="text-[#1B4D28]" />
                                Fully Operational
                            </span>
                        </div>
                    </div>
                    <div className="text-xs text-gray-400 font-semibold mt-4">
                        All sync and backup services running normally.
                    </div>
                </div>

                {/* Moderate commission slice info */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-[#739072] uppercase tracking-widest">Active Comm. Rate</span>
                            <span className="text-2xl font-black text-gray-800 tracking-tight mt-1">
                                5.0%
                            </span>
                        </div>
                        <div className="p-2.5 bg-green-50 text-[#1B4D28] rounded-xl flex-shrink-0">
                            <TrendingUp size={16} />
                        </div>
                    </div>
                    <div className="text-xs text-gray-400 font-semibold mt-4">
                        Earned on every B2B wholesale payment release.
                    </div>
                </div>

                {/* Tasks / Awaiting Action */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Awaiting Verification</span>
                            <span className="text-xl font-bold text-gray-800 tracking-tight mt-1.5 flex items-center gap-2">
                                <AlertCircle size={20} className="text-amber-500" />
                                {pendingCount} Listings
                            </span>
                        </div>
                    </div>
                    <div className="text-xs text-gray-400 font-semibold mt-4">
                        Requires document and organic certificate check.
                    </div>
                </div>
            </div>

            {/* Main Overview Dashboard Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Tasks Panel */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[300px]">
                    <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-4">
                        <h3 className="font-bold text-gray-800 text-base">Immediate Moderation Actions</h3>
                        <Link href="/admin/products" className="text-xs font-bold text-[#1B4D28] hover:underline flex items-center gap-1">
                            Go to listings
                            <ArrowRight size={12} />
                        </Link>
                    </div>

                    <div className="flex-1 divide-y divide-gray-50">
                        {tasks.map(task => (
                            <div key={task.id} className="py-3 flex items-center justify-between gap-4">
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-bold text-gray-700 truncate">{task.type}</span>
                                    <span className="text-xs text-gray-400">By farmer {task.farmer} • Order ref: {task.id}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                                        task.status === "Pending"
                                            ? "bg-amber-50 text-amber-600 border-amber-100"
                                            : task.status === "Approved"
                                            ? "bg-green-50 text-green-600 border-green-100"
                                            : "bg-red-50 text-red-500 border-red-100"
                                    }`}>
                                        {task.status}
                                    </span>
                                    {task.status === "Pending" && (
                                        <div className="flex items-center gap-1 ml-1">
                                            <button
                                                onClick={() => handleApproveTask(task.id)}
                                                className="p-1 bg-[#4CAF50] text-white rounded-md hover:bg-green-600 transition-transform active:scale-95 cursor-pointer"
                                                title="Approve Listing"
                                            >
                                                <Check size={12} strokeWidth={2.5} />
                                            </button>
                                            <button
                                                onClick={() => handleRejectTask(task.id)}
                                                className="p-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-transform active:scale-95 cursor-pointer"
                                                title="Reject Listing"
                                            >
                                                <X size={12} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Navigation Panel */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[300px]">
                    <div className="mb-4 border-b border-gray-50 pb-4">
                        <h3 className="font-bold text-gray-800 text-base">Quick Administration Links</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 flex-1">
                        <Link href="/admin/analytics" className="p-4 bg-gray-50/50 hover:bg-[#EEF2EE]/50 border border-gray-100 rounded-2xl flex flex-col justify-between group transition-all">
                            <div className="p-2 bg-green-50 text-[#1B4D28] w-fit rounded-xl">
                                <BadgeCheck size={18} />
                            </div>
                            <div>
                                <span className="block text-sm font-bold text-gray-700 group-hover:text-[#1B4D28]">System Analytics</span>
                                <span className="block text-[10px] text-gray-400 mt-0.5">Recharts reports</span>
                            </div>
                        </Link>

                        <Link href="/admin/products" className="p-4 bg-gray-50/50 hover:bg-[#EEF2EE]/50 border border-gray-100 rounded-2xl flex flex-col justify-between group transition-all">
                            <div className="p-2 bg-green-50 text-[#1B4D28] w-fit rounded-xl">
                                <Box size={18} />
                            </div>
                            <div>
                                <span className="block text-sm font-bold text-gray-700 group-hover:text-[#1B4D28]">Listed Produce</span>
                                <span className="block text-[10px] text-gray-400 mt-0.5">Moderation logs</span>
                            </div>
                        </Link>

                        <Link href="/admin/orders" className="p-4 bg-gray-50/50 hover:bg-[#EEF2EE]/50 border border-gray-100 rounded-2xl flex flex-col justify-between group transition-all">
                            <div className="p-2 bg-green-50 text-[#1B4D28] w-fit rounded-xl">
                                <ShoppingCart size={18} />
                            </div>
                            <div>
                                <span className="block text-sm font-bold text-gray-700 group-hover:text-[#1B4D28]">Order Logs</span>
                                <span className="block text-[10px] text-gray-400 mt-0.5">Wholesale items</span>
                            </div>
                        </Link>

                        <Link href="/admin/users" className="p-4 bg-gray-50/50 hover:bg-[#EEF2EE]/50 border border-gray-100 rounded-2xl flex flex-col justify-between group transition-all">
                            <div className="p-2 bg-green-50 text-[#1B4D28] w-fit rounded-xl">
                                <Users size={18} />
                            </div>
                            <div>
                                <span className="block text-sm font-bold text-gray-700 group-hover:text-[#1B4D28]">System Users</span>
                                <span className="block text-[10px] text-gray-400 mt-0.5">Farmers & Buyers</span>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
