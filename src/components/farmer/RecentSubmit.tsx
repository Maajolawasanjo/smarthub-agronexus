"use client";

import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface SubmitItem {
    name: string;
    type: string;
    date: string;
    status: "Pending" | "Successful" | "Cancel";
}

const submissions: SubmitItem[] = [
    { name: "Yam", type: "Abuja Yam", date: "Feb 18", status: "Pending" },
    { name: "Pepper", type: "Yellow Tomato", date: "Jan 04", status: "Successful" },
    { name: "Pepper", type: "Yellow Tomato", date: "Jan 01", status: "Successful" },
    { name: "Pepper", type: "Yellow Tomato", date: "Dec 28", status: "Successful" },
    { name: "Rice", type: "Ghana rice", date: "Feb 18", status: "Cancel" },
];

const statusConfig = {
    Pending: {
        label: "Pending",
        class: "text-orange-500",
        dot: "bg-orange-400",
    },
    Successful: {
        label: "Successful",
        class: "text-green-600",
        dot: "bg-green-500",
    },
    Cancel: {
        label: "Cancel",
        class: "text-red-500",
        dot: "bg-red-400",
    },
};

export function RecentSubmit() {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-800">Recent Submit</h3>
                <button className="text-xs text-[#1B4D28] font-medium hover:underline">
                    View All
                </button>
            </div>

            {/* Table */}
            <div className="space-y-0">
                {submissions.map((item, index) => {
                    const cfg = statusConfig[item.status];
                    return (
                        <div
                            key={index}
                            className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
                        >
                            {/* Name + type + date */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-800 font-medium leading-tight">
                                    <span className="font-semibold">{item.name}</span>
                                    <span className="text-gray-400 font-normal text-xs ml-1">
                                        ({item.type})
                                    </span>
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-gray-400">{item.date}</span>
                                    <span className="text-gray-300">•</span>
                                    <span className={cn("text-xs font-medium flex items-center gap-1", cfg.class)}>
                                        <span className={cn("w-1.5 h-1.5 rounded-full inline-block", cfg.dot)} />
                                        {cfg.label}
                                    </span>
                                </div>
                            </div>

                            {/* View button */}
                            <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#1B4D28] transition-colors ml-3 flex-shrink-0">
                                View
                                <ArrowRight size={12} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
