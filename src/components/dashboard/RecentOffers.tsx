"use client";

import { cn } from "@/lib/utils";

const offers = [
    { name: "Cashew", status: "Shipped" },
    { name: "Cocoa Beans", status: "Processing" },
    { name: "Ginger", status: "Shipped" },
    { name: "Hibiscus", status: "Shipped" },
];

export function RecentOffers() {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-700">Recent Offer</h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left border-b border-gray-100">
                            <th className="pb-4 pt-2 font-medium text-gray-500 text-sm">Product Name</th>
                            <th className="pb-4 pt-2 font-medium text-gray-500 text-sm text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50/50">
                        {offers.map((offer, index) => (
                            <tr key={index}>
                                <td className="py-4 text-gray-800 font-medium">{offer.name}</td>
                                <td className="py-4 text-right">
                                    <span
                                        className={cn(
                                            "px-4 py-1.5 rounded-full text-xs font-medium inline-block min-w-[80px] text-center",
                                            offer.status === "Shipped"
                                                ? "bg-green-50 text-green-600"
                                                : "bg-orange-50 text-orange-400"
                                        )}
                                    >
                                        {offer.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 text-right">
                <button className="text-sm font-semibold text-gray-600 hover:text-[#1B4D28]">
                    View More
                </button>
            </div>
        </div>
    );
}
