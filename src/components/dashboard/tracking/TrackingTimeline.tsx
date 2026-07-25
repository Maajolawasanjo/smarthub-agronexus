"use client";

import { cn } from "@/lib/utils";
import { FulfillmentTimelineItemDTO } from "@/lib/fulfillment";

interface TrackingTimelineProps {
    timeline?: FulfillmentTimelineItemDTO[];
    totalAmount?: number;
}

export function TrackingTimeline({ timeline, totalAmount }: TrackingTimelineProps) {
    if (!timeline || timeline.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 text-center text-gray-400 text-sm">
                No timeline events available for this order.
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative gap-8 md:gap-0">
                {/* Progress Line (Desktop) */}
                <div className="hidden md:block absolute top-[35%] left-10 right-10 h-0.5 bg-gray-200 -z-0" />

                {timeline.map((event, index) => {
                    const isCompleted = event.status === "completed";
                    const isCurrent = event.status === "current";

                    return (
                        <div key={index} className="relative z-10 flex flex-row md:flex-col items-center gap-4 md:gap-3 w-full md:w-auto">
                            {/* Icon/Number Bubble */}
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                                    isCompleted ? "bg-[#1B4D28] text-white" :
                                        isCurrent ? "bg-amber-100 text-amber-800 border-2 border-amber-500" : "bg-gray-100 text-gray-400"
                                )}
                            >
                                {index + 1}
                            </div>

                            <div className="flex flex-col md:items-center md:text-center">
                                <h4 className={cn("font-bold text-xs md:text-sm", isCompleted || isCurrent ? "text-[#1B4D28]" : "text-gray-400")}>
                                    {event.label}
                                </h4>
                                <p className="text-[10px] text-gray-500 mt-0.5">
                                    {event.date ? new Date(event.date).toLocaleDateString() : "Pending"}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
