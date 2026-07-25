"use client";

import { RefreshCw, CheckCircle, Wallet, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FarmerStatsProps {
    pendingOrders?: number;
    activeOrders?: number;
    revenue?: number;
    totalSales?: number;
    loading?: boolean;
}

export function FarmerStatsCards({
    pendingOrders = 0,
    activeOrders = 0,
    revenue = 0,
    totalSales = 0,
    loading = false,
}: FarmerStatsProps) {
    const formattedRevenue = `₦${Number(revenue).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

    const stats = [
        {
            label: "Pending Orders",
            value: pendingOrders.toString().padStart(2, "0"),
            icon: RefreshCw,
            iconColor: "text-amber-600",
            bgColor: "bg-amber-50",
            action: { label: "View Pending", href: "/farmer/orders" },
        },
        {
            label: "Active Orders",
            value: activeOrders.toString().padStart(2, "0"),
            icon: CheckCircle,
            iconColor: "text-green-600",
            bgColor: "bg-green-50",
            action: { label: "Track Orders", href: "/farmer/orders" },
        },
        {
            label: "Total Revenue",
            value: formattedRevenue,
            icon: Wallet,
            iconColor: "text-emerald-600",
            bgColor: "bg-emerald-50",
            action: { label: "Withdraw Funds", href: "/farmer/wallet" },
        },
        {
            label: "Completed Sales",
            value: totalSales.toString(),
            icon: TrendingUp,
            iconColor: "text-blue-600",
            bgColor: "bg-blue-50",
            action: { label: "View Analytics", href: "/farmer/analytics" },
        },
    ];


    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between gap-3">
                        <div className="flex items-center gap-4">
                            <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0", stat.bgColor)}>
                                <Icon className={cn("w-5 h-5", stat.iconColor)} />
                            </div>
                            <div className="overflow-hidden">
                                {loading ? (
                                    <div className="h-6 w-20 bg-gray-200 animate-pulse rounded my-0.5" />
                                ) : (
                                    <h3 className="text-xl md:text-2xl font-extrabold text-gray-900 leading-tight truncate">
                                        {stat.value}
                                    </h3>
                                )}
                                <p className="text-gray-500 text-xs font-semibold">{stat.label}</p>
                            </div>
                        </div>

                        {stat.action && (
                            <div className="pt-2 border-t border-gray-50 flex justify-end">
                                <Link
                                    href={stat.action.href}
                                    className="text-[11px] font-bold text-[#1B4D28] hover:underline flex items-center gap-1"
                                >
                                    {stat.action.label} <ArrowRight size={12} />
                                </Link>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
