"use client";

import { useEffect, useState, useCallback } from "react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentOffers } from "@/components/dashboard/RecentOffers";
import { AlertTriangle, RefreshCw, Box, ShoppingCart, Wallet, Settings } from "lucide-react";
import Link from "next/link";
import { DashboardDTO } from "@/types/page-dtos";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardDTO | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Session expired. Please log in to access your buyer dashboard.");
        }
        throw new Error("Failed to load buyer dashboard data.");
      }
      const data: DashboardDTO = await res.json();
      setDashboardData(data);
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Unable to fetch live dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (error) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-red-100 p-8 shadow-sm">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-base font-bold text-gray-800 mb-1">Dashboard Error</h3>
        <p className="text-xs text-gray-500 max-w-md mb-6">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1B4D28] text-white text-xs font-semibold rounded-full hover:bg-[#143d20] transition-colors cursor-pointer"
        >
          <RefreshCw size={14} /> Retry Connection
        </button>
      </div>
    );
  }

  const stats = dashboardData?.statistics;
  const wallet = dashboardData?.walletSummary;
  const recentOrders = dashboardData?.recentOrders || [];
  const profileComp = dashboardData?.profileCompletion;

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">

      {/* Welcome Banner */}
      <div className="bg-[#0A3918] text-white rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-green-950/20">
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-green-300">
            BUYER PORTAL
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, {dashboardData?.user?.fullName || "Buyer"} 👋
          </h1>
          <p className="text-xs text-green-200/80 font-serif italic">
            "{profileComp?.recommendedNextAction || "Your agricultural trade command center is ready."}"
          </p>
        </div>

        {profileComp && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-full border-4 border-emerald-400 flex items-center justify-center font-mono font-extrabold text-xs">
              {profileComp.percentage}%
            </div>
            <div className="text-xs">
              <p className="font-bold text-white">Profile Completion</p>
              <p className="text-[10px] text-green-200">{profileComp.missingFields.length === 0 ? "Account Verified" : `${profileComp.missingFields.length} field(s) pending`}</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards Row */}
      <StatsCards
        totalOrders={stats?.totalOrders || 0}
        activeOrders={stats?.activeOrders || 0}
        totalSpent={wallet?.totalSpent || 0}
        escrowBalance={wallet?.escrowBalance || 0}
        loading={loading}
      />

      {/* Recent Orders & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <RecentOffers
          orders={recentOrders.map((o) => ({
            id: o.id,
            name: `${o.produce} (${o.orderNumber})`,
            orderNumber: o.orderNumber,
            date: o.date,
            totalAmount: o.amount,
            status: o.status,
          }))}
          loading={loading}
        />

        {/* Quick Actions Card */}
        <div className="bg-white rounded-[24px] border border-gray-100 p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">Quick Actions</h3>
            <span className="text-[10px] font-mono font-bold bg-green-100 text-[#1B4D28] px-2.5 py-1 rounded-full">
              B2B BUYER
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1">
            <Link href="/dashboard/products" className="p-4 bg-gray-50/50 hover:bg-green-50/50 border border-gray-100 rounded-2xl flex flex-col justify-between group transition-all">
              <div className="p-2.5 bg-green-100 text-[#1B4D28] w-fit rounded-xl">
                <Box size={20} />
              </div>
              <div className="mt-3">
                <span className="block text-xs font-bold text-gray-800 group-hover:text-[#1B4D28]">Marketplace</span>
                <span className="block text-[10px] text-gray-400 mt-0.5">Browse commodities</span>
              </div>
            </Link>

            <Link href="/dashboard/orders" className="p-4 bg-gray-50/50 hover:bg-green-50/50 border border-gray-100 rounded-2xl flex flex-col justify-between group transition-all">
              <div className="p-2.5 bg-green-100 text-[#1B4D28] w-fit rounded-xl">
                <ShoppingCart size={20} />
              </div>
              <div className="mt-3">
                <span className="block text-xs font-bold text-gray-800 group-hover:text-[#1B4D28]">Track Orders</span>
                <span className="block text-[10px] text-gray-400 mt-0.5">View fulfillment status</span>
              </div>
            </Link>

            <Link href="/dashboard/wallet" className="p-4 bg-gray-50/50 hover:bg-green-50/50 border border-gray-100 rounded-2xl flex flex-col justify-between group transition-all">
              <div className="p-2.5 bg-green-100 text-[#1B4D28] w-fit rounded-xl">
                <Wallet size={20} />
              </div>
              <div className="mt-3">
                <span className="block text-xs font-bold text-gray-800 group-hover:text-[#1B4D28]">Wallet & Escrow</span>
                <span className="block text-[10px] text-gray-400 mt-0.5">Manage balances</span>
              </div>
            </Link>

            <Link href="/dashboard/settings" className="p-4 bg-gray-50/50 hover:bg-green-50/50 border border-gray-100 rounded-2xl flex flex-col justify-between group transition-all">
              <div className="p-2.5 bg-green-100 text-[#1B4D28] w-fit rounded-xl">
                <Settings size={20} />
              </div>
              <div className="mt-3">
                <span className="block text-xs font-bold text-gray-800 group-hover:text-[#1B4D28]">Account Settings</span>
                <span className="block text-[10px] text-gray-400 mt-0.5">Update preferences</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
