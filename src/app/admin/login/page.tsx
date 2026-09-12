"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/context/UserContext";
import {
  ShieldCheck,
  Mail,
  Lock,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  KeyRound,
  Shield,
} from "lucide-react";

export default function AdminLoginPage() {
  const { setUserFromAuth } = useUser();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successToast, setSuccessToast] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please provide all required administrator credentials.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Authentication failed. Invalid credentials.");
        return;
      }

      if (data.user?.role?.toUpperCase() !== "ADMIN") {
        setError("Access Denied: Account lacks administrative privileges.");
        return;
      }

      setUserFromAuth(data.user);
      setSuccessToast(`Welcome back, ${data.user.fullName || "Administrator"}! Initializing dashboard...`);

      setTimeout(() => {
        router.replace("/admin/overview");
      }, 900);
    } catch (err: any) {
      console.error("Admin login error:", err);
      setError("Network or server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-[#F4F7F4] px-4 py-12 font-sans overflow-hidden">
      {/* Soft Ambient Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-[#1B4D28]/10 via-[#1B4D28]/5 to-transparent blur-3xl rounded-full" />
        <div className="absolute -bottom-32 right-10 w-[500px] h-[500px] bg-[#1B4D28]/5 blur-3xl rounded-full" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #CBD5E1 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* Success Notification Banner */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 z-50 bg-[#1B4D28] text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-[#2C5E39]"
          >
            <CheckCircle2 size={20} className="text-[#4CAF50] flex-shrink-0 animate-bounce" />
            <span className="text-xs sm:text-sm font-semibold tracking-wide">{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="w-full max-w-[460px] relative z-10">
        {/* Top Back Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-[#1B4D28] transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span>Return to Marketplace</span>
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-[#1B4D28]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1B4D28] animate-pulse" />
            <span>Secure Admin Gateway</span>
          </div>
        </div>

        {/* Card Component (Clean Light Luxury) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white rounded-3xl border border-gray-200/80 shadow-[0_20px_60px_-15px_rgba(27,77,40,0.08)] p-8 sm:p-9"
        >
          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative h-16 w-16 bg-emerald-50/60 rounded-2xl p-1 shadow-sm border border-emerald-100 flex items-center justify-center mb-4">
              <Image
                src="/LOGO.jpg"
                alt="SmartHub AgroChain"
                fill
                className="object-cover rounded-xl"
                priority
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Admin Control Plane
            </h1>
            <p className="text-xs text-gray-500 mt-1 max-w-[320px]">
              Marketplace governance, treasury float, &amp; produce moderation desk
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-red-700">
                  <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold leading-relaxed">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700">
                Administrator Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@smarthubagro.com"
                  className="w-full bg-gray-50/60 border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:bg-white focus:border-[#1B4D28] focus:ring-2 focus:ring-[#1B4D28]/10 transition-all font-medium"
                />
                <Mail
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700">
                  Master Password Key
                </label>
                <span className="text-[10px] text-gray-400 font-medium">256-bit Encrypted</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-gray-50/60 border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none focus:bg-white focus:border-[#1B4D28] focus:ring-2 focus:ring-[#1B4D28]/10 transition-all font-mono"
                />
                <Lock
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Authorize Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1B4D28] hover:bg-[#143d20] text-white py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#1B4D28]/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Verifying Authority...</span>
                  </div>
                ) : (
                  <>
                    <KeyRound size={15} />
                    <span>Authorize Access</span>
                    <ArrowRight size={14} className="ml-1" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security Notice Box */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-start gap-3 text-gray-500">
            <Shield size={18} className="flex-shrink-0 text-[#1B4D28] mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong className="text-gray-700">Authorized Personnel Only:</strong> Administrative sessions are protected with HTTP-only tokens and logged in the immutable audit trail.
            </p>
          </div>
        </motion.div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-gray-400 mt-6 font-medium">
          SmartHub AgroChain &bull; Enterprise Governance Platform
        </p>
      </div>
    </div>
  );
}
