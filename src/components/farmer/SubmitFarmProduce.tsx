"use client";

import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

interface SubmitFarmProduceProps {
    isVerified?: boolean;
}

export function SubmitFarmProduce({ isVerified = true }: SubmitFarmProduceProps) {
    if (!isVerified) {
        return (
            <Link
                href="/farmer/kyc"
                className="group bg-amber-900 hover:bg-amber-950 transition-all rounded-xl p-5 flex items-center justify-between gap-4 cursor-pointer shadow-sm hover:shadow-md border border-amber-700/60"
            >
                <div>
                    <div className="flex items-center gap-1.5 mb-1">
                        <Clock className="w-3.5 h-3.5 text-amber-300" />
                        <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Awaiting Verification</span>
                    </div>
                    <h3 className="text-white font-semibold text-base leading-tight group-hover:text-amber-100 transition-colors">
                        Unlock Produce Listing
                    </h3>
                    <p className="text-amber-200 text-xs mt-1.5 leading-relaxed max-w-[240px]">
                        Submit KYC credentials for admin review to start listing harvest produce.
                    </p>
                </div>
                <div
                    className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 group-hover:bg-white/30 border border-white/30 flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                    aria-label="Submit KYC"
                >
                    <ArrowRight size={18} className="text-white" />
                </div>
            </Link>
        );
    }

    return (
        <Link
            href="/farmer/sell"
            className="group bg-[#1B4D28] hover:bg-[#143d20] transition-all rounded-xl p-5 flex items-center justify-between gap-4 cursor-pointer shadow-sm hover:shadow-md"
        >
            <div>
                <h3 className="text-white font-semibold text-base leading-tight group-hover:text-green-100 transition-colors">
                    Submit Farm Produce
                </h3>
                <p className="text-green-200 text-xs mt-1.5 leading-relaxed max-w-[240px]">
                    Notify us immediately when your farm produce is ready for marketplace listing
                </p>
            </div>
            <div
                className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 group-hover:bg-white/30 border border-white/30 flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                aria-label="Submit produce"
            >
                <ArrowRight size={18} className="text-white" />
            </div>
        </Link>
    );
}
