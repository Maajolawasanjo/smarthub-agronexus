"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { ShieldCheck, Mail, Lock, User, Globe, Home, CheckCircle2, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function AdminSignupPage() {
    const { updateUser } = useUser();
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [country, setCountry] = useState("Nigeria");
    const [address, setAddress] = useState("");
    const [selectedAvatar, setSelectedAvatar] = useState("/avatar-1.png");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [successToast, setSuccessToast] = useState("");

    const handleSignupSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name || !email || !password || !address) {
            setError("Please fill out all required fields.");
            return;
        }

        setLoading(true);

        setTimeout(() => {
            // Check if email already registered in smarthub_admins array
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

            const emailExists = adminsList.some(
                (adm: any) => adm.email.toLowerCase() === email.toLowerCase()
            );

            if (emailExists) {
                setError("This email address is already registered as an administrator.");
                setLoading(false);
                return;
            }

            // Register and log in admin
            updateUser({
                name,
                email,
                password,
                role: "admin",
                profileImage: selectedAvatar,
                currency: "NGN",
                country,
                address,
            });

            setSuccessToast("Registration successful! Initializing secure Admin space...");
            setTimeout(() => {
                router.replace("/admin/overview");
            }, 1500);
        }, 1000);
    };

    return (
        <div className="w-full max-w-md p-6 font-sans relative my-8">
            {/* Success Toast */}
            {successToast && (
                <div className="fixed top-6 right-6 z-50 bg-[#1B4D28] text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-[#2C5E39] animate-slideIn">
                    <CheckCircle2 size={20} className="text-[#4CAF50] flex-shrink-0" />
                    <span className="text-sm font-semibold">{successToast}</span>
                </div>
            )}

            {/* Emerald dark green styled registration card */}
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
                            Administrator Register
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

                {/* Signup Form */}
                <form onSubmit={handleSignupSubmit} className="space-y-4">

                    {/* Name field */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-emerald-200/90 uppercase tracking-wider">
                            Full Name
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. OLAK Admin"
                                className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/35 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50]"
                            />
                            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-100/50" />
                        </div>
                    </div>

                    {/* Email field */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-emerald-200/90 uppercase tracking-wider">
                            Email Address
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
                            Access Key (Password)
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••••••"
                                className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/35 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50]"
                            />
                            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-100/50" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Country */}
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-emerald-200/90 uppercase tracking-wider">
                                Country
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    placeholder="Nigeria"
                                    className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/35 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50]"
                                />
                                <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-100/50" />
                            </div>
                        </div>

                        {/* Physical Address */}
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-emerald-200/90 uppercase tracking-wider">
                                HQ Address
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Lagos, Nigeria"
                                    className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/35 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50]"
                                />
                                <Home size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-100/50" />
                            </div>
                        </div>
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white hover:bg-gray-50 text-[#1B4D28] py-3 px-4 rounded-xl text-xs font-bold shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1B4D28]"></div>
                        ) : (
                            <>
                                Register & Log In
                                <ArrowRight size={14} />
                            </>
                        )}
                    </button>
                </form>

                {/* Footer Switch Link */}
                <div className="text-center pt-2">
                    <span className="text-xs text-emerald-100/70">Already registered? </span>
                    <Link href="/admin/login" className="text-xs font-bold text-emerald-300 hover:text-emerald-200 hover:underline transition-colors">
                        Log In here
                    </Link>
                </div>

            </div>
        </div>
    );
}
