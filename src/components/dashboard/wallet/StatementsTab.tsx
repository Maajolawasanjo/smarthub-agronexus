"use client";

import { useState, useEffect } from "react";
import { Download, FileSpreadsheet, FileText, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function StatementsTab() {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState("2026");
  const [taxData, setTaxData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async (year: string) => {
    try {
      const res = await fetch(`/api/wallet/statements?year=${year}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setTaxData(json.data);
        }
      }
    } catch (err) {
      console.error("Failed to load tax statements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedYear);
  }, [selectedYear]);

  const handleDownload = (name: string, format: string) => {
    window.open(`/api/admin/ledger/export?format=${format.toLowerCase()}`, "_blank");
    toast(`Preparing ${name} (${format.toUpperCase()}) from PostgreSQL for download...`, "success");
  };

  const monthlyStatements = taxData?.monthlyStatements || [];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tax & Financial Statements Center</h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Download certified audit-ready accounting reports, annual tax packages, and monthly VAT summaries in NGN.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-white border border-gray-200 text-gray-800 text-xs font-bold font-mono px-4 py-2.5 rounded-full focus:outline-none cursor-pointer"
          >
            <option value="2026">Year 2026</option>
            <option value="2025">Year 2025</option>
          </select>
        </div>
      </div>

      {/* Annual Summary Card */}
      <div className="bg-[#0A3918] text-white rounded-[24px] p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xl shadow-green-950/20">
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-green-300">
            TOTAL ANNUAL TRADE VOLUME ({selectedYear})
          </span>
          <h3 className="text-3xl md:text-4xl font-extrabold font-mono text-white">
            {taxData?.formattedTotalTradeVolume || "₦0.00"}
          </h3>
          <p className="text-xs text-green-200/80 font-serif italic">Verified by SmartHub Agro Audit</p>
        </div>

        <div className="space-y-2 border-t md:border-t-0 md:border-l border-green-800/80 pt-4 md:pt-0 md:pl-6">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-green-300">
            TOTAL VAT REMITTED (7.5%)
          </span>
          <h3 className="text-2xl font-extrabold font-mono text-white">
            {taxData?.formattedTotalVatRemitted || "₦0.00"}
          </h3>
          <p className="text-xs text-green-300/90 font-mono">7.5% Standard Agricultural Rate</p>
        </div>

        <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-green-800/80 pt-4 md:pt-0 md:pl-6">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-green-300">
            ANNUAL TAX PACKAGE
          </span>
          <button
            onClick={() => handleDownload(`Annual_Tax_Package_${selectedYear}`, "pdf")}
            className="mt-3 bg-[#34A853] hover:bg-[#2e964a] text-white py-3 px-5 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <Download size={14} /> Download Full {selectedYear} Tax Bundle
          </button>
        </div>
      </div>

      {/* Monthly Statements List */}
      <div className="bg-white rounded-[24px] border border-gray-100 p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Monthly Accounting Packages</h3>
          <span className="text-[10px] font-mono font-bold bg-green-100 text-green-800 px-2.5 py-1 rounded-full">
            AUDIT READY
          </span>
        </div>

        {monthlyStatements.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl">
            No completed trade volumes recorded yet for {selectedYear}.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {monthlyStatements.map((st: any, idx: number) => (
              <div key={idx} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 px-3 rounded-2xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center font-bold">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{st.month}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{st.period}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 font-mono block">TRADE VOLUME</span>
                    <span className="font-mono font-bold text-gray-800">{st.formattedVolume}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-mono block">VAT AMOUNT (7.5%)</span>
                    <span className="font-mono font-bold text-gray-800">{st.formattedVat}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(st.month, "pdf")}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText size={14} /> PDF
                    </button>

                    <button
                      onClick={() => handleDownload(st.month, "xlsx")}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet size={14} /> Excel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
