"use client";

import { ArrowRight } from "lucide-react";

export function SubmitFarmProduce() {
    return (
        <div className="bg-[#1B4D28] rounded-xl p-5 flex items-center justify-between gap-4">
            <div>
                <h3 className="text-white font-semibold text-base leading-tight">
                    Submit Farm Produce
                </h3>
                <p className="text-green-200 text-xs mt-1.5 leading-relaxed max-w-[200px]">
                    Notify us immediately when your farm produce is ready
                </p>
            </div>
            <button
                className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 flex items-center justify-center transition-all duration-200 hover:scale-105"
                aria-label="Submit produce"
            >
                <ArrowRight size={18} className="text-white" />
            </button>
        </div>
    );
}
