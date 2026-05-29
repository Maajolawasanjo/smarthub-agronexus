"use client";

import { FarmerStatsCards } from "@/components/farmer/FarmerStatsCards";
import { SubmitFarmProduce } from "@/components/farmer/SubmitFarmProduce";
import { FieldAgent } from "@/components/farmer/FieldAgent";
import { RecentSubmit } from "@/components/farmer/RecentSubmit";
import { FarmerChart } from "@/components/farmer/FarmerChart";

export default function FarmerOverviewPage() {
    return (
        <div className="space-y-5">
            {/* Stats Row */}
            <FarmerStatsCards />

            {/* Main content: Left column + Right column (chart) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

                {/* LEFT COLUMN */}
                <div className="flex flex-col gap-5">
                    <SubmitFarmProduce />
                    <FieldAgent />
                    <RecentSubmit />
                </div>

                {/* RIGHT COLUMN — chart */}
                <div className="h-full min-h-[400px]">
                    <FarmerChart />
                </div>
            </div>
        </div>
    );
}
