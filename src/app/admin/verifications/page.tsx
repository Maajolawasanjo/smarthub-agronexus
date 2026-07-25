"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle2, XCircle, Clock, Search, AlertCircle, FileText, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { AdminVerificationQueueDTO, AdminQueueItemDTO } from "@/dto";

export default function AdminVerificationsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<AdminVerificationQueueDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedItem, setSelectedItem] = useState<AdminQueueItemDTO | null>(null);
  const [remarks, setRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  async function fetchQueue() {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/verifications");
      if (res.ok) {
        const queueData: AdminVerificationQueueDTO = await res.json();
        setData(queueData);
      }
    } catch (err) {
      console.error("Failed to load admin verification queue", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchQueue();
  }, []);

  async function handleReview(action: "APPROVE" | "REJECT") {
    if (!selectedItem) return;
    if (action === "REJECT" && !remarks.trim()) {
      toast("Remarks explaining rejection reason are required", "error");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/verifications/${selectedItem.verificationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, remarks }),
      });

      if (res.ok) {
        toast(`Verification request ${action.toLowerCase()}d successfully!`, "success");
        setSelectedItem(null);
        setRemarks("");
        await fetchQueue();
      } else {
        const errData = await res.json();
        toast(errData.error || "Review operation failed.", "error");
      }
    } catch (err) {
      toast("Error executing verification review.", "error");
    } finally {
      setIsProcessing(false);
    }
  }

  const filteredQueue = data?.queue.filter(
    (item) =>
      item.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.farmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.documentType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Trust Domain & Verification Queue</h1>
          <p className="text-sm font-medium text-gray-500">Compliance review desk for farmer identity documents and trust scores</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search queue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-[#1B4D28]"
          />
        </div>
      </div>

      {/* Statistics Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">Pending Review</p>
              <p className="text-xl font-bold text-gray-800">{data?.statistics.pendingCount ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 text-[#1B4D28] rounded-xl">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">Approved Today</p>
              <p className="text-xl font-bold text-gray-800">{data?.statistics.approvedToday ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <XCircle size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">Rejected Today</p>
              <p className="text-xl font-bold text-gray-800">{data?.statistics.rejectedToday ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">Avg Review Time</p>
              <p className="text-xl font-bold text-gray-800">{data?.statistics.averageReviewTimeMinutes ?? 15} mins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Review Queue Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-bold text-lg text-gray-800">Verification Submissions</h2>
          <span className="text-xs text-gray-400 font-medium">
            Showing {filteredQueue?.length ?? 0} total verification records
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="w-8 h-8 border-4 border-[#1B4D28]/20 border-t-[#1B4D28] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">Fetching compliance verification queue...</p>
          </div>
        ) : filteredQueue?.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            No verification applications found in review queue.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Farmer & Farm</th>
                  <th className="py-3 px-5">Document Type</th>
                  <th className="py-3 px-5">Document ID</th>
                  <th className="py-3 px-5">Submitted At</th>
                  <th className="py-3 px-5 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredQueue?.map((item) => (
                  <tr key={item.verificationId} className="hover:bg-gray-50/50">
                    <td className="py-4 px-5">
                      <div>
                        <p className="font-bold text-gray-800">{item.farmerName}</p>
                        <p className="text-xs text-gray-500">{item.farmName} • {item.location}</p>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-medium text-gray-700">
                      {item.documentType.replace(/_/g, " ")}
                    </td>
                    <td className="py-4 px-5 text-xs font-mono font-semibold text-gray-600">
                      {item.documentNumber || "N/A"}
                    </td>
                    <td className="py-4 px-5 text-xs text-gray-500">
                      {new Date(item.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.status === "APPROVED"
                          ? "bg-green-100 text-[#1B4D28]"
                          : item.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-[#1B4D28] hover:text-white text-gray-700 text-xs font-bold rounded-lg transition-colors"
                      >
                        Inspect & Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-100">
            <h3 className="font-bold text-lg text-gray-800">Review Verification Document</h3>

            <div className="bg-gray-50 p-4 rounded-2xl text-xs space-y-2">
              <p><span className="text-gray-400">Applicant:</span> <strong className="text-gray-800">{selectedItem.farmerName}</strong> ({selectedItem.farmName})</p>
              <p><span className="text-gray-400">Location:</span> <strong className="text-gray-800">{selectedItem.location}</strong></p>
              <p><span className="text-gray-400">Document:</span> <strong className="text-gray-800">{selectedItem.documentType}</strong> (#{selectedItem.documentNumber})</p>
              <a
                href={selectedItem.documentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#1B4D28] font-bold hover:underline mt-1"
              >
                <FileText size={14} /> View File Document <ExternalLink size={12} />
              </a>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Compliance Review Remarks / Rejection Notes
              </label>
              <textarea
                rows={3}
                placeholder="Enter approval notes or detailed rejection reasons..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#1B4D28]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                disabled={isProcessing}
                onClick={() => handleReview("REJECT")}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-full shadow transition-all"
              >
                Reject Verification
              </button>
              <button
                disabled={isProcessing}
                onClick={() => handleReview("APPROVE")}
                className="flex-1 py-3 bg-[#1B4D28] hover:bg-[#143d20] text-white font-bold text-xs rounded-full shadow transition-all"
              >
                Approve Verification
              </button>
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="w-full text-center text-xs font-bold text-gray-400 hover:text-gray-600 pt-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
