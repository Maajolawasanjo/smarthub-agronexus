"use client";

import { useState, useEffect } from "react";
import { Upload, CheckCircle2, ShieldCheck, ChevronLeft, Clock, AlertTriangle, FileText, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { VerificationDTO } from "@/dto";

export default function FarmerKYCPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<VerificationDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [docType, setDocType] = useState("NATIONAL_ID");
  const [docNumber, setDocNumber] = useState("");
  const [docUrl, setDocUrl] = useState("https://smarthubagro.com/docs/nin-certificate.pdf");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadVerificationData() {
    try {
      setIsLoading(true);
      const res = await fetch("/api/kyc");
      if (res.ok) {
        const dto: VerificationDTO = await res.json();
        setData(dto);
        if (dto.document?.documentNumber) {
          setDocNumber(dto.document.documentNumber);
        }
        if (dto.document?.documentType) {
          setDocType(dto.document.documentType);
        }
      }
    } catch (err) {
      console.error("Failed to load verification data", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadVerificationData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber.trim()) {
      toast("Please enter your document ID number", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/kyc/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: docType,
          documentNumber: docNumber,
          documentUrl: docUrl,
        }),
      });

      if (res.ok) {
        toast("Verification details submitted for compliance review!", "success");
        await loadVerificationData();
      } else {
        const errData = await res.json();
        toast(errData.error || "Submission failed.", "error");
      }
    } catch (err) {
      toast("An error occurred submitting verification.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-gray-400 font-sans">
        <div className="w-8 h-8 border-4 border-[#1B4D28]/20 border-t-[#1B4D28] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium">Loading trust & identity details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 font-sans space-y-6">
      <div>
        <Link
          href="/farmer"
          className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors mb-4 w-fit"
        >
          <ChevronLeft size={16} />
          Back to Farmer Portal
        </Link>
      </div>

      {/* Header Badge Overview */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl ${data?.status === "VERIFIED_PRODUCER" ? "bg-green-100 text-[#1B4D28]" : "bg-amber-50 text-amber-600"}`}>
            <ShieldCheck size={36} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-800">{data?.badge.label || "Identity Verification"}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                data?.status === "VERIFIED_PRODUCER"
                  ? "bg-green-100 text-[#1B4D28]"
                  : data?.status === "PENDING"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {data?.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{data?.badge.description}</p>
          </div>
        </div>

        {/* Capabilities Summary */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 w-full md:w-auto text-xs space-y-1">
          <p className="font-bold text-gray-700">Capabilities & Limits:</p>
          <p className="text-gray-600">• Daily Withdrawal: <span className="font-bold text-gray-800">${data?.dailyWithdrawalLimit.toLocaleString()}/day</span></p>
          <p className="text-gray-600">• Listing Limit: <span className="font-bold text-gray-800">{data?.listingLimit === -1 ? "Unlimited" : `${data?.listingLimit} active listings`}</span></p>
        </div>
      </div>

      {/* Dynamic Server Verification Timeline */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Verification Timeline</h2>
        <div className="space-y-4">
          {data?.verificationTimeline.map((item, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                item.status === "completed"
                  ? "bg-[#1B4D28] text-white"
                  : item.status === "current"
                  ? "bg-amber-500 text-white"
                  : "bg-gray-100 text-gray-400"
              }`}>
                {item.status === "completed" ? <Check size={16} /> : idx + 1}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-gray-800">{item.label}</h3>
                  {item.date && (
                    <span className="text-[10px] text-gray-400 font-mono">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload & Action Card */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-8">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Submit / Update Verification Document</h2>
        <p className="text-xs text-gray-500 mb-6">{data?.nextRequiredAction}</p>

        {data?.remarks && (
          <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Compliance Review Notes:</p>
              <p className="mt-0.5">{data.remarks}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Document Type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#1B4D28]"
            >
              <option value="NATIONAL_ID">National Identity Number (NIN)</option>
              <option value="PASSPORT">International Passport</option>
              <option value="CAC_CERTIFICATE">CAC Business Certificate</option>
              <option value="TAX_IDENTIFICATION">Tax Identification Number (TIN)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Document ID / Registration Number
            </label>
            <input
              type="text"
              required
              placeholder="e.g. NIN-901824901"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#1B4D28]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Document Proof File URL
            </label>
            <input
              type="text"
              required
              placeholder="https://..."
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#1B4D28]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !data?.resubmissionAllowed}
              className="w-full py-4 bg-[#1B4D28] hover:bg-[#143d20] disabled:bg-gray-300 text-white text-sm font-bold rounded-full shadow-lg transition-all"
            >
              {isSubmitting ? "Submitting Document..." : "Submit Identity Verification Document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
