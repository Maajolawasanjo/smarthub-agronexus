"use client";

import { Menu, Search, Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import Image from "next/image";
import { useState, useEffect } from "react";

interface AdminHeaderProps {
    onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
    const pathname = usePathname();
    const { user, loading } = useUser();
    const [isScrolled, setIsScrolled] = useState(false);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [currentDateStr, setCurrentDateStr] = useState<string>("");

    useEffect(() => {
        setCurrentDateStr(
            new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
            })
        );

        const handleScroll = () => {
            if (window.scrollY > 8) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll();

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

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const getPageTitle = () => {
        if (pathname === "/admin/analytics") return "Analytics & Report";
        if (pathname === "/admin/products") return "Product Listings";
        if (pathname === "/admin/orders") return "Orders";
        if (pathname === "/admin/users") return "User Management";
        if (pathname === "/admin/content") return "Content Management";
        if (pathname === "/admin/notifications") return "Notifications Center";
        if (pathname === "/admin/settings") return "Settings & Config";
        return "Admin Overview";
    };

    const displayName = user?.fullName || user?.name || "System Admin";
    const initials = displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);

    return (
        <header
            className={`sticky top-0 z-30 flex items-center justify-between transition-all duration-500 ease-in-out px-4 md:px-8 ${
                isScrolled ? "py-4 shadow-sm" : "py-6"
            }`}
        >
            <div
                className={`absolute inset-0 z-[-1] bg-gradient-to-b from-[#EEF2EE] via-[#EEF2EE]/98 to-[#EEF2EE]/75 backdrop-blur-md border-b border-gray-200/40 transition-all duration-500 ease-in-out ${
                    isScrolled ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
                }`}
            />
            {/* Left: Mobile Menu & Page Title */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 text-gray-600 hover:bg-white rounded-lg md:hidden shadow-sm border border-gray-100 bg-white"
                    aria-label="Menu"
                >
                    <Menu size={20} />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight leading-none md:text-2xl">
                        {getPageTitle()}
                    </h1>
                    <span className="text-xs text-gray-400 mt-1 md:mt-2 font-medium">
                        {currentDateStr}
                    </span>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 md:gap-3">
                <Link href="/admin/products" className="p-2 text-gray-500 hover:bg-white hover:shadow-sm rounded-full border border-transparent hover:border-gray-100 transition-all bg-transparent" aria-label="Search">
                    <Search size={20} />
                </Link>

                {/* Notifications Bell */}
                <Link href="/admin/notifications" className="relative">
                    <button className="p-2 text-gray-500 hover:bg-white hover:shadow-sm rounded-full border border-transparent hover:border-gray-100 transition-all bg-transparent relative" aria-label="Notifications">
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border border-white">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </Link>

                <div className="h-6 w-px bg-gray-200 mx-1"></div>

                {/* User Profile */}
                <Link href="/admin/settings">
                    <button className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all bg-transparent">
                        <div className="text-right hidden md:block mr-2">
                            {loading ? (
                                <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
                            ) : (
                                <p className="text-sm font-bold text-gray-800 leading-none">{displayName}</p>
                            )}
                            <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">
                                Administrator
                            </p>
                        </div>
                        {user?.profileImage ? (
                            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-green-200 bg-white">
                                <Image
                                    src={user.profileImage}
                                    alt={displayName}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-8 h-8 bg-[#1B4D28] rounded-full flex items-center justify-center text-white text-xs font-bold border border-green-200">
                                {initials}
                            </div>
                        )}
                    </button>
                </Link>
            </div>
        </header>
    );
}
