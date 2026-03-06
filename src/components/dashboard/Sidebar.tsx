"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import {
    LayoutDashboard,
    Wallet,
    ShoppingCart,
    Truck,
    Bell,
    Settings,
    Box,
    LogOut,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
    { name: "Product", href: "/dashboard/products", icon: Box },
    { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
    { name: "Tracking", href: "/dashboard/tracking", icon: Truck },
    { name: "Notification", href: "/dashboard/notifications", icon: Bell },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { logout } = useUser();
    const router = useRouter();

    const handleLogout = () => {
        logout();
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
                    "fixed top-0 left-0 h-full w-64 bg-[#1B4D28] border-r border-[#1B4D28] z-50 transition-transform duration-300 ease-in-out md:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex flex-col h-full">

                    {/* Header */}
                    <div className="flex items-center gap-3 px-6 py-6 mb-2">
                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-white p-1">
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
                        <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white ml-auto">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out",
                                        isActive
                                            ? "bg-white text-[#1B4D28] shadow-sm"
                                            : "text-gray-300 hover:bg-white/10 hover:text-white"
                                    )}
                                >
                                    <Icon size={20} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-[#2C5E39]">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-white/5 rounded-lg text-sm font-medium transition-colors"
                        >
                            <LogOut size={20} />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
