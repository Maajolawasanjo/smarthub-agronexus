"use client";

import React, { useState, useEffect } from "react";
import {
    Users as UsersIcon,
    TrendingUp,
    ShoppingBag,
    DollarSign,
    ChevronDown,
    Calendar,
    ArrowUpRight
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from "recharts";

// ─── MOCK DATA FOR CHARTS ───

// Month Sales data matching the bar heights approximately
const salesData = [
    { month: "Jan", sales: 580 },
    { month: "Feb", sales: 420 },
    { month: "Mar", sales: 530 },
    { month: "April", sales: 310 },
    { month: "May", sales: 570 },
    { month: "Jun", sales: 480 },
];

// Product categories matching the pie percentages
const categoryData = [
    { name: "Vegetable", value: 38, color: "#1B4D28" },
    { name: "Grains", value: 29, color: "#739072" },
    { name: "Tuber", value: 19, color: "#E28F10" },
    { name: "Fruit", value: 14, color: "#3B3DBF" },
];

// User growth / monthly revenue data matching the line chart path
const growthData = [
    { month: "Jan", value: 2200 },
    { month: "Feb", value: 3200 },
    { month: "Mar", value: 2800 },
    { month: "Apr", value: 4800 },
    { month: "May", value: 5200 },
];

export default function AnalyticsPage() {
    const [revenueFilter, setRevenueFilter] = useState("Monthly Revenue");
    const [mounted, setMounted] = useState(false);
    const [metrics, setMetrics] = useState({
        totalUsers: "2,847",
        totalSales: "2,384",
        totalRevenue: "₦ 6,674,346",
    });

    useEffect(() => {
        setMounted(true);
        async function fetchAnalytics() {
            try {
                const res = await fetch("/api/analytics");
                const data = await res.json();
                if (data.metrics) {
                    setMetrics({
                        totalUsers: data.metrics.totalUsers ? data.metrics.totalUsers.toLocaleString() : "2,847",
                        totalSales: data.metrics.totalOrders ? data.metrics.totalOrders.toLocaleString() : "2,384",
                        totalRevenue: data.metrics.totalTradeVolume ? `₦ ${Number(data.metrics.totalTradeVolume).toLocaleString()}` : "₦ 6,674,346",
                    });
                }
            } catch (err) {
                // Fallback
            }
        }
        fetchAnalytics();
    }, []);

    if (!mounted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] font-sans gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4D28]"></div>
                <span className="text-xs font-semibold text-gray-400 tracking-wider">Hydrating Analytics & Report...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header subtext */}
            <div className="-mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <p className="text-gray-500 text-sm">
                    Performance metrics insight
                </p>
                <div className="flex items-center gap-2 bg-white/80 border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm text-xs font-semibold text-gray-700">
                    <Calendar size={14} className="text-gray-400" />
                    March 2026
                </div>
            </div>

            {/* ─── METRIC CARD GRID (Image 1) ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Total Users */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-gray-800 tracking-tight">{metrics.totalUsers}</span>
                            <span className="text-sm font-medium text-gray-500 mt-0.5">Total Users</span>
                        </div>
                        <div className="p-2.5 bg-green-50 text-[#1B4D28] rounded-xl">
                            <UsersIcon size={20} />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-green-600 bg-green-50/50 px-2 py-0.5 rounded-md w-fit mt-2">
                        <span>↑ 5% from last month.</span>
                    </div>
                </div>

                {/* Card 2: Growth Rate */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-gray-800 tracking-tight">013</span>
                            <span className="text-sm font-medium text-gray-500 mt-0.5">Growth Rate</span>
                        </div>
                        <div className="p-2.5 bg-green-50 text-[#1B4D28] rounded-xl">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-green-600 bg-green-50/50 px-2 py-0.5 rounded-md w-fit mt-2">
                        <span>↑ 5% from last month.</span>
                    </div>
                </div>

                {/* Card 3: Total Sales */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-gray-800 tracking-tight">{metrics.totalSales}</span>
                            <span className="text-sm font-medium text-gray-500 mt-0.5">Total Sales</span>
                        </div>
                        <div className="p-2.5 bg-green-50 text-[#1B4D28] rounded-xl">
                            <ShoppingBag size={20} />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-green-600 bg-green-50/50 px-2 py-0.5 rounded-md w-fit mt-2">
                        <span>↑ 17% from last month.</span>
                    </div>
                </div>

                {/* Card 4: Revenue */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-gray-800 tracking-tight">{metrics.totalRevenue}</span>
                            <span className="text-sm font-medium text-gray-500 mt-0.5">Revenue</span>
                        </div>
                        <div className="p-2.5 bg-green-50 text-[#1B4D28] rounded-xl">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-green-600 bg-green-50/50 px-2 py-0.5 rounded-md w-fit mt-2">
                        <span>↑ 17% from last month.</span>
                    </div>
                </div>
            </div>

            {/* ─── CHARTS ROW 1: MONTH SALES & PRODUCT CATEGORY ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart: Month Sales */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 flex flex-col justify-between min-h-[360px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-800 text-base">Month Sales</h3>
                        <span className="text-xs text-gray-400 font-medium">Jan - Jun 2026</span>
                    </div>
                    <div className="w-full h-[260px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#9CA3AF", fontSize: 11, fontWeight: 500 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#9CA3AF", fontSize: 11, fontWeight: 500 }}
                                    domain={[0, 600]}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                                    cursor={{ fill: "#EEF2EE", opacity: 0.4 }}
                                />
                                <Bar
                                    dataKey="sales"
                                    fill="#1B4D28"
                                    radius={[8, 8, 0, 0]}
                                    maxBarSize={48}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart: Product Category */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[360px]">
                    <h3 className="font-bold text-gray-800 text-base mb-4">Product Category</h3>
                    <div className="flex-1 flex flex-col items-center justify-center relative min-h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => [`${value}%`, "Market Share"]}
                                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Share</span>
                            <span className="text-xl font-extrabold text-gray-700">B2B</span>
                        </div>
                    </div>
                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-50">
                        {categoryData.map((entry) => (
                            <div key={entry.name} className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                                <span className="text-[11px] font-semibold text-gray-600 truncate">{entry.name} {entry.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── CHARTS ROW 2: USER GROWTH ─── */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[380px]">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex flex-col">
                        <h3 className="font-bold text-gray-800 text-base">User Growth</h3>
                    </div>
                    <div className="relative">
                        <select
                            value={revenueFilter}
                            onChange={(e) => setRevenueFilter(e.target.value)}
                            className="appearance-none bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl px-4 py-2 pr-9 focus:outline-none focus:border-[#1B4D28] hover:bg-gray-100 cursor-pointer shadow-sm"
                        >
                            <option>Monthly Revenue</option>
                            <option>Weekly Revenue</option>
                            <option>Annual Revenue</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                <div className="w-full h-[260px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={growthData} margin={{ top: 10, right: 15, left: 15, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#9CA3AF", fontSize: 11, fontWeight: 500 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#9CA3AF", fontSize: 11, fontWeight: 500 }}
                                tickFormatter={(value) => {
                                    if (value === undefined || value === null) return "₦0";
                                    return `₦${Number(value).toLocaleString()}`;
                                }}
                                domain={[0, 6000]}
                            />
                            <Tooltip
                                formatter={(value: any) => {
                                    if (value === undefined || value === null) return ["₦0", "Volume"];
                                    return [`₦${Number(value).toLocaleString()}`, "Volume"];
                                }}
                                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 6px 16px rgba(0,0,0,0.06)" }}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#4CAF50"
                                strokeWidth={2.5}
                                dot={{ fill: "white", stroke: "#4CAF50", strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, fill: "#1B4D28", stroke: "white", strokeWidth: 1.5 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
