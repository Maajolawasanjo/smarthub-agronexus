"use client";

import { TrackingTimeline } from "@/components/dashboard/tracking/TrackingTimeline";
import { TrackingDetails } from "@/components/dashboard/tracking/TrackingDetails";
import { TrackingItemList } from "@/components/dashboard/tracking/TrackingItemList";
import { TrackingMap } from "@/components/dashboard/tracking/TrackingMap";
import { Search } from "lucide-react";

export default function TrackingPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Tracking</h2>
                    <p className="text-sm text-gray-500">Order #136091</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search Orders. Invoice.."
                        className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-[#1B4D28]"
                    />
                </div>
            </div>

            <TrackingTimeline />

            <TrackingDetails />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TrackingItemList />
                <TrackingMap />
            </div>
        </div>
    );
}
