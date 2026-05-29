"use client";

import { Package, Truck, Ship, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
    {
        id: 1,
        label: "Order in Packing",
        date: "12 Dec 2025",
        amount: "($ 2,400)",
        icon: Package,
        status: "completed",
    },
    {
        id: 2,
        label: "On Transit",
        date: "18 Dec 2025",
        amount: "($ 4,600)",
        icon: Truck,
        status: "completed",
    },
    {
        id: 3,
        label: "On Cargo",
        date: "24 Dec 2025",
        amount: "($ 5,800)",
        icon: Ship,
        status: "current", // Grayed out in design for now? Or implied next? Image shows 3 as "On Cargo" but maybe simplified.
        // Design image has 1, 2 green. 3 is light green. 4 is gray.
        // Actually, looking at the image provided in mind:
        // 1 (Green), 2 (Green), 3 (Light Green/White with Green number), 4 (Gray).
        // Let's assume 1 & 2 are done, 3 is current.
    },
    {
        id: 4,
        label: "Delivered",
        date: "26 Dec 2025",
        amount: "($ 7,700)",
        icon: Package, // Or a building icon
        status: "upcoming",
    },
];

export function TrackingTimeline() {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative gap-8 md:gap-0">

                {/* Progress Line (Desktop) */}
                <div className="hidden md:block absolute top-[45%] left-10 right-10 h-0.5 bg-gray-200 -z-0" />

                {steps.map((step, index) => {
                    const isCompleted = index < 2; // 1 & 2
                    const isCurrent = index === 2; // 3

                    return (
                        <div key={step.id} className="relative z-10 flex flex-row md:flex-col items-center gap-4 md:gap-4 w-full md:w-auto">
                            {/* Icon/Number Bubble */}
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                                    isCompleted ? "bg-[#1B4D28] text-white" :
                                        isCurrent ? "bg-green-100 text-[#1B4D28]" : "bg-gray-100 text-gray-400"
                                )}
                            >
                                {step.id}
                            </div>

                            {/* Icon Image Placeholder - The design has illustrative icons above the numbers on desktop.
                  For now, I will skip the illustrative icons or just use Lucide icons inside/above.
                  The request mentioned "image provided", let's replicate the layout.
                  Desktop: Icon -> Number -> Text.
              */}

                            <div className="flex flex-col md:items-center md:text-center">
                                <h4 className={cn("font-bold text-sm", isCompleted || isCurrent ? "text-[#1B4D28]" : "text-gray-400")}>{step.label}</h4>
                                <p className="text-xs text-gray-500 mt-1">{step.date}</p>
                                <p className="text-xs font-semibold text-[#1B4D28] mt-0.5">{step.amount}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
