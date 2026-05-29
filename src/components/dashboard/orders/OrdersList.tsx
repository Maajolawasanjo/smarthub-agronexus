"use client";

import { useState } from "react";

interface Order {
    id: string;
    date: string;
    status: "Pending" | "Delivered" | "Canceled";
    total: string;
}

const mockOrders: Order[] = [
    { id: "83335", date: "Dec 23, 2025", status: "Pending", total: "$145.00" },
    { id: "90299", date: "Dec 18, 2025", status: "Delivered", total: "$345.00" },
    { id: "65109", date: "Dec 14, 2025", status: "Delivered", total: "$345.00" },
    { id: "83285", date: "Dec 11, 2025", status: "Canceled", total: "$345.00" },
    { id: "23856", date: "Dec 6, 2025", status: "Delivered", total: "$345.00" },
    { id: "23857", date: "Dec 6, 2025", status: "Delivered", total: "$345.00" },
    { id: "23858", date: "Dec 6, 2025", status: "Delivered", total: "$345.00" },
];

const tabs = ["All Orders", "Active Orders", "Pending Orders", "Cancel Orders"];

interface OrdersListProps {
    searchQuery: string;
}

export function OrdersList({ searchQuery }: OrdersListProps) {
    const [activeTab, setActiveTab] = useState("All Orders");

    const getStatusColor = (status: Order["status"]) => {
        switch (status) {
            case "Pending":
                return "bg-yellow-50 text-yellow-600";
            case "Delivered":
                return "bg-green-50 text-green-600";
            case "Canceled":
                return "bg-red-50 text-red-600";
            default:
                return "bg-gray-50 text-gray-600";
        }
    };

    const filteredOrders = mockOrders.filter((order) => {
        // Tab filtering
        let matchesTab = true;
        if (activeTab === "Pending Orders") matchesTab = order.status === "Pending";
        else if (activeTab === "Cancel Orders") matchesTab = order.status === "Canceled";
        else if (activeTab === "Active Orders") matchesTab = ["Pending", "Delivered"].includes(order.status);

        // Search filtering
        const matchesSearch =
            order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.total.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.date.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesTab && matchesSearch;
    });

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            {/* Tabs */}
            <div className="flex items-center gap-8 border-b border-gray-100 mb-6 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === tab
                            ? "text-gray-900"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900 rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-gray-500 text-sm">
                            <th className="pb-4 font-medium pl-4">Order ID</th>
                            <th className="pb-4 font-medium">Date</th>
                            <th className="pb-4 font-medium">Status</th>
                            <th className="pb-4 font-medium text-right pr-4">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50/50">
                        {filteredOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 pl-4 text-gray-600">{order.id}</td>
                                <td className="py-4 text-gray-600">{order.date}</td>
                                <td className="py-4">
                                    <span
                                        className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(
                                            order.status
                                        )}`}
                                    >
                                        {order.status}
                                    </span>
                                </td>
                                <td className="py-4 text-right pr-4 text-gray-900 font-medium">
                                    {order.total}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
