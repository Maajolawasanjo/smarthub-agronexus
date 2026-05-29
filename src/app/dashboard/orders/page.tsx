"use client";

import { OrdersList } from "@/components/dashboard/orders/OrdersList";
import { Search } from "lucide-react";
import { useState } from "react";

export default function OrdersPage() {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Orders</h2>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search Orders, Invoice.."
                        className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-[#1B4D28]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <OrdersList searchQuery={searchQuery} />
        </div>
    );
}
