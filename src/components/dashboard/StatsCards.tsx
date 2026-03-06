"use client";

import { CheckCircle, RefreshCw, DollarSign, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    label: string;
    value: string;
    icon: any;
    iconColor: string;
    bgIconColor: string;
}

const stats = [
    {
        label: "Total Quote",
        value: "125",
        icon: CheckCircle,
        iconColor: "text-green-600",
        bgIconColor: "bg-green-50",
    },
    {
        label: "Order in progress",
        value: "043",
        icon: RefreshCw,
        iconColor: "text-green-600",
        bgIconColor: "bg-green-50",
    },
    {
        label: "Total Amount",
        value: "$1,346",
        icon: DollarSign,
        iconColor: "text-green-600",
        bgIconColor: "bg-green-50",
    },
    {
        label: "Total buyers",
        value: "1,200",
        icon: Users,
        iconColor: "text-green-600",
        bgIconColor: "bg-green-50",
    },
];

function StatCard({ label, value, icon: Icon, iconColor, bgIconColor }: StatCardProps) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", bgIconColor)}>
                <Icon className={cn("w-6 h-6", iconColor)} />
            </div>
            <div>
                <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
                <p className="text-gray-500 text-sm mt-1">{label}</p>
            </div>
        </div>
    );
}

export function StatsCards() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
                <StatCard key={stat.label} {...stat} />
            ))}
        </div>
    );
}
