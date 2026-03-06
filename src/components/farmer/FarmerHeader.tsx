"use client";

import { Menu, Search, Bell, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useUser } from "@/context/UserContext";

interface FarmerHeaderProps {
    onMenuClick: () => void;
}

export function FarmerHeader({ onMenuClick }: FarmerHeaderProps) {
    const { user } = useUser();

    // Extract first name for a friendly greeting
    const firstName = user?.name?.split(" ")[0] || "Farmer";

    return (
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
            {/* Left: hamburger (mobile) */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-1 text-gray-600 hover:bg-gray-50 rounded-lg md:hidden"
                    aria-label="Open menu"
                >
                    <Menu size={20} />
                </button>

                <div className="flex items-center gap-2 md:hidden">
                    <div className="relative h-7 w-7 flex-shrink-0 overflow-hidden rounded-md bg-white border border-gray-100">
                        <Image
                            src="/LOGO.jpg"
                            alt="Smarthub Agrochain Logo"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <span className="font-bold text-[#1B4D28] text-xs">Smarthub Agrochain</span>
                </div>

                {/* Welcome text */}
                <div>
                    <p className="text-sm font-semibold text-gray-800 leading-tight">
                        Welcome Back, {firstName}!
                    </p>
                    <p className="text-xs text-gray-400 leading-tight hidden sm:block">
                        Here&apos;s your farm overview for today.
                    </p>
                </div>
            </div>

            {/* Right: icons */}
            <div className="flex items-center gap-2">
                {/* Search */}
                <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-full" aria-label="Search">
                    <Search size={18} />
                </button>

                {/* Notifications */}
                <div className="relative">
                    <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-full relative" aria-label="Notifications">
                        <Bell size={18} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                    </button>
                </div>

                {/* Cart */}
                <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-full relative" aria-label="Cart">
                    <ShoppingCart size={18} />
                    <span className="absolute top-1 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FFB800] text-[9px] font-bold text-white border border-white">
                        3
                    </span>
                </button>

                {/* Avatar */}
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-green-200 ml-1">
                    <Image
                        src={user?.profileImage || "/avatar-2.png"}
                        alt="Farmer profile"
                        fill
                        className="object-cover"
                    />
                </div>
            </div>
        </header>
    );
}

