"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { ShieldCheck, Mail, Lock, CheckCircle2, ArrowRight, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function AdminLoginPage() {
    const { updateUser } = useUser();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Toast success simulation
    const [successToast, setSuccessToast] = useState("");

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Please fill out all credential fields.");
            return;
        }

        setLoading(true);

        setTimeout(() => {
            const storedAdmins = localStorage.getItem("smarthub_admins");
            let adminsList = [];
            if (storedAdmins) {
                try {
                    adminsList = JSON.parse(storedAdmins);
                    if (!Array.isArray(adminsList)) {
                        adminsList = [];
                    }
                } catch (err) {
                    adminsList = [];
                }
            }

            // Find matching registered admin in localStorage
            const matchedAdmin = adminsList.find(
                (adm: any) => adm.email.toLowerCase() === email.toLowerCase()
            );

            if (matchedAdmin) {
                if (matchedAdmin.password === password) {
                    updateUser(matchedAdmin);
                    
                    setSuccessToast("Access authorized! Initializing Admin Dashboard...");
                    setTimeout(() => {
                        router.replace("/admin/overview");
                    }, 1500);
                } else {
                    setError("Access Denied: Incorrect password key.");
                    setLoading(false);
                }
            } else {
                // Fallback simulation bypass: For ease of testing, allow any email with 'admin' or olak@smarthub.com
                if (email.toLowerCase().includes("admin") || email === "olak@smarthub.com" || email === "olak@debridger.com") {
                    const fallbackUser = {
                        name: email === "olak@smarthub.com" || email === "olak@debridger.com" ? "OLAK" : "Admin",
                        email: email,
                        password: password, // Register with whatever password they typed
                        role: "admin" as const,
                        profileImage: "/avatar-1.png",
                        currency: "NGN",
                        country: "Nigeria",
                        address: "Smarthub Operations Headquarters, Lagos",
                    };

                    updateUser(fallbackUser);
                    
                    setSuccessToast("Access authorized! Initializing Admin Dashboard...");
                    setTimeout(() => {
                        router.replace("/admin/overview");
                    }, 1500);
                } else {
                    setError("Access Denied: Email address is not registered as an administrator.");
                    setLoading(false);
                }
            }
        }, 800);
    };

    // Quick Admin Demo Trigger (extremely satisfying for quick testing)
    const handleQuickLogin = () => {
        setLoading(true);
        setError("");
        
        setTimeout(() => {
            updateUser({
                name: "OLAK",
                email: "admin@smarthub.com",
                password: "admin",
                role: "admin",
                profileImage: "/avatar-1.png",
                currency: "NGN",
                country: "Nigeria",
                address: "Smarthub Operations Headquarters, Lagos",
            });
            
            setSuccessToast("Quick authorization granted! Entering Command Center...");
            setTimeout(() => {
                router.replace("/admin/overview");
            }, 1200);
        }, 500);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#EEF2EE] px-4 py-12 font-sans">
        <div className="w-full max-w-md relative">
            {/* Success Toast */}
            {successToast && (
                <div className="fixed top-6 right-6 z-50 bg-[#1B4D28] text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-[#2C5E39] animate-slideIn">
                    <CheckCircle2 size={20} className="text-[#4CAF50] flex-shrink-0" />
                    <span className="text-sm font-semibold">{successToast}</span>
                </div>
            )}

            {/* Emerald dark green styled login card */}
            <div className="bg-[#1B4D28] p-8 rounded-3xl border border-white/5 shadow-2xl space-y-6 animate-fadeIn">
                
                {/* Logo & Branding */}
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className="relative h-14 w-14 bg-white rounded-2xl overflow-hidden p-1 flex-shrink-0 shadow-lg ring-4 ring-white/5">
                        <Image
                            src="/LOGO.jpg"
                            alt="Smarthub Agrochain Logo"
                            fill
                            className="object-cover rounded-xl"
                        />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-lg font-black text-white tracking-tight">
                            Smarthub Agrochain
                        </h2>
                        <span className="inline-flex px-2.5 py-0.5 rounded-full bg-[#1B4D28] text-white text-[9px] font-bold uppercase tracking-wider">
                            Internal Portal
                        </span>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 flex items-start gap-2.5 text-xs font-semibold text-red-400">
                        <ShieldCheck size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                    {/* Email field */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-emerald-200/90 uppercase tracking-wider">
                            Administrator Email
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="e.g. admin@smarthub.com"
                                className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/35 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50]"
                            />
                            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-100/50" />
                        </div>
                    </div>

                    {/* Password field */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-emerald-200/90 uppercase tracking-wider">
                            Password Key
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••••••"
                                className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/35 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50]"
                            />
                            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-100/50" />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-100/50 hover:text-emerald-100 cursor-pointer"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white hover:bg-gray-50 text-[#1B4D28] py-3 px-4 rounded-xl text-xs font-bold shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1B4D28]"></div>
                        ) : (
                            <>
                                Authorize Access
                                <ArrowRight size={14} />
                            </>
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink mx-4 text-[10px] font-bold text-emerald-200/50 uppercase tracking-widest">Or</span>
                    <div className="flex-grow border-t border-white/10"></div>
                </div>

                {/* Quick Demo Admin Login Button (Super premium addition) */}
                <button
                    type="button"
                    onClick={handleQuickLogin}
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white py-3 px-4 rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                    <ShieldCheck size={16} className="text-[#81C784] animate-pulse" />
                    Bypass Auth (Demo)
                </button>

                {/* Footer Switch Link */}
                <div className="text-center pt-2">
                    <span className="text-xs text-emerald-100/70">New? </span>
                    <Link href="/admin/signup" className="text-xs font-bold text-emerald-300 hover:text-emerald-200 hover:underline transition-colors">
                        Register here
                    </Link>
                </div>

            </div>
        </div>
        </div>
    );
}
