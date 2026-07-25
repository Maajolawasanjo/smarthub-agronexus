"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import {
    LayoutDashboard,
    PlusCircle,
    ListFilter,
    ShoppingCart,
    Wallet,
    ShieldCheck,
    Settings,
    LogOut,
    X,
    Users,
    Star,
    BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface FarmerSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
    activeTab?: string;
}

const menuItems = [
    { name: "Dashboard", href: "/farmer", icon: LayoutDashboard },
    { name: "Sell Produce", href: "/farmer/sell", icon: PlusCircle },
    { name: "Listings & Approval", href: "/farmer/listings", icon: ListFilter },
    { name: "Orders", href: "/farmer/orders", icon: ShoppingCart },
    { name: "Payouts & Wallet", href: "/farmer/wallet", icon: Wallet },
    { name: "Customers", href: "/farmer/customers", icon: Users },
    { name: "Reviews", href: "/farmer/reviews", icon: Star },
    { name: "Analytics", href: "/farmer/analytics", icon: BarChart3 },
    { name: "KYC Verification", href: "/farmer/kyc", icon: ShieldCheck },
    { name: "Settings", href: "/farmer/settings", icon: Settings },
];


export function FarmerSidebar({ isOpen, onClose }: FarmerSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useUser();

    const handleLogout = async () => {
        await logout();
        router.push("/login");
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
                    "fixed top-0 left-0 h-full w-64 bg-[#1B4D28] z-50 transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Logo / Brand */}
                <div className="flex items-center justify-between px-6 py-6 border-b border-[#2C5E39]">
                    <div className="flex items-center gap-3">
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
                    </div>
                    <button
                        onClick={onClose}
                        className="md:hidden text-gray-300 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
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
                                        ? "bg-white text-[#1B4D28] font-semibold shadow-sm"
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
                <div className="px-4 pb-5 border-t border-[#2C5E39] pt-3">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 w-full text-red-300 hover:bg-white/10 hover:text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}
