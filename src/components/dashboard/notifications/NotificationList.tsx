"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Bell, ShoppingBag, CreditCard, ShieldAlert, CheckCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationPageDTO } from "@/dto";
import { useToast } from "@/components/ui/Toast";

export function NotificationList() {
    const [dto, setDto] = useState<NotificationPageDTO | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const { toast } = useToast();

    async function fetchNotifications() {
        setIsLoading(true);
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data: NotificationPageDTO = await res.json();
                setDto(data);
            }
        } catch (err) {
            console.error("Failed to load notifications", err);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchNotifications();
    }, []);

    async function handleMarkAllAsRead() {
        setIsUpdating(true);
        try {
            const res = await fetch("/api/notifications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAll: true }),
            });
            if (res.ok) {
                toast("All notifications marked as read", "success");
                await fetchNotifications();
            }
        } catch (err) {
            toast("Failed to update notifications", "error");
        } finally {
            setIsUpdating(false);
        }
    }

    async function handleMarkSingleAsRead(notificationId: string) {
        try {
            const res = await fetch("/api/notifications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId }),
            });
            if (res.ok) {
                await fetchNotifications();
            }
        } catch (err) {
            console.error("Failed to mark notification as read", err);
        }
    }

    if (isLoading) {
        return (
            <div className="p-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center max-w-3xl">
                <Loader2 size={32} className="animate-spin text-[#1B4D28] mb-3" />
                <p className="text-sm font-medium">Hydrating real-time notifications...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-3xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Notifications</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {dto?.unreadCount ? `${dto.unreadCount} unread notifications` : "All notifications read"}
                    </p>
                </div>

                {dto && dto.unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllAsRead}
                        disabled={isUpdating}
                        className="px-4 py-2 bg-green-50 hover:bg-green-100 text-[#1B4D28] font-bold text-xs rounded-full transition-all flex items-center gap-1.5"
                    >
                        <CheckCheck size={14} />
                        Mark All Read
                    </button>
                )}
            </div>

            {!dto || dto.notifications.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                    <Bell size={40} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No notifications yet.</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-50">
                    {dto.notifications.map((item) => {
                        let Icon = Bell;
                        let iconColor = "text-gray-600";
                        let iconBg = "bg-gray-50";

                        switch (item.type) {
                            case "ORDER":
                                Icon = ShoppingBag;
                                iconColor = "text-[#1B4D28]";
                                iconBg = "bg-green-50";
                                break;
                            case "PAYMENT":
                                Icon = CreditCard;
                                iconColor = "text-amber-600";
                                iconBg = "bg-amber-50";
                                break;
                            case "SYSTEM":
                                Icon = ShieldAlert;
                                iconColor = "text-blue-600";
                                iconBg = "bg-blue-50";
                                break;
                        }

                        return (
                            <div
                                key={item.id}
                                onClick={() => !item.read && handleMarkSingleAsRead(item.id)}
                                className={cn(
                                    "p-4 transition-colors flex items-start gap-4 cursor-pointer",
                                    item.read ? "hover:bg-gray-50/50" : "bg-green-50/20 hover:bg-green-50/40"
                                )}
                            >
                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", iconBg)}>
                                    <Icon size={20} className={iconColor} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className={cn("text-sm text-gray-900 mb-1 truncate pr-2", item.read ? "font-semibold opacity-80" : "font-bold")}>
                                            {item.title}
                                        </h3>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className={cn("text-xs text-gray-600 leading-relaxed", item.read ? "font-normal" : "font-medium text-gray-800")}>
                                        {item.message}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
