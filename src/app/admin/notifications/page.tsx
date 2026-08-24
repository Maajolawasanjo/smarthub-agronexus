"use client";

import React, { useState } from "react";
import {
    Bell,
    Check,
    Trash2,
    ShieldAlert,
    CreditCard,
    UserCheck,
    Server,
    ExternalLink,
    AlertCircle,
    BadgeAlert
} from "lucide-react";
import Link from "next/link";

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [filter, setFilter] = useState("All");

    React.useEffect(() => {
        async function fetchLiveNotifications() {
            try {
                const [overviewRes, userNotifRes] = await Promise.all([
                    fetch("/api/admin/overview").catch(() => null),
                    fetch("/api/notifications").catch(() => null),
                ]);

                const items: any[] = [];

                if (overviewRes && overviewRes.ok) {
                    const data = await overviewRes.json();
                    if (data.moderationQueue && data.moderationQueue.length > 0) {
                        data.moderationQueue.forEach((item: any) => {
                            items.push({
                                id: `mod-${item.id}`,
                                title: item.title || "Pending Moderation Action",
                                description: `Submitted by ${item.submittedBy}. Review required.`,
                                time: item.date || "Pending",
                                priority: "High",
                                type: "verification",
                                read: false,
                                link: "/admin/products"
                            });
                        });
                    }
                }

                if (userNotifRes && userNotifRes.ok) {
                    const data = await userNotifRes.json();
                    if (data.notifications && data.notifications.length > 0) {
                        data.notifications.forEach((n: any) => {
                            items.push({
                                id: n.id,
                                title: n.title,
                                description: n.message,
                                time: new Date(n.createdAt).toLocaleTimeString(),
                                priority: n.isRead ? "Low" : "High",
                                type: "system",
                                read: n.isRead,
                                link: n.link || undefined
                            });
                        });
                    }
                }

                setNotifications(items);
            } catch (err) {
                console.error("Failed to load live admin notifications", err);
            }
        }
        fetchLiveNotifications();
    }, []);

    // Toggle single notification read status
    const toggleRead = (id: string) => {
        setNotifications(prev =>
            prev.map(item => item.id === id ? { ...item, read: true } : item)
        );
    };

    // Mark all as read
    const markAllRead = () => {
        setNotifications(prev =>
            prev.map(item => ({ ...item, read: true }))
        );
    };

    // Delete single notification
    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(item => item.id !== id));
    };

    // Clear all
    const clearAll = () => {
        setNotifications([]);
    };

    // Filter notifications
    const filteredItems = notifications.filter(item => {
        if (filter === "High") return item.priority === "High";
        if (filter === "System") return item.type === "system" || item.type === "security";
        if (filter === "Read") return item.read;
        if (filter === "Unread") return !item.read;
        return true;
    });

    const getIcon = (type: string) => {
        switch (type) {
            case "verification":
                return <UserCheck size={18} className="text-emerald-600" />;
            case "payment":
                return <CreditCard size={18} className="text-blue-600" />;
            case "security":
                return <ShieldAlert size={18} className="text-amber-600" />;
            default:
                return <Server size={18} className="text-gray-500" />;
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Action Bar */}
            <div className="-mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-gray-500 text-sm">
                    Review and clear system alerts, transaction flags, and buyer inquiries.
                </p>
                {notifications.length > 0 && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={markAllRead}
                            className="flex items-center gap-2 bg-[#1B4D28] text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-[#143d20] shadow-sm transition-colors"
                        >
                            <Check size={14} />
                            Mark All Read
                        </button>
                        <button
                            onClick={clearAll}
                            className="flex items-center gap-2 border border-gray-200 text-gray-500 text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 bg-white transition-colors"
                        >
                            <Trash2 size={14} />
                            Clear Logs
                        </button>
                    </div>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-none gap-6 text-sm font-medium">
                {["All", "High Priority", "System", "Unread", "Read"].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab === "High Priority" ? "High" : tab)}
                        className={`pb-3.5 px-1 relative transition-colors font-semibold ${
                            (filter === "High" && tab === "High Priority") || filter === tab
                                ? "text-[#1B4D28] border-b-2 border-[#1B4D28]"
                                : "text-gray-400 hover:text-gray-600"
                        }`}
                    >
                        {tab}
                        {tab === "Unread" && notifications.filter(n => !n.read).length > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
                                {notifications.filter(n => !n.read).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Notifications Feed */}
            <div className="max-w-3xl mx-auto space-y-4">
                {filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                        <div
                            key={item.id}
                            className={`p-5 rounded-2xl border transition-all duration-200 flex gap-4 ${
                                item.read
                                    ? "bg-white/60 border-gray-100 opacity-80"
                                    : "bg-white border-green-100 shadow-sm hover:shadow-md ring-1 ring-green-500/5"
                            }`}
                        >
                            {/* Icon Column */}
                            <div className={`p-3 rounded-xl flex-shrink-0 w-fit h-fit ${
                                item.read ? "bg-gray-50 text-gray-400" : "bg-green-50/50"
                            }`}>
                                {getIcon(item.type)}
                            </div>

                            {/* Details Column */}
                            <div className="flex-1 space-y-1.5 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <h4 className={`text-sm font-bold truncate ${
                                            item.read ? "text-gray-600" : "text-gray-800"
                                        }`}>
                                            {item.title}
                                        </h4>
                                        {!item.read && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                        )}
                                    </div>
                                    <span className="text-[10px] font-semibold text-gray-400 flex-shrink-0 mt-0.5">
                                        {item.time}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                    {item.description}
                                </p>

                                {/* Row Actions */}
                                <div className="pt-2 flex items-center gap-3">
                                    {!item.read && (
                                        <button
                                            onClick={() => toggleRead(item.id)}
                                            className="text-[10px] font-bold text-[#1B4D28] hover:bg-[#EEF2EE] px-2.5 py-1 rounded-lg border border-green-100 bg-white shadow-sm transition-colors"
                                        >
                                            Mark Read
                                        </button>
                                    )}
                                    {item.link && (
                                        <Link href={item.link} className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-[#1B4D28] transition-colors mt-0.5">
                                            Action Item
                                            <ExternalLink size={10} />
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => deleteNotification(item.id)}
                                        className="text-[10px] font-bold text-red-400 hover:text-red-600 ml-auto transition-colors"
                                        title="Delete Log"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="p-4 bg-green-50 text-[#1B4D28] rounded-full mb-4">
                            <Bell size={32} />
                        </div>
                        <h3 className="text-base font-bold text-gray-800 mb-1">Clean slate</h3>
                        <p className="text-xs text-gray-400 max-w-xs font-semibold">
                            No notifications match this filter. You're all caught up!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
