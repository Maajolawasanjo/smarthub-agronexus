"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight, PlusCircle } from "lucide-react";

export interface FarmerSubmissionItem {
    id: string;
    name: string;
    type: string;
    date: string;
    status: "Pending" | "Successful" | "Cancel";
}

interface RecentSubmitProps {
    submissions?: FarmerSubmissionItem[];
    loading?: boolean;
}

const statusConfig = {
    Pending: {
        label: "Pending Verification",
        class: "text-amber-600",
        dot: "bg-amber-500",
    },
    Successful: {
        label: "Active & Verified",
        class: "text-green-600",
        dot: "bg-green-500",
    },
    Cancel: {
        label: "Unlisted",
        class: "text-red-500",
        dot: "bg-red-400",
    },
};

export function RecentSubmit({ submissions = [], loading = false }: RecentSubmitProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-800 tracking-tight">Recent Submissions</h3>
                <Link href="/farmer/listings" className="text-xs text-[#1B4D28] font-bold hover:underline">
                    View All
                </Link>
            </div>

            {/* Loading / Content / Empty */}
            {loading ? (
                <div className="space-y-3 py-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-10 bg-gray-100 animate-pulse rounded-lg" />
                    ))}
                </div>
            ) : submissions.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 bg-green-50 text-[#1B4D28] rounded-full flex items-center justify-center mb-2">
                        <PlusCircle size={20} />
                    </div>
                    <h4 className="text-xs font-bold text-gray-800 mb-1">No Produce Submissions Yet</h4>
                    <p className="text-[11px] text-gray-400 max-w-xs mb-4">
                        You haven&apos;t listed any agricultural produce yet. Submit your first batch to start receiving bulk orders.
                    </p>
                    <Link
                        href="/farmer/sell"
                        className="px-4 py-2 bg-[#1B4D28] hover:bg-[#143d20] text-white text-xs font-semibold rounded-full transition-colors"
                    >
                        List Produce Now
                    </Link>
                </div>
            ) : (
                <div className="space-y-0">
                    {submissions.map((item) => {
                        const cfg = statusConfig[item.status] || statusConfig.Pending;
                        return (
                            <div
                                key={item.id}
                                className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-800 font-medium leading-tight">
                                        <span className="font-bold">{item.name}</span>
                                        {item.type && (
                                            <span className="text-gray-400 font-normal text-xs ml-1">
                                                ({item.type})
                                            </span>
                                        )}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-gray-400">{item.date}</span>
                                        <span className="text-gray-300">•</span>
                                        <span className={cn("text-xs font-semibold flex items-center gap-1", cfg.class)}>
                                            <span className={cn("w-1.5 h-1.5 rounded-full inline-block", cfg.dot)} />
                                            {cfg.label}
                                        </span>
                                    </div>
                                </div>

                                <Link
                                    href="/farmer/listings"
                                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#1B4D28] font-medium transition-colors ml-3 flex-shrink-0"
                                >
                                    Details
                                    <ArrowRight size={12} />
                                </Link>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
