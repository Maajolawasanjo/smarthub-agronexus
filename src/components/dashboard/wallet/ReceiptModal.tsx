"use client";

import { X, CheckCircle2, Download, Printer, ShieldCheck, QrCode, Headphones } from "lucide-react";

export interface TransactionReceiptData {
  transactionId?: string;
  date?: string;
  method?: string;
  payer?: string;
  subtotal?: string;
  vat?: string;
  fee?: string;
  logistics?: string;
  total?: string;
  description?: string;
  status?: string;
  amount?: string;
  type?: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: TransactionReceiptData;
}

export function ReceiptModal({ isOpen, onClose, data }: ReceiptModalProps) {
  if (!isOpen) return null;

  const receipt = {
    transactionId: data?.transactionId || "TXN-AG-8829410-B",
    date: data?.date || "Oct 24, 2024 | 14:32:05 UTC",
    method: data?.method || "Corporate Bank Transfer (Chase)",
    payer: data?.payer || "Global Confectionery Ltd.",
    subtotal: data?.subtotal || "$12,500.00",
    vat: data?.vat || "$937.50",
    fee: data?.fee || "$125.00",
    logistics: data?.logistics || "$350.00",
    total: data?.total || "$13,912.50",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-[#F8FAF7] rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1B4D28] tracking-wide uppercase">Agrochain Audit Statement</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6">

          {/* Green Hero Header */}
          <div className="bg-[#0A3918] text-white rounded-[20px] p-6 text-center space-y-2 relative overflow-hidden">
            <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-green-500/30">
              <CheckCircle2 size={26} />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">Transaction Successful</h2>
            <p className="text-xs text-white/70 font-mono">Receipt for Bulk Cocoa Purchase Deposit</p>
          </div>

          {/* Transaction Meta Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">TRANSACTION ID</p>
              <p className="font-mono font-bold text-gray-800">{receipt.transactionId}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">DATE & TIME</p>
              <p className="font-mono font-semibold text-gray-700">{receipt.date}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">PAYMENT METHOD</p>
              <p className="font-semibold text-gray-800">{receipt.method}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">PAYER</p>
              <p className="font-semibold text-gray-800">{receipt.payer}</p>
            </div>
          </div>

          {/* Payment Breakdown Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Payment Breakdown</h3>

            <div className="space-y-3 text-xs text-gray-600">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span>Subtotal (2,500kg Cocoa)</span>
                <span className="font-mono font-semibold text-gray-800">{receipt.subtotal}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span>VAT (7.5%)</span>
                <span className="font-mono font-semibold text-gray-800">{receipt.vat}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span>Supply Chain Platform Fee</span>
                <span className="font-mono font-semibold text-gray-800">{receipt.fee}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span>Insured Logistics Surcharge</span>
                <span className="font-mono font-semibold text-gray-800">{receipt.logistics}</span>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-dashed border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">TOTAL AMOUNT PAID</p>
                <p className="text-[10px] text-green-700 font-semibold flex items-center gap-1 mt-0.5">
                  <ShieldCheck size={12} /> Verified Secure Transaction
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-gray-900 font-mono tracking-tight">{receipt.total}</p>
                <p className="text-[10px] font-mono text-gray-400">CURRENCY: USD</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              <button
                onClick={() => alert("Downloading PDF Statement...")}
                className="bg-[#1B4D28] text-white py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#153a1e] transition-all cursor-pointer shadow-md shadow-green-900/10"
              >
                <Download size={14} /> Download PDF Statement
              </button>
              <button
                onClick={() => window.print()}
                className="bg-gray-100 text-gray-700 border border-gray-200 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all cursor-pointer"
              >
                <Printer size={14} /> Print Receipt
              </button>
            </div>
          </div>

          {/* Footer Security Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-1">
              <ShieldCheck size={18} className="text-[#1B4D28] mb-1" />
              <p className="font-bold text-gray-800 text-[11px]">Buyer Protection</p>
              <p className="text-[10px] text-gray-500 leading-tight">Funds held in escrow until logistics confirmation.</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-1">
              <QrCode size={18} className="text-[#1B4D28] mb-1" />
              <p className="font-bold text-gray-800 text-[11px]">Traceability</p>
              <p className="text-[10px] text-gray-500 leading-tight font-mono">Linked to farm cluster: GH-CO-449.</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-1">
              <Headphones size={18} className="text-[#1B4D28] mb-1" />
              <p className="font-bold text-gray-800 text-[11px]">Support</p>
              <p className="text-[10px] text-gray-500 leading-tight">Contact 24/7 Supply Chain helpdesk.</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
