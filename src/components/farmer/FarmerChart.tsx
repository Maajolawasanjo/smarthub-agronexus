"use client";

import { useState } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { ChevronDown } from "lucide-react";

const weeklyData = [
    { day: "Mon", value: 1000 },
    { day: "Tue", value: 2000 },
    { day: "Wed", value: 3000 },
    { day: "Thur", value: 2000 },
    { day: "Friday", value: 5500 },
];

const cropOptions = ["Rice/Tons", "Yam/Tons", "Pepper/Tons", "Cashew/Tons"];
const periodOptions = ["Weekly Chart", "Monthly Chart", "Yearly Chart"];

export function FarmerChart() {
    const [selectedCrop, setSelectedCrop] = useState("Rice/Tons");
    const [selectedPeriod, setSelectedPeriod] = useState("Weekly Chart");
    const [showCropDropdown, setShowCropDropdown] = useState(false);
    const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-full flex flex-col min-h-[320px]">
            {/* Dropdowns row */}
            <div className="flex items-center gap-3 mb-4">
                {/* Crop selector */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowCropDropdown(!showCropDropdown);
                            setShowPeriodDropdown(false);
                        }}
                        className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 bg-white"
                    >
                        {selectedCrop}
                        <ChevronDown size={12} />
                    </button>
                    {showCropDropdown && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-20 min-w-[130px]">
                            {cropOptions.map((o) => (
                                <button
                                    key={o}
                                    onClick={() => {
                                        setSelectedCrop(o);
                                        setShowCropDropdown(false);
                                    }}
                                    className="block w-full text-left text-xs px-4 py-2 hover:bg-gray-50 text-gray-700 first:rounded-t-lg last:rounded-b-lg"
                                >
                                    {o}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Period selector */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowPeriodDropdown(!showPeriodDropdown);
                            setShowCropDropdown(false);
                        }}
                        className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 bg-white"
                    >
                        {selectedPeriod}
                        <ChevronDown size={12} />
                    </button>
                    {showPeriodDropdown && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-20 min-w-[130px]">
                            {periodOptions.map((o) => (
                                <button
                                    key={o}
                                    onClick={() => {
                                        setSelectedPeriod(o);
                                        setShowPeriodDropdown(false);
                                    }}
                                    className="block w-full text-left text-xs px-4 py-2 hover:bg-gray-50 text-gray-700 first:rounded-t-lg last:rounded-b-lg"
                                >
                                    {o}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={weeklyData}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="farmerGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                            stroke="#F0F0F0"
                        />
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#9CA3AF", fontSize: 11 }}
                            dy={8}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#6B7280", fontSize: 11 }}
                            tickFormatter={(v) => `N${(v / 1000).toFixed(0)},000`}
                            domain={[0, 6000]}
                            ticks={[0, 1000, 2000, 3000, 4000, 5000, 6000]}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: "8px",
                                border: "none",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                fontSize: "12px",
                            }}
                            formatter={(value: number | undefined) => [`N${(value ?? 0).toLocaleString()}`, selectedCrop]}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#22C55E"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#farmerGradient)"
                            dot={{ fill: "white", stroke: "#22C55E", strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: "#1B4D28" }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
