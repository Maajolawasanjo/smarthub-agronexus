"use client";

import { RefreshCw, CheckCircle, DollarSign, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    label: string;
    value: string;
    icon: React.ElementType;
    iconColor: string;
    bgColor: string;
}

const stats = [
    {
        label: "Pending Orders",
        value: "013",
        icon: RefreshCw,
        iconColor: "text-green-600",
        bgColor: "bg-green-50",
    },
    {
        label: "Active Orders",
        value: "030",
        icon: CheckCircle,
        iconColor: "text-green-600",
        bgColor: "bg-green-50",
    },
    {
        label: "Revenue",
        value: "$1,346",
        icon: DollarSign,
        iconColor: "text-green-600",
        bgColor: "bg-green-50",
    },
    {
        label: "Total Sales",
        value: "1,200",
        icon: TrendingUp,
        iconColor: "text-green-600",
        bgColor: "bg-green-50",
    },
];

function StatCard({ label, value, icon: Icon, iconColor, bgColor }: StatCardProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", bgColor)}>
                <Icon className={cn("w-5 h-5", iconColor)} />
            </div>
            <div>
                <h3 className="text-2xl font-bold text-gray-800 leading-tight">{value}</h3>
                <p className="text-gray-500 text-xs mt-0.5">{label}</p>
            </div>
        </div>
    );
}

export function FarmerStatsCards() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
                <StatCard key={stat.label} {...stat} />
            ))}
        </div>
    );
}
