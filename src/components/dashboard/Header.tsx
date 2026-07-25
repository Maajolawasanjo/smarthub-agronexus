"use client";

import { Menu, Search, Bell, ShoppingCart, Settings, LayoutDashboard, Package, Wallet, BellRing, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useCart } from "@/context/CartContext";
import { useSearch } from "@/context/SearchContext";

interface HeaderProps {
    onMenuClick: () => void;
}

// ── Route metadata map ─────────────────────────────────────────────────────
interface PageMeta {
    title: string;
    subtitle?: string;
    showSearch: boolean;
    showCart: boolean;
    Icon: React.ElementType;
}

const PAGE_META: Record<string, PageMeta> = {
    "/dashboard": {
        title: "Dashboard",
        subtitle: "Overview of your activity",
        showSearch: false,
        showCart: false,
        Icon: LayoutDashboard,
    },
    "/dashboard/products": {
        title: "Marketplace",
        subtitle: "Browse verified agro listings",
        showSearch: true,
        showCart: true,
        Icon: ShoppingBag,
    },
    "/dashboard/orders": {
        title: "My Orders",
        subtitle: "Track your purchases",
        showSearch: false,
        showCart: false,
        Icon: Package,
    },
    "/dashboard/wallet": {
        title: "Wallet",
        subtitle: "Manage your funds & transactions",
        showSearch: false,
        showCart: false,
        Icon: Wallet,
    },
    "/dashboard/notifications": {
        title: "Notifications",
        subtitle: "Your alerts and updates",
        showSearch: false,
        showCart: false,
        Icon: BellRing,
    },
    "/dashboard/settings": {
        title: "Settings",
        subtitle: "Manage your account & preferences",
        showSearch: false,
        showCart: false,
        Icon: Settings,
    },
};

// Resolve meta for current path (handles unknown sub-routes gracefully)
function getPageMeta(pathname: string): PageMeta {
    // Exact match first
    if (PAGE_META[pathname]) return PAGE_META[pathname];

    // Prefix match for nested routes (e.g. /dashboard/products/[id])
    const match = Object.keys(PAGE_META)
        .filter(key => key !== "/dashboard" && pathname.startsWith(key))
        .sort((a, b) => b.length - a.length)[0];

    if (match) return PAGE_META[match];

    // Fallback
    return {
        title: "Dashboard",
        showSearch: false,
        showCart: false,
        Icon: LayoutDashboard,
    };
}
// ──────────────────────────────────────────────────────────────────────────

export function Header({ onMenuClick }: HeaderProps) {
    const { user } = useUser();
    const { cartCount } = useCart();
    const { searchTerm, setSearchTerm } = useSearch();
    const router = useRouter();
    const pathname = usePathname();

    const meta = getPageMeta(pathname);

    const displayName = user?.fullName || user?.name || "User";
    const displayRole = user?.role === "FARMER"
        ? "Verified Farmer"
        : user?.role === "ADMIN"
        ? "System Admin"
        : "B2B Buyer";

    const initials = displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pathname !== "/dashboard/products") {
            router.push("/dashboard/products");
        }
    };

    return (
        <header className="h-16 bg-[#F9FBF8] border-b border-gray-200/60 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 gap-4">

            {/* Left: Mobile Menu Button + Dynamic Page Title */}
            <div className="flex items-center gap-3 shrink-0">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg md:hidden"
                    aria-label="Open menu"
                >
                    <Menu size={20} />
                </button>

                {/* Dynamic title — updates per page */}
                <div className="hidden lg:flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-[#1B4D28]/8 rounded-xl flex items-center justify-center">
                        <meta.Icon size={16} className="text-[#1B4D28]" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-gray-900 leading-tight tracking-tight">
                            {meta.title}
                        </h1>
                        {meta.subtitle && (
                            <p className="text-[10px] text-gray-400 font-medium leading-none mt-0.5">
                                {meta.subtitle}
                            </p>
                        )}
                    </div>
                </div>

                {/* Mobile: just the title text */}
                <h1 className="text-base font-bold text-gray-900 tracking-tight lg:hidden">
                    {meta.title}
                </h1>
            </div>

            {/* Center: Search Bar — only on Marketplace */}
            {meta.showSearch ? (
                <div className="flex-1 flex justify-center px-2 max-w-xl">
                    <form onSubmit={handleSearchSubmit} className="relative w-full group">
                        <Search
                            size={15}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1B4D28] transition-colors pointer-events-none"
                        />
                        <input
                            type="text"
                            placeholder="Search bulk commodities..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-[#EAEFE9]/70 border border-gray-200/50 rounded-full text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#1B4D28] focus:bg-white transition-all shadow-inner"
                        />
                    </form>
                </div>
            ) : (
                // Spacer so right section stays right-aligned on non-search pages
                <div className="flex-1" />
            )}

            {/* Right: Actions — Notifications + Cart (marketplace only) + Profile */}
            <div className="flex items-center gap-1.5 md:gap-3 shrink-0">

                {/* Notifications — always visible */}
                <Link href="/dashboard/notifications">
                    <button
                        className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-full relative transition-colors"
                        aria-label="Notifications"
                    >
                        <Bell size={18} />
                        <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
                    </button>
                </Link>

                {/* Cart — only on Marketplace */}
                {meta.showCart && (
                    <Link href="/cart">
                        <button
                            className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-full relative transition-colors"
                            aria-label="Cart"
                        >
                            <ShoppingCart size={18} />
                            {cartCount > 0 && (
                                <span className="absolute top-1 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#1B4D28] text-[9px] font-bold text-white border border-white">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </Link>
                )}

                <div className="h-6 w-px bg-gray-200 mx-0.5" />

                {/* Profile — always visible, links to settings */}
                <Link href="/dashboard/settings">
                    <button className="flex items-center gap-2.5 p-1 rounded-full hover:bg-gray-100 transition-colors group">
                        <div className="text-right hidden md:block">
                            <p className="text-xs font-bold text-gray-900 leading-tight group-hover:text-[#1B4D28] transition-colors">
                                {displayName}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{displayRole}</p>
                        </div>
                        {user?.profileImage ? (
                            <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm group-hover:border-[#1B4D28] transition-colors">
                                <Image
                                    src={user.profileImage}
                                    alt={displayName}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-9 h-9 bg-[#1B4D28] text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
                                {initials}
                            </div>
                        )}
                    </button>
                </Link>
            </div>
        </header>
    );
}
