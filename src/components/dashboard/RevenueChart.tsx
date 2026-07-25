"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, BarChart2 } from "lucide-react";

export interface ChartDataPoint {
    name: string;
    value: number;
}

interface RevenueChartProps {
    data?: ChartDataPoint[];
    loading?: boolean;
    title?: string;
}

export function RevenueChart({
    data = [],
    loading = false,
    title = "Weekly Spending & Trade",
}: RevenueChartProps) {
    const defaultPoints: ChartDataPoint[] = [
        { name: "Mon", value: 0 },
        { name: "Tue", value: 0 },
        { name: "Wed", value: 0 },
        { name: "Thu", value: 0 },
        { name: "Fri", value: 0 },
        { name: "Sat", value: 0 },
        { name: "Sun", value: 0 },
    ];

    const chartPoints = data.length > 0 ? data : defaultPoints;
    const hasActiveVolume = data.some((d) => d.value > 0);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h2>
                    <p className="text-xs text-gray-400 font-normal">Real-time trade & transaction volume</p>
                </div>
                <div className="p-2 bg-green-50 text-[#1B4D28] rounded-xl flex items-center gap-1.5 text-xs font-bold">
                    <TrendingUp size={14} />
                    <span>PostgreSQL</span>
                </div>
            </div>

            {loading ? (
                <div className="w-full h-[280px] bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center">
                    <span className="text-xs text-gray-400 font-medium">Loading trade metrics...</span>
                </div>
            ) : !hasActiveVolume && data.length === 0 ? (
                <div className="w-full h-[280px] flex flex-col items-center justify-center text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-6">
                    <BarChart2 className="text-gray-300 mb-2" size={32} />
                    <h4 className="text-sm font-bold text-gray-700">No Volume Activity Recorded</h4>
                    <p className="text-xs text-gray-400 max-w-xs mt-1">
                        Transaction activity will automatically render here as orders are placed and fulfilled.
                    </p>
                </div>
            ) : (
                <div className="w-full h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#1B4D28" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#1B4D28" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#9CA3AF", fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#4B5563", fontSize: 12 }}
                                tickFormatter={(val) => `$${val}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: "12px",
                                    border: "1px solid #f0f0f0",
                                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#1B4D28"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#colorValue)"
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
