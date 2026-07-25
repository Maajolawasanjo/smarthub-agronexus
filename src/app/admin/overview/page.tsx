"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  ShoppingCart,
  Users,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { AdminDashboardDTO } from "@/types/page-dtos";

export default function AdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [adminData, setAdminData] = useState<AdminDashboardDTO | null>(null);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/overview");
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Forbidden access. System Administrator credentials required.");
        }
        throw new Error("Failed to fetch admin overview metrics.");
      }
      const data: AdminDashboardDTO = await res.json();
      setAdminData(data);
    } catch (err: any) {
      console.error("Admin overview fetch error:", err);
      setError(err.message || "Unable to fetch live admin data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  if (error) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-red-100 p-8 shadow-sm">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-base font-bold text-gray-800 mb-1">Admin Command Center Error</h3>
        <p className="text-xs text-gray-500 max-w-md mb-6">{error}</p>
        <button
          onClick={fetchAdminData}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1B4D28] text-white text-xs font-semibold rounded-full hover:bg-[#143d20] transition-colors cursor-pointer"
        >
          <RefreshCw size={14} /> Retry Connection
        </button>
      </div>
    );
  }

  const metrics = adminData?.statistics;
  const tasks = adminData?.moderationQueue || [];

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1B4D28] text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-[#2C5E39] animate-slideIn">
          <CheckCircle2 size={20} className="text-[#4CAF50] flex-shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0A3918] text-white rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl shadow-green-950/20">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-green-300">
            SYSTEM COMMAND CENTER
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
            Platform Administration
          </h1>
          <p className="text-xs text-green-200/80 font-serif italic mt-0.5">
            PostgreSQL Schema • Live System Data • Session: {adminData?.user?.email || "Admin"}
          </p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">
                Database Status
              </span>
              <span className="text-xl font-bold text-gray-800 tracking-tight mt-1.5 flex items-center gap-2">
                <ShieldCheck size={20} className="text-[#1B4D28]" />
                PostgreSQL Operational
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-400 font-semibold mt-4">
            All user accounts & tables synchronized.
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#739072] uppercase tracking-widest">
                Total Trade Volume
              </span>
              {loading ? (
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-1" />
              ) : (
                <span className="text-2xl font-extrabold text-gray-900 tracking-tight mt-1">
                  ${(metrics?.totalTradeVolume || 0).toLocaleString()}
                </span>
              )}
            </div>
            <div className="p-2.5 bg-green-50 text-[#1B4D28] rounded-xl flex-shrink-0">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-xs text-gray-400 font-semibold mt-4">
            Calculated from all active & fulfilled orders.
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                Pending Verifications
              </span>
              {loading ? (
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-1" />
              ) : (
                <span className="text-xl font-bold text-gray-800 tracking-tight mt-1.5 flex items-center gap-2">
                  <AlertCircle size={20} className="text-amber-500" />
                  {metrics?.pendingVerifications || 0} Farmers
                </span>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-400 font-semibold mt-4">
            Requires KYC document review & approval.
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[300px]">
          <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-4">
            <h3 className="font-bold text-gray-800 text-base">Immediate Moderation Queue</h3>
            <Link href="/admin/users" className="text-xs font-bold text-[#1B4D28] hover:underline flex items-center gap-1">
              Go to Users <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-gray-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 size={20} />
              </div>
              <h4 className="text-xs font-bold text-gray-800 mb-1">All Moderation Queue Up to Date</h4>
              <p className="text-[11px] text-gray-400 max-w-xs">
                There are no pending unapproved farmer verification requests or listings requiring action.
              </p>
            </div>
          ) : (
            <div className="flex-1 divide-y divide-gray-50">
              {tasks.map((task) => (
                <div key={task.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-gray-700 truncate">{task.title}</span>
                    <span className="text-xs text-gray-400">By {task.submittedBy}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg border bg-amber-50 text-amber-600 border-amber-100">
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[300px]">
          <div className="mb-4 border-b border-gray-50 pb-4">
            <h3 className="font-bold text-gray-800 text-base">Quick Administration Links</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1">
            <Link href="/admin/analytics" className="p-4 bg-gray-50/50 hover:bg-[#EEF2EE]/50 border border-gray-100 rounded-2xl flex flex-col justify-between group transition-all">
              <div className="p-2 bg-green-50 text-[#1B4D28] w-fit rounded-xl">
                <BadgeCheck size={18} />
              </div>
              <div>
                <span className="block text-sm font-bold text-gray-700 group-hover:text-[#1B4D28]">System Analytics</span>
                <span className="block text-[10px] text-gray-400 mt-0.5">Live metrics</span>
              </div>
            </Link>

            <Link href="/admin/products" className="p-4 bg-gray-50/50 hover:bg-[#EEF2EE]/50 border border-gray-100 rounded-2xl flex flex-col justify-between group transition-all">
              <div className="p-2 bg-green-50 text-[#1B4D28] w-fit rounded-xl">
                <Box size={18} />
              </div>
              <div>
                <span className="block text-sm font-bold text-gray-700 group-hover:text-[#1B4D28]">
                  Listed Produce ({metrics?.totalProducts || 0})
                </span>
                <span className="block text-[10px] text-gray-400 mt-0.5">Moderation logs</span>
              </div>
            </Link>

            <Link href="/admin/orders" className="p-4 bg-gray-50/50 hover:bg-[#EEF2EE]/50 border border-gray-100 rounded-2xl flex flex-col justify-between group transition-all">
              <div className="p-2 bg-green-50 text-[#1B4D28] w-fit rounded-xl">
                <ShoppingCart size={18} />
              </div>
              <div>
                <span className="block text-sm font-bold text-gray-700 group-hover:text-[#1B4D28]">Order Logs</span>
                <span className="block text-[10px] text-gray-400 mt-0.5">Wholesale orders</span>
              </div>
            </Link>

            <Link href="/admin/users" className="p-4 bg-gray-50/50 hover:bg-[#EEF2EE]/50 border border-gray-100 rounded-2xl flex flex-col justify-between group transition-all">
              <div className="p-2 bg-green-50 text-[#1B4D28] w-fit rounded-xl">
                <Users size={18} />
              </div>
              <div>
                <span className="block text-sm font-bold text-gray-700 group-hover:text-[#1B4D28]">
                  System Users ({(metrics?.totalFarmers || 0) + (metrics?.totalBuyers || 0)})
                </span>
                <span className="block text-[10px] text-gray-400 mt-0.5">Farmers & Buyers</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
