"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowUp } from "lucide-react";
import { useUser } from "@/context/UserContext";

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
    const { user } = useUser();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (totalHeight > 0) {
                const progress = (window.scrollY / totalHeight) * 100;
                setScrollProgress(progress);
            } else {
                setScrollProgress(0);
            }

            if (window.scrollY > 8) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

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
            {/* Scroll Progress Indicator Bar */}
            <div 
                className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-[#4CAF50] via-[#81C784] to-[#A3E635] z-[100] transition-all duration-100 ease-out"
                style={{ width: `${scrollProgress}%` }}
            />
            <nav className={cn(
                "fixed top-0 left-0 right-0 z-50 flex items-center justify-between transition-all duration-500 ease-in-out px-6 md:px-12",
                isScrolled ? "py-4 shadow-lg" : "py-6"
            )}>
                {/* Silky-Smooth Hardware-Accelerated Gradient Overlay Background */}
                <div className={cn(
                    "absolute inset-0 z-[-1] bg-gradient-to-b from-[#1B4D28] via-[#1B4D28]/98 to-[#1B4D28]/75 backdrop-blur-md border-b border-white/5 transition-all duration-500 ease-in-out",
                    isScrolled ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
                )} />
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
                        const targetHref = item.name === "Product" ? (user ? "/dashboard/products" : "/products") : item.href;
                        const isActive = pathname === targetHref;

                        return (
                            <Link
                                key={item.name}
                                href={targetHref}
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
                    "fixed inset-0 z-[100] bg-[#1B4D28] transition-transform duration-300 ease-in-out md:hidden flex flex-col",
                    isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#2C5E39] bg-[#1B4D28]">
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
                            <span className="font-bold text-white text-lg">Smarthub Agrochain</span>
                        </div>
                        {/* Notification Bell */}
                        <div className="relative text-gray-300 hover:text-white">
                            <BellIcon />
                        </div>
                    </div>

                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-gray-300 hover:text-white p-2"
                        title="Close Menu"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Mobile Menu Items */}
                <div className="flex-1 overflow-y-auto pt-4 px-6">
                    <div className="space-y-1">
                        {navItems.map((item) => {
                            const targetHref = item.name === "Product" ? (user ? "/dashboard/products" : "/products") : item.href;
                            const isActive = pathname === targetHref;
                            return (
                                <Link
                                    key={item.name}
                                    href={targetHref}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-4 px-4 py-4 rounded-lg transition-colors text-base font-medium",
                                        isActive
                                            ? "bg-white text-[#1B4D28] shadow-sm"
                                            : "text-gray-300 hover:bg-white/10 hover:text-white"
                                    )}
                                >
                                    <span className={isActive ? "text-[#1B4D28]" : "text-gray-400"}>
                                        {item.icon}
                                    </span>
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Mobile Footer Buttons */}
                <div className="p-6 border-t border-[#2C5E39] bg-[#1B4D28] grid grid-cols-2 gap-4">
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center px-4 py-3 rounded-full border border-white/60 text-white font-medium hover:bg-white/10 transition-colors">
                        Login
                    </Link>
                    <Link href="/dashboard/products" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center px-4 py-3 rounded-full bg-[#4CAF50] hover:bg-[#43A047] text-white font-medium transition-colors shadow-lg shadow-green-900/20">
                        Explore
                    </Link>
                </div>
            </div>

            {/* Floating Back to Top Button */}
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className={cn(
                    "fixed bottom-6 right-6 z-40 p-3 rounded-full bg-[#1B4D28] hover:bg-[#143d20] text-white border border-white/10 shadow-2xl transition-all duration-300 transform cursor-pointer flex items-center justify-center hover:scale-110 active:scale-95 group",
                    isScrolled ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                )}
                aria-label="Back to top"
            >
                <ArrowUp size={20} className="group-hover:-translate-y-0.5 transition-transform" />
            </button>
        </>
    );
}
