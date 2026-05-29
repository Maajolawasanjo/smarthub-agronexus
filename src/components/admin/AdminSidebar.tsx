"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import {
    LayoutDashboard,
    Box,
    ShoppingCart,
    Users,
    BarChart2,
    FileText,
    Bell,
    Settings,
    LogOut,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface AdminSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const menuItems = [
    { name: "Overview", href: "/admin/overview", icon: LayoutDashboard },
    { name: "Product Listings", href: "/admin/products", icon: Box },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart2 },
    { name: "Content", href: "/admin/content", icon: FileText },
    { name: "Notification", href: "/admin/notifications", icon: Bell },
    { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
    const pathname = usePathname();
    const { logout } = useUser();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push("/admin/login");
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
                    "fixed top-0 left-0 h-full w-64 bg-[#1B4D28] border-r border-[#1B4D28] z-50 transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col justify-between",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center gap-3 px-6 py-6 mb-2">
                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-white p-1">
                            <Image
                                src="/LOGO.jpg"
                                alt="Debridger Logo"
                                fill
                                className="object-cover rounded-md"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-white text-sm leading-tight">
                                Smarthub <br /> Agrochain
                            </span>
                            <span className="text-[10px] text-gray-300 mt-0.5 font-medium">
                                Admin Portal
                            </span>
                        </div>
                        <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white ml-auto">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href || (item.href === "/admin/overview" && pathname === "/admin");
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => onClose()}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ease-in-out",
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
                            className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-white/5 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                        >
                            <LogOut size={20} />
                            Log Out [→
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
