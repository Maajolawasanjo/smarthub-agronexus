"use client";

import { Bell, CheckCircle, Package, Truck, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Data model for system-generated notifications
 */
const MOCK_NOTIFICATIONS = [
    {
        id: 1,
        type: "delivered",
        title: "Order Delivered",
        message: "Your shipment of 500kg Yams has been delivered to the buyer.",
        time: "10 mins ago",
        isRead: false,
    },
    {
        id: 2,
        type: "pickup",
        title: "Pickup Scheduled",
        message: "Agrolink Logistics has scheduled a pickup for tomorrow at 10:00 AM.",
        time: "2 hrs ago",
        isRead: false,
    },
    {
        id: 3,
        type: "payment",
        title: "Payment Received",
        message: "N300,000.00 has been credited to your wallet for Batch EA36GH723.",
        time: "5 hrs ago",
        isRead: false,
    },
    {
        id: 4,
        type: "message",
        title: "New Message",
        message: "Field Agent Musa sent you a message regarding your farm inspection.",
        time: "1 day ago",
        isRead: true,
    },
    {
        id: 5,
        type: "alert",
        title: "Price Alert",
        message: "The market price for Habanero Pepper has increased by 15% this week.",
        time: "2 days ago",
        isRead: true,
    },
    {
        id: 6,
        type: "delivered",
        title: "Order Delivered",
        message: "Your shipment of 200kg Rice has been delivered successfully.",
        time: "5 days ago",
        isRead: true,
    },
    {
        id: 7,
        type: "pickup",
        title: "Pickup Completed",
        message: "Agrolink Logistics has successfully picked up your produce.",
        time: "1 week ago",
        isRead: true,
    },
];

/**
 * FarmerNotificationList Component
 * 
 * Displays a feed of farmer-specific notifications including logistical updates, 
 * financial alerts, and communications.
 */
export function FarmerNotificationList() {
    return (
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden max-w-4xl">
            {/* Header section with bulk actions */}
            <div className="p-6 md:p-8 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Notifications</h2>
                <button className="text-xs font-bold text-[#1B4D28] hover:underline focus:outline-none">
                    Mark all as read
                </button>
            </div>

            <div className="divide-y divide-gray-50">
                {MOCK_NOTIFICATIONS.map((item) => {
                    let Icon;
                    let iconColor;
                    let iconBg;

                    // Dynamic styling based on notification classification
                    switch (item.type) {
                        case "delivered":
                            Icon = Package;
                            iconColor = "text-green-600";
                            iconBg = "bg-green-50";
                            break;
                        case "pickup":
                            Icon = Truck;
                            iconColor = "text-[#1B4D28]";
                            iconBg = "bg-green-50";
                            break;
                        case "payment":
                            Icon = CheckCircle;
                            iconColor = "text-green-600";
                            iconBg = "bg-green-100";
                            break;
                        case "message":
                            Icon = MessageSquare;
                            iconColor = "text-blue-500";
                            iconBg = "bg-blue-50";
                            break;
                        case "alert":
                            Icon = Bell;
                            iconColor = "text-orange-500";
                            iconBg = "bg-orange-50";
                            break;
                        default:
                            Icon = Bell;
                            iconColor = "text-gray-600";
                            iconBg = "bg-gray-50";
                    }

                    return (
                        <div key={item.id} className={cn(
                            "p-6 hover:bg-gray-50/50 transition-all flex items-start gap-4 cursor-pointer relative group",
                            !item.isRead && "bg-green-50/20"
                        )}>
                            {/* Unread Indicator Bar */}
                            {!item.isRead && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-[#1B4D28] rounded-r-full" />
                            )}

                            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105", iconBg)}>
                                <Icon size={22} className={iconColor} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={cn(
                                        "text-sm md:text-base pr-2 truncate",
                                        item.isRead ? "font-semibold text-gray-600" : "font-bold text-gray-900"
                                    )}>
                                        {item.title}
                                    </h3>
                                    <span className="text-[10px] md:text-xs font-bold text-gray-400 whitespace-nowrap">{item.time}</span>
                                </div>
                                <p className={cn(
                                    "text-xs md:text-sm leading-relaxed",
                                    item.isRead ? "text-gray-400 font-medium" : "text-gray-500 font-bold"
                                )}>
                                    {item.message}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination/Load more footer */}
            <div className="p-6 text-center border-t border-gray-50">
                <button className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest focus:outline-none">
                    Load previous notifications
                </button>
            </div>
        </div>
    );
}

