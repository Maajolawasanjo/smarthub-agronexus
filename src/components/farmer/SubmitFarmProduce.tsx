"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function SubmitFarmProduce() {
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
