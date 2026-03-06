"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// --- Icons ---
const HomeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
);

const ProductIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <path d="M16 10a4 4 0 0 1-8 0"></path>
    </svg>
);

const GuideIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    </svg>
);

const UsersIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);

const PhoneIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
);

const BellIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
);

const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);



const navItems = [
    { name: "Home", href: "/", icon: <HomeIcon /> },
    { name: "Product", href: "/dashboard/products", icon: <ProductIcon /> },
    { name: "How it work", href: "/how-it-works", icon: <GuideIcon /> },
    { name: "About Us", href: "/about", icon: <UsersIcon /> },
    { name: "Contact", href: "/contact", icon: <PhoneIcon /> },
];

export function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [isMobileMenuOpen]);

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 md:px-12">
                {/* Logo Section */}
                <div className="flex items-center gap-3 relative z-50">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white/20">
                        <Image
                            src="/LOGO.jpg"
                            alt="Smarthub Agrochain Logo"
                            fill
                            className="object-cover"
                        />
                    </div>
                    {/* Mobile: hide text when menu is open */}
                    <span className={cn("text-white font-bold text-xl tracking-wide", isMobileMenuOpen ? "opacity-0 md:opacity-100" : "")}>
                        Smarthub Agrochain
                    </span>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center bg-white rounded-full px-1.5 py-1.5 shadow-xl">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;


                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "px-5 py-2 text-sm font-medium rounded-full transition-all duration-200",
                                    isActive
                                        ? "bg-[#2E6B34] text-white shadow-md"
                                        : "text-gray-600 hover:text-black hover:bg-gray-100"
                                )}
                            >
                                {item.name}
                            </Link>
                        );
                    })}
                </div>

                {/* Auth Actions & Cart */}
                <div className="hidden md:flex items-center gap-4">

                    <Link href="/login" className="px-8 py-2.5 text-white text-base font-normal border border-white/60 rounded-full hover:bg-white/10 transition-colors">
                        Login
                    </Link>
                    <Link href="/signup" className="px-8 py-2.5 bg-[#4CAF50] hover:bg-[#43A047] text-white text-base font-medium rounded-full transition-colors shadow-lg shadow-green-900/20">
                        Sign Up
                    </Link>
                </div>

                {/* Mobile Menu Trigger & Cart */}
                <div className="md:hidden flex items-center gap-4 relative z-50">


                    {!isMobileMenuOpen && (
                        <button
                            className="text-white p-1"
                            onClick={() => setIsMobileMenuOpen(true)}
                            title="Open Menu"
                        >
                            <div className="space-y-1.5">
                                <span className="block w-7 h-0.5 bg-current"></span>
                                <span className="block w-7 h-0.5 bg-current"></span>
                                <span className="block w-7 h-0.5 bg-current"></span>
                            </div>
                        </button>
                    )}
                </div>
            </nav>

            {/* Mobile Drawer */}
            <div
                className={cn(
                    "fixed inset-0 z-[100] bg-white transition-transform duration-300 ease-in-out md:hidden flex flex-col",
                    isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="relative h-8 w-8 overflow-hidden rounded-full">
                                <Image
                                    src="/LOGO.jpg"
                                    alt="Smarthub Agrochain Logo"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <span className="font-bold text-[#1B4D28] text-lg">Smarthub Agrochain</span>
                        </div>
                        {/* Notification Bell */}
                        <div className="relative text-gray-500">
                            <BellIcon />
                        </div>
                    </div>

                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-gray-500 hover:text-gray-800 p-2"
                        title="Close Menu"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Mobile Menu Items */}
                <div className="flex-1 overflow-y-auto pt-4 px-6">
                    <div className="space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-4 px-4 py-4 rounded-lg transition-colors text-base",
                                        isActive
                                            ? "bg-[#E8F5E9] text-gray-900 font-medium"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    )}
                                >
                                    <span className={isActive ? "text-[#2E6B34]" : "text-current"}>
                                        {item.icon}
                                    </span>
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Mobile Footer Buttons */}
                <div className="p-6 border-t border-gray-100 bg-white grid grid-cols-2 gap-4">
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center px-4 py-3 rounded-full border border-green-600 text-green-700 font-medium hover:bg-green-50 transition-colors">
                        Login
                    </Link>
                    <Link href="/dashboard/products" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center px-4 py-3 rounded-full bg-[#2E6B34] text-white font-medium hover:bg-[#25572a] transition-colors shadow-lg shadow-green-900/10">
                        Explore
                    </Link>
                </div>
            </div>
        </>
    );
}
