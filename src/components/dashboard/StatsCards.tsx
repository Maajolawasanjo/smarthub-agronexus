"use client";

import { CheckCircle, RefreshCw, DollarSign, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsProps {
    totalOrders?: number;
    activeOrders?: number;
    totalSpent?: number;
    escrowBalance?: number;
    loading?: boolean;
}

export function StatsCards({
    totalOrders = 0,
    activeOrders = 0,
    totalSpent = 0,
    escrowBalance = 0,
    loading = false,
}: StatsProps) {
    const cards = [
        {
            label: "Total Orders",
            value: totalOrders.toString(),
            icon: ShoppingBag,
            iconColor: "text-[#1B4D28]",
            bgIconColor: "bg-green-50",
        },
        {
            label: "Orders In Progress",
            value: activeOrders.toString().padStart(2, "0"),
            icon: RefreshCw,
            iconColor: "text-[#1B4D28]",
            bgIconColor: "bg-green-50",
        },
        {
            label: "Total Escrow Balance",
            value: `$${escrowBalance.toLocaleString()}`,
            icon: DollarSign,
            iconColor: "text-[#1B4D28]",
            bgIconColor: "bg-green-50",
        },
        {
            label: "Total Completed Purchases",
            value: `$${totalSpent.toLocaleString()}`,
            icon: CheckCircle,
            iconColor: "text-[#1B4D28]",
            bgIconColor: "bg-green-50",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((stat) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={stat.label}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between gap-4"
                    >
                        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", stat.bgIconColor)}>
                            <Icon className={cn("w-6 h-6", stat.iconColor)} />
                        </div>
                        <div>
                            {loading ? (
                                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded my-1" />
                            ) : (
                                <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">{stat.value}</h3>
                            )}
                            <p className="text-gray-500 text-xs font-medium mt-1">{stat.label}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
