"use client";

import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentOffers } from "@/components/dashboard/RecentOffers";
import { RevenueChart } from "@/components/dashboard/RevenueChart";

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <StatsCards />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto md:h-[400px]">
                <RecentOffers />
                <RevenueChart />
            </div>
        </div>
    );
}
