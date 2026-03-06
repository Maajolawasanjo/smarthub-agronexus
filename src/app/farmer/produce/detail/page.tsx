"use client";

import {
    ChevronLeft,
    Calendar,
    MapPin,
    Box,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * DetailIcon Helper Component
 * 
 * Displays a metric label and value with a corresponding icon.
 */
const DetailItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-2 shadow-sm">
        <div className="flex items-center gap-2 text-gray-400">
            <Icon size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </div>
        <p className="text-sm font-bold text-gray-800">{value}</p>
    </div>
);

/**
 * ProduceDetailPage Component
 * 
 * Displays comprehensive details for a specific produce batch, 
 * including status, harvest metrics, farmer notes, and logistics data.
 */
export default function ProduceDetailPage() {
    return (
        <div className="max-w-5xl mx-auto pb-12">
            {/* Header & Back Button */}
            <div className="mb-6 flex items-center justify-between">
                <Link
                    href="/farmer"
                    className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors w-fit"
                >
                    <ChevronLeft size={16} />
                    Back
                </Link>
            </div>

            <div className="space-y-6">

                {/* Batch Identification and Status */}
                <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-xl font-bold text-gray-800">Yam <span className="text-gray-400 font-medium">(Abuja Yam)</span></h1>
                                <span className="bg-orange-50 text-orange-500 px-4 py-1 rounded-full text-[10px] font-bold border border-orange-100">
                                    Pending
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                                    <Calendar size={14} />
                                    Submitted Feb 21, 2026
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                                    <MapPin size={14} />
                                    Kaduna
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats and Additional Information */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    {/* Stats */}
                    <div className="md:col-span-5 grid grid-cols-2 gap-4">
                        <DetailItem icon={Box} label="Quantity" value="043" />
                        <DetailItem icon={Calendar} label="Harvest Date" value="Feb 20, 2026" />
                    </div>

                    {/* Farmer Note */}
                    <div className="md:col-span-7 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                            <h3 className="text-[10px] font-bold uppercase tracking-wider">Farmer Note</h3>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed font-medium">
                            It can be stored for as long as three month or even more
                        </p>
                    </div>
                </div>

                {/* Media Gallery */}
                <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-8">
                    <h3 className="text-sm font-bold text-gray-800 mb-6">Images</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        <div className="aspect-[4/3] bg-gray-100 rounded-xl"></div>
                        <div className="aspect-[4/3] bg-gray-100 rounded-xl"></div>
                    </div>
                </div>

                {/* Pricing and Logistics Documentation */}
                <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-50">
                        <div className="px-8 py-5 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-400">Asking Price</span>
                            <span className="text-sm font-bold text-gray-800">N300,000.00</span>
                        </div>
                        <div className="px-8 py-5 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-400">Selling Price</span>
                            <span className="text-sm font-bold text-gray-800">N300,000.00</span>
                        </div>
                        <div className="px-8 py-5 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-400">Batch Code</span>
                            <span className="text-sm font-bold text-gray-800">EA36GH723</span>
                        </div>
                        <div className="px-8 py-5 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-tighter">LOGISTICS</span>
                            <span className="text-sm font-bold text-[#1B4D28]">Agrolink Pickup</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
