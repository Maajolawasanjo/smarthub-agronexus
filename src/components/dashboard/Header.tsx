"use client";

import { Menu, Search, Bell, User, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useCart } from "@/context/CartContext";
import { useSearch } from "@/context/SearchContext";

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const { user } = useUser();
    const { cartCount } = useCart();
    const { searchTerm, setSearchTerm } = useSearch();
    const router = useRouter();
    const pathname = usePathname();

    // Default to "John Deo" if no user is set (though UserContext usually sets a default for demo)
    const displayName = user?.name || "John Deo";
    const displayRole = "Buyer"; // Static for now, or could vary
    const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pathname !== "/dashboard/products") {
            router.push("/dashboard/products");
        }
    };

    return (
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">

            {/* Left: Mobile Menu & Title */}
            <div className="flex items-center gap-4 min-w-[140px] md:min-w-[200px]">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-lg md:hidden"
                    aria-label="Menu"
                >
                    <Menu size={20} />
                </button>
                <h1 className="text-xl font-bold text-gray-800 hidden lg:block">Dashboard</h1>
            </div>

            {/* Center: Search Bar */}
            <div className="flex-1 flex justify-center px-4 max-w-2xl">
                <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md group">
                    <input
                        type="text"
                        placeholder="Search product..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700 focus:outline-none focus:border-[#1B4D28] focus:bg-white transition-all shadow-sm"
                    />
                    <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1B4D28] transition-colors">
                        <Search size={16} />
                    </button>
                </form>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 md:gap-4 min-w-[140px] md:min-w-[200px] justify-end">

                <div className="relative">
                    <Link href="/dashboard/notifications">
                        <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-full relative" aria-label="Notifications">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>
                    </Link>
                </div>

                <div className="relative">
                    <Link href="/cart">
                        <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-full relative" aria-label="Cart">
                            <ShoppingCart size={20} />
                            {cartCount > 0 && (
                                <span className="absolute top-1 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FFB800] text-[9px] font-bold text-white border border-white">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </Link>
                </div>

                <div className="h-8 w-px bg-gray-200 mx-1"></div>

                <Link href="/dashboard/settings">
                    <button className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-full hover:bg-gray-50 transition-colors">
                        <div className="text-right hidden md:block mr-2">
                            <p className="text-sm font-medium text-gray-700 leading-none">{displayName}</p>
                            <p className="text-xs text-gray-400 mt-1">{displayRole}</p>
                        </div>
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
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-[#1B4D28] font-bold border border-green-200">
                                {initials}
                            </div>
                        )}
                    </button>
                </Link>
            </div>
        </header>
    );
}
