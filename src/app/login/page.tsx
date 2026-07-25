"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Mail, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

function Field({ label, error, children }: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-600 ml-1">{label}</label>
      {children}
      {error && (
        <div className="flex items-center gap-1 ml-1">
          <AlertCircle size={11} className="text-red-500 shrink-0" />
          <p className="text-[11px] text-red-500">{error}</p>
        </div>
      )}
    </div>
  );
}

function inputCls(hasError: boolean, hasValue: boolean): string {
  return cn(
    "w-full px-4 py-3 rounded-full border-2 text-sm outline-none transition-all duration-200 bg-white text-gray-800 placeholder:text-gray-400",
    hasError
      ? "border-red-400 focus:border-red-500 bg-red-50/30"
      : hasValue
        ? "border-[#1B4D28]"
        : "border-gray-200 focus:border-[#1B4D28]"
  );
}

type Tab = "buyer" | "farmer";

interface LoginForm {
  email: string;
  password: string;
}

function validateLogin(data: LoginForm): Partial<LoginForm> {
  const e: Partial<LoginForm> = {};
  if (!data.email.trim()) e.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = "Invalid email address";
  if (!data.password) e.password = "Password is required";
  return e;
}

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { setUserFromAuth } = useUser();

  const [tab, setTab] = useState<Tab>("buyer");
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<LoginForm>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof LoginForm, boolean>>>({});

  function touchField(field: keyof LoginForm): void {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(validateLogin(form));
  }

  function update(field: keyof LoginForm, value: string): void {
    setServerError(null);
    const next = { ...form, [field]: value };
    setForm(next);
    if (touched[field]) setErrors(validateLogin(next));
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setServerError(null);
    setTouched({ email: true, password: true });
    const errs = validateLogin(form);
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      toast("Please fix validation errors before submitting", "error");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = data.error || "Authentication failed. Please check credentials.";
        setServerError(errMsg);
        toast(errMsg, "error");
        return;
      }

      // Success: Hydrate user context from backend response
      setUserFromAuth(data.user);
      toast(`Welcome back, ${data.user.fullName || "User"}!`, "success");

      // Redirect by role with appropriate messaging
      const userRole = data.user.role?.toUpperCase();
      if (userRole === "FARMER") {
        toast(`Welcome back, ${data.user.fullName || "Farmer"}! Redirecting to Farmer Portal...`, "success");
        router.push("/farmer");
      } else if (userRole === "ADMIN") {
        toast(`Welcome back, ${data.user.fullName || "Admin"}! Redirecting to Admin Console...`, "success");
        router.push("/admin/overview");
      } else {
        toast(`Welcome back, ${data.user.fullName || "Buyer"}! Redirecting to Dashboard...`, "success");
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Login submission error:", err);
      const errMsg = "Unable to connect to the authentication server. Please check your network.";
      setServerError(errMsg);
      toast(errMsg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-10 relative">

        {/* Back */}
        <Link href="/" className="absolute top-5 left-5 text-gray-400 hover:text-[#1B4D28] transition-colors">
          <ArrowLeft size={22} />
        </Link>

        {/* Logo + Title */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-10 w-16 bg-gray-100 rounded-sm relative overflow-hidden mb-3">
            <Image src="/LOGO.jpg" alt="Smarthub Agrochain" fill className="object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-[#343A40] tracking-tight">Sign In</h1>
        </div>

        {/* Role Tabs */}
        <div className="flex rounded-full border border-gray-200 p-1 mb-7 bg-gray-50">
          {(["buyer", "farmer"] as Tab[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setForm({ email: "", password: "" });
                setErrors({});
                setTouched({});
                setServerError(null);
              }}
              className={cn(
                "flex-1 py-2 rounded-full text-xs font-semibold transition-all duration-200",
                tab === t
                  ? "bg-[#1B4D28] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {t === "buyer" ? "Buyer Sign In" : "Farmer Sign In"}
            </button>
          ))}
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 leading-snug">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* Email */}
          <Field label="Email" error={touched.email ? errors.email : undefined}>
            <div className="relative">
              <input
                type="email"
                placeholder="user@example.com"
                value={form.email}
                onChange={e => update("email", e.target.value)}
                onBlur={() => touchField("email")}
                className={cn(inputCls(!!(touched.email && errors.email), !!form.email), "pr-10")}
                autoComplete="email"
              />
              <Mail size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </Field>

          {/* Password */}
          <Field label="Password" error={touched.password ? errors.password : undefined}>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                placeholder="••••••••••"
                value={form.password}
                onChange={e => update("password", e.target.value)}
                onBlur={() => touchField("password")}
                className={cn(
                  "w-full pl-4 pr-11 py-3 rounded-full border-2 text-sm outline-none transition-all duration-200 bg-white text-gray-800 placeholder:text-gray-400 tracking-widest placeholder:tracking-normal",
                  touched.password && errors.password
                    ? "border-red-400 bg-red-50/30"
                    : form.password ? "border-[#1B4D28]" : "border-gray-200 focus:border-[#1B4D28]"
                )}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full py-3.5 rounded-full font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2",
                isLoading
                  ? "bg-[#1B4D28]/70 text-white cursor-not-allowed"
                  : "bg-[#1B4D28] hover:bg-[#153b1e] active:scale-[0.98] text-white shadow-lg shadow-green-900/20"
              )}
            >
              {isLoading ? <><Spinner /> Authenticating…</> : "Sign In"}
            </button>
          </div>

        </form>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Don&apos;t have an account yet?{" "}
          <Link href="/signup" className="font-bold text-[#1B4D28] hover:underline">Sign Up</Link>
        </p>

      </div>
    </div>
  );
}
