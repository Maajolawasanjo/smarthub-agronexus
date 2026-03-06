"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronDown } from "lucide-react";

const data = [
    { name: "Mon", value: 2200 },
    { name: "Tue", value: 3000 },
    { name: "Wed", value: 2600 },
    { name: "Thur", value: 3100 },
    { name: "Fri", value: 4500 }, // Peak as per image logic approx
    { name: "Sat", value: 4800 },
    { name: "Sun", value: 5000 },
];

// Custom line chart attempting to match the design (green line, filled area below maybe?)
// The design shows a green line with dots. Recharts AreaChart with fill opacity 0 essentially looks like a line but we can add light fill if needed.
// Actually, using AreaChart with a gradient fill is common for "Revenue" charts.
// Let's stick closer to the image: Simple line or Area with very light green.

export function RevenueChart() {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div className="relative">
                    <button className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
                        Weekly Revenue
                        <ChevronDown size={16} />
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#4B5563', fontSize: 12 }}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#22C55E"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                            dot={{ fill: 'white', stroke: '#22C55E', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: '#1B4D28' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
