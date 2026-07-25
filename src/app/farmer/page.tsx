"use client";

import { useEffect, useState, useCallback } from "react";
import { FarmerStatsCards } from "@/components/farmer/FarmerStatsCards";
import { SubmitFarmProduce } from "@/components/farmer/SubmitFarmProduce";
import { FieldAgent } from "@/components/farmer/FieldAgent";
import { RecentSubmit } from "@/components/farmer/RecentSubmit";
import { FarmerChart } from "@/components/farmer/FarmerChart";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { FarmerDashboardDTO } from "@/types/page-dtos";

export default function FarmerOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [farmerData, setFarmerData] = useState<FarmerDashboardDTO | null>(null);

  const fetchFarmerData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/farmer/dashboard");
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Session expired. Please log in to your farmer account.");
        }
        throw new Error("Failed to fetch farmer dashboard analytics.");
      }
      const data: FarmerDashboardDTO = await res.json();
      setFarmerData(data);
    } catch (err: any) {
      console.error("Farmer overview fetch error:", err);
      setError(err.message || "Unable to fetch live farmer data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFarmerData();
  }, [fetchFarmerData]);

  if (error) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-red-100 p-8 shadow-sm">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-base font-bold text-gray-800 mb-1">Farmer Dashboard Error</h3>
        <p className="text-xs text-gray-500 max-w-md mb-6">{error}</p>
        <button
          onClick={fetchFarmerData}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1B4D28] text-white text-xs font-semibold rounded-full hover:bg-[#143d20] transition-colors cursor-pointer"
        >
          <RefreshCw size={14} /> Retry Connection
        </button>
      </div>
    );
  }

  const stats = farmerData?.statistics;
  const submissions = farmerData?.recentSubmissions || [];
  const chartData = farmerData?.chartData || [];

  return (
    <div className="space-y-5 animate-fadeIn font-sans pb-12">

      {/* Welcome Header */}
      <div className="bg-[#0A3918] text-white rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl shadow-green-950/20">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-green-300">
            FARMER COMMAND CENTER
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
            {farmerData?.farmerProfile?.farmName || "Your Farm Cluster"}
          </h1>
          <p className="text-xs text-green-200/80 font-serif italic mt-0.5">
            {farmerData?.farmerProfile?.farmAddress || "Location Verified"} • {farmerData?.farmerProfile?.verificationStatus === "APPROVED" ? "KYC Approved" : "Verification Pending"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold font-mono bg-green-100 text-[#1B4D28]">
            {farmerData?.farmerProfile?.verificationStatus === "APPROVED" ? "VERIFIED PRODUCER" : "PENDING REVIEW"}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <FarmerStatsCards
        pendingOrders={stats?.pendingOrders || 0}
        activeOrders={stats?.activeOrders || 0}
        revenue={stats?.revenue || 0}
        totalSales={stats?.totalSales || 0}
        loading={loading}
      />

      {/* Main content split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="flex flex-col gap-5">
          <SubmitFarmProduce />
          <FieldAgent />
          <RecentSubmit
            submissions={submissions.map((s) => ({
              id: s.id,
              name: s.produceName,
              type: `${s.availableQty} ${s.unit} Available`,
              date: s.date,
              status: s.status === "AVAILABLE" ? "Successful" : "Cancel",
            }))}
            loading={loading}
          />
        </div>

        <div className="h-full min-h-[400px]">
          <FarmerChart data={chartData} loading={loading} />
        </div>
      </div>
    </div>
  );
}
