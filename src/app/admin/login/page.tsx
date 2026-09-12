"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@/context/UserContext";
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
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
      setError("Please enter your email and password.");
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
        setError(data.error || "Invalid email or password.");
        return;
      }

      if (data.user?.role?.toUpperCase() !== "ADMIN") {
        setError("Access restricted to administrators only.");
        return;
      }

      setUserFromAuth(data.user);
      setSuccessToast("Welcome back! Redirecting...");

      setTimeout(() => {
        router.replace("/admin/overview");
      }, 800);
    } catch (err: any) {
      console.error("Admin login error:", err);
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[#F9FAF9] px-4 py-12 font-sans">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 z-50 bg-[#1B4D28] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-sm font-medium animate-fadeIn">
          <CheckCircle2 size={18} className="text-emerald-300" />
          <span>{successToast}</span>
        </div>
      )}

      <div className="w-full max-w-sm">
        {/* Simple Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-white shadow-sm border border-gray-150 p-1 mb-4">
            <Image
              src="/LOGO.jpg"
              alt="SmartHub AgroChain"
              width={40}
              height={40}
              className="object-cover rounded-lg"
              priority
            />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Admin Portal
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Sign in to manage SmartHub AgroChain
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[11px] font-semibold text-[#1B4D28]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1B4D28]" />
            <span>Administrator Access</span>
          </div>
        </div>

        {/* Clean Minimal Card */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 sm:p-7">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2.5 text-xs font-medium text-red-600">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@smarthubagro.com"
                  className="w-full h-10 px-3 pl-9 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1B4D28] focus:ring-1 focus:ring-[#1B4D28] transition-colors"
                />
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-10 px-3 pl-9 pr-9 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1B4D28] focus:ring-1 focus:ring-[#1B4D28] transition-colors"
                />
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-0.5"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-[#1B4D28] hover:bg-[#143d20] text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Minimal Footer */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Back to marketplace</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
