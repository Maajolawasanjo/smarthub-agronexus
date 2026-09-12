"use client";

import { useState, useEffect } from "react";
import { History, Shield, Filter, Search, Loader2, RefreshCw, AlertCircle } from "lucide-react";

interface AuditLogItem {
  id: string;
  category: string;
  severity: "INFO" | "WARNING" | "HIGH" | "CRITICAL";
  action: string;
  actor: string;
  actorEmail: string;
  resourceId: string;
  traceId?: string;
  timestamp: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const url = categoryFilter === "ALL" 
        ? "/api/admin/audit-logs?limit=100" 
        : `/api/admin/audit-logs?limit=100&category=${categoryFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data?.events) {
        setLogs(data.data.events);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [categoryFilter]);

  const filteredLogs = logs.filter((l) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      l.action.toLowerCase().includes(query) ||
      l.actor.toLowerCase().includes(query) ||
      l.actorEmail.toLowerCase().includes(query) ||
      l.resourceId.toLowerCase().includes(query) ||
      l.id.toLowerCase().includes(query)
    );
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
      case "HIGH":
        return "bg-red-50 text-red-700 border-red-100";
      case "WARNING":
        return "bg-amber-50 text-amber-700 border-amber-100";
      default:
        return "bg-green-50 text-green-700 border-green-100";
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Immutable Audit Trail & Forensics</h1>
          <p className="text-xs text-gray-400 mt-1">
            System ledger tracking all privileged admin, financial, moderation, and security operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search action or actor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1B4D28] w-48 sm:w-64"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#1B4D28]"
          >
            <option value="ALL">All Categories</option>
            <option value="PAYMENT">Payments & Escrow</option>
            <option value="DISPUTE">Disputes</option>
            <option value="PRODUCT">Produce Moderation</option>
            <option value="SECURITY">Security & Auth</option>
            <option value="USER">User Governance</option>
          </select>
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Event ID</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Action</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Category</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Severity</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Actor</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Resource Ref</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-semibold">
                    <Loader2 size={24} className="animate-spin inline-block mr-2 text-[#1B4D28]" />
                    Fetching immutable audit events from PostgreSQL...
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs font-bold text-gray-700">
                      {log.id}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs font-bold text-gray-600">
                      {log.category}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getSeverityBadge(log.severity)}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs">
                      <div className="font-semibold text-gray-800">{log.actor}</div>
                      {log.actorEmail && log.actorEmail !== "—" && (
                        <div className="text-[11px] text-gray-400">{log.actorEmail}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-gray-600">
                      {log.resourceId}
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("en-NG", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                    <History size={32} className="mx-auto mb-2 text-gray-300" />
                    No audit events found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
