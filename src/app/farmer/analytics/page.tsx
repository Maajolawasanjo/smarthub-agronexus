"use client";

import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, PieChart, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

export default function FarmerAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    totalGrossRevenue: number;
    formattedTotalGrossRevenue: string;
    totalNetPayout: number;
    formattedTotalNetPayout: string;
    totalPlatformFees: number;
    formattedTotalPlatformFees: string;
    totalVatFees: number;
    formattedTotalVatFees: string;
    fulfillmentRatePct: number;
    totalOrdersCount: number;
    completedOrdersCount: number;
    topPerformingProduce: { name: string; quantity: number; revenue: number; formattedRevenue: string }[];
    monthlySalesTrend: { month: string; revenue: number; orders: number }[];
  } | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/farmer/analytics");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    } finally {
      setLoading(false);
    }
  };

  const maxRevenue = Math.max(...(data?.monthlySalesTrend || []).map((m) => m.revenue), 1);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Key Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Gross Sales Revenue</span>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{data?.formattedTotalGrossRevenue ?? "₦0.00"}</h3>
              <p className="text-xs text-gray-500 mt-1">Total completed sales</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Net Wallet Earnings</span>
              <h3 className="text-2xl font-bold text-emerald-600 mt-2">{data?.formattedTotalNetPayout ?? "₦0.00"}</h3>
              <p className="text-xs text-emerald-700/70 mt-1">After 2.5% platform fee</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Platform Commission (2.5%)</span>
              <h3 className="text-2xl font-bold text-amber-600 mt-2">{data?.formattedTotalPlatformFees ?? "₦0.00"}</h3>
              <p className="text-xs text-gray-500 mt-1">Marketplace service fees</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Fulfillment Rate</span>
              <h3 className="text-2xl font-bold text-blue-600 mt-2">{data?.fulfillmentRatePct ?? 100}%</h3>
              <p className="text-xs text-gray-500 mt-1">{data?.completedOrdersCount ?? 0} of {data?.totalOrdersCount ?? 0} orders delivered</p>
            </div>
          </div>

          {/* Monthly Sales Revenue Chart */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Monthly Sales Revenue Trend</h2>
                <p className="text-xs text-gray-400">Calculated over the last 6 calendar months</p>
              </div>
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#1B4D28]">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Live SQL Analytics</span>
              </span>
            </div>

            {loading ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Loading sales analytics...</div>
            ) : (
              <div className="h-56 flex items-end justify-between gap-4 pt-8 pb-2 px-4 border-b border-gray-100">
                {(data?.monthlySalesTrend || []).map((item, idx) => {
                  const barHeight = Math.max(10, Math.round((item.revenue / maxRevenue) * 100));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded transition-all pointer-events-none whitespace-nowrap z-10">
                        ₦{item.revenue.toLocaleString()} ({item.orders} orders)
                      </div>
                      
                      <div
                        className="w-full bg-[#1B4D28] group-hover:bg-emerald-600 rounded-t-xl transition-all duration-300"
                        style={{ height: `${barHeight}%` }}
                      />
                      <span className="text-[11px] font-bold text-gray-500">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Produce Items Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Top Performing Produce Batches</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="py-3 px-4">Produce Name</th>
                    <th className="py-3 px-4 text-center">Total Quantity Sold</th>
                    <th className="py-3 px-4 text-right">Gross Generated Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(data?.topPerformingProduce || []).length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-gray-400 text-sm">
                        No sales recorded yet. Publish harvest stock to start tracking produce performance.
                      </td>
                    </tr>
                  ) : (
                    data?.topPerformingProduce.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/80">
                        <td className="py-3.5 px-4 font-semibold text-gray-900">{p.name}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-gray-700">{p.quantity} units</td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600">{p.formattedRevenue}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
    </div>
  );
}
