"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingBag,
    List,
    Wallet,
    Bell,
    Settings,
    LogOut,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface FarmerSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const menuItems = [
    { name: "Overview", href: "/farmer", icon: LayoutDashboard },
    { name: "Sell Product", href: "/farmer/sell", icon: ShoppingBag },
    { name: "My Listings", href: "/farmer/listings", icon: List },
    { name: "Wallet", href: "/farmer/wallet", icon: Wallet },
    { name: "Notification", href: "/farmer/notifications", icon: Bell },
    { name: "Settings", href: "/farmer/settings", icon: Settings },
];

export function FarmerSidebar({ isOpen, onClose }: FarmerSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        router.push("/");
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed top-0 left-0 h-full w-56 bg-[#1B4D28] z-50 transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Logo / Brand */}
                <div className="flex items-center justify-between px-5 py-5 border-b border-[#2C5E39]">
                    <div className="flex items-center gap-2.5">
                        <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-md bg-white p-0.5">
                            <Image
                                src="/LOGO.jpg"
                                alt="Smarthub Agrochain Logo"
                                fill
                                className="object-cover rounded-md"
                            />
                        </div>
                        <span className="font-semibold text-white text-base leading-tight">
                            Smarthub <br /> Agrochain
                        </span>
                    </div>
                    {/* Notification dot */}
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Bell size={16} className="text-white" />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-[#1B4D28]" />
                        </div>
                        <button
                            onClick={onClose}
                            className="md:hidden text-gray-300 hover:text-white"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive =
                            item.href === "/farmer"
                                ? pathname === "/farmer"
                                : pathname.startsWith(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-white text-[#1B4D28] shadow-sm"
                                        : "text-gray-300 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                <Icon size={18} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="px-3 pb-5 border-t border-[#2C5E39] pt-3">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 w-full text-gray-300 hover:bg-white/5 rounded-lg text-sm font-medium transition-colors hover:text-white"
                    >
                        <LogOut size={18} />
                        Log Out
                    </button>
                </div>
            </aside>
        </>
    );
}
