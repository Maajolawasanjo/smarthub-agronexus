"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ShoppingBag, ArrowRight } from "lucide-react";

export interface OrderOfferItem {
    id: string;
    orderNumber?: string;
    name: string;
    status: string;
    totalAmount?: number;
    date?: string;
}

interface RecentOffersProps {
    orders?: OrderOfferItem[];
    loading?: boolean;
}

const statusColorMap: Record<string, { bg: string; text: string }> = {
    DELIVERED: { bg: "bg-green-50", text: "text-green-700" },
    COMPLETED: { bg: "bg-green-50", text: "text-green-700" },
    SHIPPED: { bg: "bg-emerald-50", text: "text-emerald-700" },
    IN_TRANSIT: { bg: "bg-blue-50", text: "text-blue-700" },
    PROCESSING: { bg: "bg-amber-50", text: "text-amber-700" },
    PENDING: { bg: "bg-orange-50", text: "text-orange-700" },
    CANCELLED: { bg: "bg-red-50", text: "text-red-700" },
};

export function RecentOffers({ orders = [], loading = false }: RecentOffersProps) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">Recent Orders</h2>
                    <Link
                        href="/dashboard/orders"
                        className="text-xs font-bold text-[#1B4D28] hover:underline flex items-center gap-1"
                    >
                        View All
                        <ArrowRight size={14} />
                    </Link>
                </div>

                {loading ? (
                    <div className="space-y-4 py-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-10 bg-gray-100 animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
                            <ShoppingBag className="text-[#1B4D28]" size={20} />
                        </div>
                        <h4 className="text-sm font-bold text-gray-800 mb-1">No Orders Placed Yet</h4>
                        <p className="text-xs text-gray-500 max-w-xs mb-4">
                            You haven&apos;t placed any commodity orders yet. Explore our verified marketplace to start trading.
                        </p>
                        <Link
                            href="/dashboard/products"
                            className="px-4 py-2 bg-[#1B4D28] hover:bg-[#143d20] text-white text-xs font-semibold rounded-full transition-colors"
                        >
                            Explore Marketplace
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-gray-100">
                                    <th className="pb-3 font-semibold text-gray-400 text-xs">Product</th>
                                    <th className="pb-3 font-semibold text-gray-400 text-xs text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {orders.map((offer) => {
                                    const style = statusColorMap[offer.status?.toUpperCase()] || {
                                        bg: "bg-gray-100",
                                        text: "text-gray-700",
                                    };
                                    return (
                                        <tr key={offer.id}>
                                            <td className="py-3.5 text-gray-800 font-medium text-sm">
                                                <div>
                                                    <span className="block font-semibold">{offer.name}</span>
                                                    {offer.orderNumber && (
                                                        <span className="text-[10px] text-gray-400 font-normal">
                                                            {offer.orderNumber}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3.5 text-right">
                                                <span
                                                    className={cn(
                                                        "px-3 py-1 rounded-full text-xs font-bold inline-block min-w-[75px] text-center",
                                                        style.bg,
                                                        style.text
                                                    )}
                                                >
                                                    {offer.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
