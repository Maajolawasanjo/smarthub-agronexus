"use client";

import { useState } from "react";
import { MoreVertical, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = ["All Orders", "Active Orders", "Pending Orders", "Cancel Orders"];

/**
 * Mock Order Data
 */
const INITIAL_ORDERS = [
    { id: "83335", date: "Dec 23, 2025", status: "Pending", total: "$145.00" },
    { id: "90299", date: "Dec 18, 2025", status: "Delivered", total: "$345.00" },
    { id: "65109", date: "Dec 14, 2025", status: "Delivered", total: "$345.00" },
    { id: "83285", date: "Dec 11, 2025", status: "Canceled", total: "$345.00" },
    { id: "23856", date: "Dec 6, 2025", status: "Delivered", total: "$345.00" },
    { id: "23857", date: "Dec 6, 2025", status: "Delivered", total: "$345.00" },
    { id: "23858", date: "Dec 6, 2025", status: "Delivered", total: "$345.00" },
];

/**
 * MyListingsPage Component
 * 
 * Orchestrates the farmer's order management interface, featuring categorized 
 * tabs and a detailed data table for order tracking.
 */
export default function MyListingsPage() {
    const [activeTab, setActiveTab] = useState("All Orders");

    return (
        <div className="max-w-6xl mx-auto pb-12 px-4 md:px-0">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none">
                    <MoreVertical size={20} />
                </button>
            </div>

            {/* Navigation Category Tabs */}
            <div className="flex border-b border-gray-100 mb-8 overflow-x-auto no-scrollbar">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-6 md:px-10 py-4 text-xs md:text-sm font-bold whitespace-nowrap transition-all relative",
                            activeTab === tab
                                ? "text-gray-800 border-b-2 border-gray-800"
                                : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Data Table for Orders */}
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white">
                                <th className="px-8 py-6 text-xs md:text-sm font-bold text-gray-800">Order ID</th>
                                <th className="px-8 py-6 text-xs md:text-sm font-bold text-gray-800">Date</th>
                                <th className="px-8 py-6 text-xs md:text-sm font-bold text-gray-800">Status</th>
                                <th className="px-8 py-6 text-xs md:text-sm font-bold text-gray-800">Total</th>
                                <th className="px-8 py-6 text-xs md:text-sm font-bold text-gray-800 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {INITIAL_ORDERS.map((order, index) => (
                                <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-8 md:py-10">
                                        <p className="text-sm md:text-base font-medium text-gray-500">{order.id}</p>
                                    </td>
                                    <td className="px-8 py-8 md:py-10">
                                        <p className="text-sm md:text-base font-medium text-gray-500">{order.date}</p>
                                    </td>
                                    <td className="px-8 py-8 md:py-10">
                                        <span className={cn(
                                            "px-4 py-1.5 rounded-md text-[10px] md:text-xs font-bold",
                                            order.status === "Pending" && "bg-orange-50 text-orange-400",
                                            order.status === "Delivered" && "bg-green-50 text-green-400",
                                            order.status === "Canceled" && "bg-red-50 text-red-400"
                                        )}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-8 md:py-10">
                                        <p className="text-sm md:text-base font-medium text-gray-500">{order.total}</p>
                                    </td>
                                    <td className="px-8 py-8 md:py-10 text-right">
                                        <Link
                                            href={`/farmer/listings/${order.id}`}
                                            className="flex items-center justify-end gap-1 text-sm md:text-base font-bold text-gray-800 hover:gap-2 transition-all group"
                                        >
                                            View <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

