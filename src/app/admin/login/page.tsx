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
  Fingerprint,
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
      setSuccessToast(`Welcome back, ${data.user.fullName || "Administrator"}. Initializing session...`);

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
    <div className="min-h-screen w-full relative flex items-center justify-center bg-[#070D08] px-4 py-12 font-sans overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-emerald-600/15 via-emerald-800/10 to-transparent blur-3xl rounded-full" />
        <div className="absolute -bottom-40 right-10 w-[500px] h-[500px] bg-emerald-950/20 blur-3xl rounded-full" />
        <div className="absolute top-1/3 left-10 w-[400px] h-[400px] bg-emerald-900/10 blur-3xl rounded-full" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
            backgroundSize: "32px 32px",
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
            className="fixed top-6 z-50 bg-[#122E1A] text-emerald-100 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/30 backdrop-blur-xl"
          >
            <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0 animate-bounce" />
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
            className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400/80 hover:text-emerald-300 transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span>Return to Public Marketplace</span>
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Encrypted Gateway</span>
          </div>
        </div>

        {/* Card Component */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-[#0E1A11]/90 backdrop-blur-2xl rounded-3xl border border-emerald-500/20 shadow-[0_20px_70px_-15px_rgba(0,0,0,0.8)] overflow-hidden p-8 sm:p-9"
        >
          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative h-16 w-16 bg-gradient-to-br from-emerald-400/20 to-emerald-950/80 rounded-2xl p-1 shadow-xl ring-2 ring-emerald-500/30 flex items-center justify-center mb-4">
              <Image
                src="/LOGO.jpg"
                alt="SmartHub AgroChain"
                fill
                className="object-cover rounded-xl"
                priority
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Admin Control Plane</span>
            </h1>
            <p className="text-xs text-emerald-200/60 mt-1.5 max-w-[320px]">
              Governance, Treasury, &amp; Product Moderation Portal
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
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-red-300">
                  <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300/80">
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
                  className="w-full bg-[#08120A] border border-emerald-500/25 text-white placeholder:text-emerald-300/25 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                />
                <Mail
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400/50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300/80">
                  Master Password Key
                </label>
                <span className="text-[10px] text-emerald-400/50">256-bit Encrypted</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#08120A] border border-emerald-500/25 text-white placeholder:text-emerald-300/25 rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all font-mono"
                />
                <Lock
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400/50 hover:text-emerald-300 transition-colors p-1"
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
                className="w-full bg-gradient-to-r from-[#22C55E] to-[#15803D] hover:from-[#26D968] hover:to-[#169145] text-white py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-950/80 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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

          {/* Security Disclaimer */}
          <div className="mt-8 pt-6 border-t border-emerald-500/10 flex items-start gap-3 text-emerald-400/60">
            <Fingerprint size={20} className="flex-shrink-0 text-emerald-500/60 mt-0.5" />
            <p className="text-[10px] leading-relaxed">
              <strong className="text-emerald-400/80">Authorized Personnel Only:</strong> All login attempts, administrative decisions, and financial operations are cryptographically signed and logged in the immutable audit ledger.
            </p>
          </div>
        </motion.div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-emerald-400/40 mt-6 font-medium">
          SmartHub AgroChain &bull; Enterprise Governance Platform
        </p>
      </div>
    </div>
  );
}
