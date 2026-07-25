"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { TrendingUp, BarChart2 } from "lucide-react";

export interface FarmerChartPoint {
    day: string;
    value: number;
}

interface FarmerChartProps {
    data?: FarmerChartPoint[];
    loading?: boolean;
}

export function FarmerChart({ data = [], loading = false }: FarmerChartProps) {
    const defaultData: FarmerChartPoint[] = [
        { day: "Mon", value: 0 },
        { day: "Tue", value: 0 },
        { day: "Wed", value: 0 },
        { day: "Thu", value: 0 },
        { day: "Fri", value: 0 },
    ];

    const chartPoints = data.length > 0 ? data : defaultData;
    const hasActiveVolume = data.some((d) => d.value > 0);

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-full flex flex-col min-h-[320px] justify-between font-sans">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-bold text-gray-800 tracking-tight">Farm Produce Sales Analytics</h3>
                    <p className="text-xs text-gray-400 font-normal">Recorded fulfillment & payouts</p>
                </div>
                <div className="p-2 bg-green-50 text-[#1B4D28] rounded-xl flex items-center gap-1.5 text-xs font-bold">
                    <TrendingUp size={14} />
                    <span>PostgreSQL</span>
                </div>
            </div>

            {/* Content / Loading / Empty */}
            {loading ? (
                <div className="flex-1 w-full min-h-[220px] bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">
                    <span className="text-xs text-gray-400">Loading sales chart...</span>
                </div>
            ) : !hasActiveVolume && data.length === 0 ? (
                <div className="flex-1 w-full min-h-[220px] flex flex-col items-center justify-center text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200 p-6">
                    <BarChart2 className="text-gray-300 mb-2" size={32} />
                    <h4 className="text-xs font-bold text-gray-700">No Sales Volume Recorded</h4>
                    <p className="text-[11px] text-gray-400 max-w-xs mt-1">
                        Sales analytics will be generated automatically as buyers purchase your listed produce.
                    </p>
                </div>
            ) : (
                <div className="flex-1 w-full min-h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartPoints}
                            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="farmerGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#1B4D28" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#1B4D28" stopOpacity={0} />
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
                                tickFormatter={(v) => `₦${v}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: "8px",
                                    border: "1px solid #f0f0f0",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                    fontSize: "12px",
                                }}
                                formatter={(val: any) => [`₦${(Number(val) || 0).toLocaleString()}`, "Sales Volume"]}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#1B4D28"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#farmerGradient)"
                                dot={{ fill: "white", stroke: "#1B4D28", strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, fill: "#1B4D28" }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
