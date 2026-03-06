"use client";

import { CheckCircle, Bell, ClipboardList, XCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const notifications = [
    {
        id: 1,
        type: "accepted",
        title: "Quote Accepted",
        message: "Your quote request has been accepted",
        time: "2hrs ago",
        isRead: false,
    },
    {
        id: 2,
        type: "request",
        title: "New Quote Request",
        message: "You have a new quote rest from John Deo",
        time: "2hrs ago",
        isRead: false,
    },
    {
        id: 3,
        type: "confirmed",
        title: "Order Confirmed",
        message: "Your order has been confirmed",
        time: "35 hrs ago",
        isRead: false,
    },
    {
        id: 4,
        type: "declined",
        title: "Quote Declined",
        message: "Your quote request has been declined",
        time: "2 days ago",
        isRead: true,
    },
    {
        id: 5,
        type: "accepted",
        title: "Quote Accepted",
        message: "Your quote request has been accepted",
        time: "2hrs ago",
        isRead: true,
    },
    {
        id: 6,
        type: "confirmed",
        title: "Order Confirmed",
        message: "Your order has been confirmed",
        time: "10 days ago",
        isRead: true,
    },
    {
        id: 7,
        type: "declined",
        title: "Quote Declined",
        message: "Your quote request has been declined",
        time: "30 days ago",
        isRead: true,
    },
    {
        id: 8,
        type: "confirmed",
        title: "Order Confirmed",
        message: "Your order has been confirmed",
        time: "35 hrs ago",
        isRead: true,
    },
];

export function NotificationList() {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-3xl">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">Notifications</h2>
            </div>

            <div className="divide-y divide-gray-50">
                {notifications.map((item) => {
                    let Icon;
                    let iconColor;
                    let iconBg;

                    switch (item.type) {
                        case "accepted":
                            Icon = CheckCircle;
                            iconColor = "text-green-600";
                            iconBg = "bg-green-50";
                            break;
                        case "request":
                            Icon = Bell;
                            iconColor = "text-orange-500";
                            iconBg = "bg-orange-50";
                            break;
                        case "confirmed":
                            Icon = ClipboardList; // or FileText
                            iconColor = "text-gray-600";
                            iconBg = "bg-gray-100";
                            break;
                        case "declined":
                            Icon = XCircle;
                            iconColor = "text-red-500";
                            iconBg = "bg-red-50";
                            break;
                        default:
                            Icon = Bell;
                            iconColor = "text-gray-600";
                            iconBg = "bg-gray-50";
                    }

                    return (
                        <div key={item.id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-start gap-4">
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", iconBg)}>
                                <Icon size={20} className={iconColor} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h3 className={cn("text-base text-gray-900 mb-1 truncate pr-2", item.isRead ? "font-normal opacity-90" : "font-bold")}>
                                        {item.title}
                                    </h3>
                                    <span className="text-xs text-gray-400 whitespace-nowrap">{item.time}</span>
                                </div>
                                <p className={cn("text-sm text-gray-500", item.isRead ? "font-normal" : "font-medium text-gray-600")}>
                                    {item.message}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
