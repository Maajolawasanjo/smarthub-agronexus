"use client";

import { useEffect, useState } from "react";
import { Menu, Search, Bell, ShoppingCart, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useCart } from "@/context/CartContext";

interface FarmerHeaderProps {
    onMenuClick: () => void;
}

export function FarmerHeader({ onMenuClick }: FarmerHeaderProps) {
    const { user, loading } = useUser();
    const { cartCount } = useCart();
    const [unreadCount, setUnreadCount] = useState<number>(0);

    useEffect(() => {
        async function fetchNotifications() {
            try {
                const res = await fetch("/api/notifications");
                if (res.ok) {
                    const data = await res.json();
                    setUnreadCount(data.unreadCount || 0);
                }
            } catch {
                setUnreadCount(0);
            }
        }
        fetchNotifications();
    }, []);

    const displayName = user?.fullName || user?.name || "Farmer";
    const firstName = displayName.split(" ")[0];
    const initials = displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);

    const isVerified = user?.verificationStatus === "APPROVED";

    return (
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 font-sans">
            {/* Left: Hamburger + Greeting */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-1 text-gray-600 hover:bg-gray-50 rounded-lg md:hidden"
                    aria-label="Open menu"
                >
                    <Menu size={20} />
                </button>

                <div>
                    {loading ? (
                        <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                    ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-extrabold text-gray-900 leading-tight truncate max-w-[180px] sm:max-w-xs md:max-w-none">
                                Welcome Back, {firstName}!
                            </p>
                            {isVerified && (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                    <CheckCircle2 size={12} className="text-emerald-600" />
                                    Verified Producer
                                </span>
                            )}
                        </div>
                    )}
                    <p className="text-xs text-gray-400 leading-tight hidden sm:block mt-0.5">
                        Here&apos;s your real-time farm overview.
                    </p>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                <Link href="/farmer/listings">
                    <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-full" aria-label="Search">
                        <Search size={18} />
                    </button>
                </Link>

                {/* Notifications */}
                <div className="relative">
                    <Link href="/farmer/notifications">
                        <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-full relative" aria-label="Notifications">
                            <Bell size={18} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                            )}
                        </button>
                    </Link>
                </div>

                {/* Cart */}
                <div className="relative">
                    <Link href="/cart">
                        <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-full relative" aria-label="Cart">
                            <ShoppingCart size={18} />
                            {cartCount > 0 && (
                                <span className="absolute top-1 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#1B4D28] text-[9px] font-bold text-white border border-white">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </Link>
                </div>

                {/* Avatar / Profile */}
                <Link href="/farmer/settings" className="ml-1">
                    {user?.profileImage ? (
                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-green-200">
                            <Image
                                src={user.profileImage}
                                alt={displayName}
                                fill
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-8 h-8 bg-[#1B4D28] text-white rounded-full flex items-center justify-center text-xs font-bold border border-green-200">
                            {initials}
                        </div>
                    )}
                </Link>
            </div>
        </header>
    );
}
