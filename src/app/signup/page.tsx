"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Mail, User, Phone, Tractor, AlertCircle, Check } from "lucide-react";
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

function Field({
    label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) {
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

function inputCls(hasError: boolean, hasValue: boolean) {
    return cn(
        "w-full px-4 py-3 rounded-full border-2 text-sm outline-none transition-all duration-200 bg-white text-gray-800 placeholder:text-gray-400",
        hasError
            ? "border-red-400 focus:border-red-500 bg-red-50/30"
            : hasValue
                ? "border-[#1B4D28]"
                : "border-gray-200 focus:border-[#1B4D28]"
    );
}

const NG_STATES = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe",
    "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
    "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
    "Taraba", "Yobe", "Zamfara",
];

const PW_RULES = [
    { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
    { label: "One number or symbol", test: (p: string) => /[0-9!@#$%^&*()_+\-=]/.test(p) },
];

type Tab = "buyer" | "farmer";

interface BuyerForm {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

interface FarmerForm {
    fullName: string;
    farmName: string;
    state: string;
    phone: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export default function SignUpPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { updateUser } = useUser();

    const [tab, setTab] = useState<Tab>("buyer");
    const [isLoading, setIsLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    const [buyer, setBuyer] = useState<BuyerForm>({
        fullName: "", email: "", password: "", confirmPassword: "",
    });
    const [buyerErrors, setBuyerErrors] = useState<Partial<BuyerForm>>({});
    const [buyerTouched, setBuyerTouched] = useState<Partial<Record<keyof BuyerForm, boolean>>>({});

    const [farmer, setFarmer] = useState<FarmerForm>({
        fullName: "", farmName: "", state: "", phone: "", email: "", password: "", confirmPassword: "",
    });
    const [farmerErrors, setFarmerErrors] = useState<Partial<FarmerForm>>({});
    const [farmerTouched, setFarmerTouched] = useState<Partial<Record<keyof FarmerForm, boolean>>>({});

    const currentPw = tab === "buyer" ? buyer.password : farmer.password;

    function validateBuyer(data: BuyerForm): Partial<BuyerForm> {
        const e: Partial<BuyerForm> = {};
        if (!data.fullName.trim()) e.fullName = "Full name is required";
        else if (data.fullName.trim().length < 2) e.fullName = "Name is too short";
        if (!data.email.trim()) e.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = "Invalid email address";
        if (!data.password) e.password = "Password is required";
        else if (!PW_RULES.every(r => r.test(data.password))) e.password = "Password doesn't meet all requirements";
        if (!data.confirmPassword) e.confirmPassword = "Please confirm your password";
        else if (data.password !== data.confirmPassword) e.confirmPassword = "Passwords do not match";
        return e;
    }

    function validateFarmer(data: FarmerForm): Partial<FarmerForm> {
        const e: Partial<FarmerForm> = {};
        if (!data.fullName.trim()) e.fullName = "Full name is required";
        else if (data.fullName.trim().length < 2) e.fullName = "Name is too short";
        if (!data.farmName.trim()) e.farmName = "Farm name is required";
        if (!data.state) e.state = "Please select a state";
        if (!data.phone.trim()) e.phone = "Phone number is required";
        else if (!/^[0-9+\s\-()]{7,15}$/.test(data.phone)) e.phone = "Invalid phone number";
        if (!data.email.trim()) e.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = "Invalid email address";
        if (!data.password) e.password = "Password is required";
        else if (!PW_RULES.every(r => r.test(data.password))) e.password = "Password doesn't meet all requirements";
        if (!data.confirmPassword) e.confirmPassword = "Please confirm your password";
        else if (data.password !== data.confirmPassword) e.confirmPassword = "Passwords do not match";
        return e;
    }

    function touchBuyer(field: keyof BuyerForm): void {
        setBuyerTouched(prev => ({ ...prev, [field]: true }));
        setBuyerErrors(validateBuyer(buyer));
    }

    function touchFarmer(field: keyof FarmerForm) {
        setFarmerTouched(prev => ({ ...prev, [field]: true }));
        setFarmerErrors(validateFarmer(farmer));
    }

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        if (tab === "buyer") {
            // Mark all touched
            setBuyerTouched({ fullName: true, email: true, password: true, confirmPassword: true });
            const errs = validateBuyer(buyer);
            setBuyerErrors(errs);
            if (Object.keys(errs).length > 0) {
                toast("Please fix the errors before continuing", "error");
                return;
            }
            setIsLoading(true);
            await new Promise(r => setTimeout(r, 1800));
            updateUser({ name: buyer.fullName, email: buyer.email, role: "buyer" });
            toast("Account created successfully!", "success");
            router.push("/dashboard");
        } else {
            // Mark all touched
            setFarmerTouched({ fullName: true, farmName: true, state: true, phone: true, email: true, password: true, confirmPassword: true });
            const errs = validateFarmer(farmer);
            setFarmerErrors(errs);
            if (Object.keys(errs).length > 0) {
                toast("Please fix the errors before continuing", "error");
                return;
            }
            setIsLoading(true);
            await new Promise(r => setTimeout(r, 1800));
            updateUser({
                name: farmer.fullName,
                email: farmer.email,
                role: "farmer",
                farmName: farmer.farmName,
                phone: farmer.phone,
                state: farmer.state,
            });
            toast("Farmer account created successfully!", "success");
            router.push("/farmer");
        }

        setIsLoading(false);
    };

    const bErr = buyerErrors;
    const bTch = buyerTouched;
    const fErr = farmerErrors;
    const fTch = farmerTouched;

    const sharedPwInputCls = cn(
        "w-full pl-4 pr-11 py-3 rounded-full border-2 text-sm outline-none transition-all duration-200 bg-white text-gray-800 placeholder:text-gray-400 tracking-widest placeholder:tracking-normal",
        tab === "buyer"
            ? (bTch.password && bErr.password
                ? "border-red-400 bg-red-50/30"
                : buyer.password ? "border-[#1B4D28]" : "border-gray-200 focus:border-[#1B4D28]")
            : (fTch.password && fErr.password
                ? "border-red-400 bg-red-50/30"
                : farmer.password ? "border-[#1B4D28]" : "border-gray-200 focus:border-[#1B4D28]")
    );

    const sharedConfirmCls = cn(
        "w-full pl-4 pr-11 py-3 rounded-full border-2 text-sm outline-none transition-all duration-200 bg-white text-gray-800 placeholder:text-gray-400 tracking-widest placeholder:tracking-normal",
        tab === "buyer"
            ? (bTch.confirmPassword && bErr.confirmPassword
                ? "border-red-400 bg-red-50/30"
                : buyer.confirmPassword ? "border-[#1B4D28]" : "border-gray-200 focus:border-[#1B4D28]")
            : (fTch.confirmPassword && fErr.confirmPassword
                ? "border-red-400 bg-red-50/30"
                : farmer.confirmPassword ? "border-[#1B4D28]" : "border-gray-200 focus:border-[#1B4D28]")
    );

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-10 relative">

                {/* Back */}
                <Link href="/" className="absolute top-5 left-5 text-gray-400 hover:text-[#1B4D28] transition-colors">
                    <ArrowLeft size={22} />
                </Link>

                {/* Logo + Title */}
                <div className="flex flex-col items-center mb-6">
                    <div className="h-10 w-16 bg-gray-100 rounded-sm relative overflow-hidden mb-3">
                        <Image src="/LOGO.jpg" alt="Smarthub Agrochain" fill className="object-cover" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#343A40] tracking-tight">Sign Up</h1>
                </div>

                {/* Tabs */}
                <div className="flex rounded-full border border-gray-200 p-1 mb-7 bg-gray-50">
                    {(["buyer", "farmer"] as Tab[]).map(t => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTab(t)}
                            className={cn(
                                "flex-1 py-2 rounded-full text-xs font-semibold transition-all duration-200",
                                tab === t
                                    ? "bg-[#1B4D28] text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {t === "buyer" ? "Buyer Sign Up" : "Farmer Sign Up"}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-4">

                    {/* ── BUYER FIELDS ── */}
                    {tab === "buyer" && (
                        <>
                            <Field label="Full Name" error={bTch.fullName ? bErr.fullName : undefined}>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        value={buyer.fullName}
                                        onChange={e => { setBuyer(p => ({ ...p, fullName: e.target.value })); if (bTch.fullName) setBuyerErrors(validateBuyer({ ...buyer, fullName: e.target.value })); }}
                                        onBlur={() => touchBuyer("fullName")}
                                        className={cn(inputCls(!!(bTch.fullName && bErr.fullName), !!buyer.fullName), "pr-10")}
                                        autoComplete="name"
                                    />
                                    <User size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </Field>

                            <Field label="Email" error={bTch.email ? bErr.email : undefined}>
                                <div className="relative">
                                    <input
                                        type="email"
                                        placeholder="johndoe@gmail.com"
                                        value={buyer.email}
                                        onChange={e => { setBuyer(p => ({ ...p, email: e.target.value })); if (bTch.email) setBuyerErrors(validateBuyer({ ...buyer, email: e.target.value })); }}
                                        onBlur={() => touchBuyer("email")}
                                        className={cn(inputCls(!!(bTch.email && bErr.email), !!buyer.email), "pr-10")}
                                        autoComplete="email"
                                    />
                                    <Mail size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </Field>
                        </>
                    )}

                    {/* ── FARMER FIELDS ── */}
                    {tab === "farmer" && (
                        <>
                            <Field label="Full Name" error={fTch.fullName ? fErr.fullName : undefined}>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        value={farmer.fullName}
                                        onChange={e => { setFarmer(p => ({ ...p, fullName: e.target.value })); if (fTch.fullName) setFarmerErrors(validateFarmer({ ...farmer, fullName: e.target.value })); }}
                                        onBlur={() => touchFarmer("fullName")}
                                        className={cn(inputCls(!!(fTch.fullName && fErr.fullName), !!farmer.fullName), "pr-10")}
                                        autoComplete="name"
                                    />
                                    <User size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </Field>

                            <Field label="Farm Name" error={fTch.farmName ? fErr.farmName : undefined}>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Oak Farm"
                                        value={farmer.farmName}
                                        onChange={e => { setFarmer(p => ({ ...p, farmName: e.target.value })); if (fTch.farmName) setFarmerErrors(validateFarmer({ ...farmer, farmName: e.target.value })); }}
                                        onBlur={() => touchFarmer("farmName")}
                                        className={cn(inputCls(!!(fTch.farmName && fErr.farmName), !!farmer.farmName), "pr-10")}
                                    />
                                    <Tractor size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </Field>

                            {/* State + Phone row */}
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="State" error={fTch.state ? fErr.state : undefined}>
                                    <select
                                        value={farmer.state}
                                        onChange={e => { setFarmer(p => ({ ...p, state: e.target.value })); if (fTch.state) setFarmerErrors(validateFarmer({ ...farmer, state: e.target.value })); }}
                                        onBlur={() => touchFarmer("state")}
                                        className={cn(
                                            "w-full px-4 py-3 rounded-full border-2 text-sm outline-none transition-all duration-200 bg-white appearance-none",
                                            fTch.state && fErr.state
                                                ? "border-red-400 text-red-500"
                                                : farmer.state ? "border-[#1B4D28] text-gray-800" : "border-gray-200 text-gray-400 focus:border-[#1B4D28]"
                                        )}
                                    >
                                        <option value="">Lagos</option>
                                        {NG_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </Field>

                                <Field label="Phone No" error={fTch.phone ? fErr.phone : undefined}>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            placeholder="08181 171 23"
                                            value={farmer.phone}
                                            onChange={e => { setFarmer(p => ({ ...p, phone: e.target.value })); if (fTch.phone) setFarmerErrors(validateFarmer({ ...farmer, phone: e.target.value })); }}
                                            onBlur={() => touchFarmer("phone")}
                                            className={cn(inputCls(!!(fTch.phone && fErr.phone), !!farmer.phone), "pr-10")}
                                            autoComplete="tel"
                                        />
                                        <Phone size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </Field>
                            </div>

                            <Field label="Email" error={fTch.email ? fErr.email : undefined}>
                                <div className="relative">
                                    <input
                                        type="email"
                                        placeholder="johndoe@gmail.com"
                                        value={farmer.email}
                                        onChange={e => { setFarmer(p => ({ ...p, email: e.target.value })); if (fTch.email) setFarmerErrors(validateFarmer({ ...farmer, email: e.target.value })); }}
                                        onBlur={() => touchFarmer("email")}
                                        className={cn(inputCls(!!(fTch.email && fErr.email), !!farmer.email), "pr-10")}
                                        autoComplete="email"
                                    />
                                    <Mail size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </Field>
                        </>
                    )}

                    {/* ── SHARED: Password ── */}
                    <Field
                        label="Password"
                        error={tab === "buyer" ? (bTch.password ? bErr.password : undefined) : (fTch.password ? fErr.password : undefined)}
                    >
                        <div className="relative">
                            <input
                                type={showPw ? "text" : "password"}
                                placeholder="••••••••••"
                                value={currentPw}
                                onChange={e => {
                                    const v = e.target.value;
                                    if (tab === "buyer") { setBuyer(p => ({ ...p, password: v })); if (bTch.password) setBuyerErrors(validateBuyer({ ...buyer, password: v })); }
                                    else { setFarmer(p => ({ ...p, password: v })); if (fTch.password) setFarmerErrors(validateFarmer({ ...farmer, password: v })); }
                                }}
                                onBlur={() => tab === "buyer" ? touchBuyer("password") : touchFarmer("password")}
                                className={sharedPwInputCls}
                                autoComplete="new-password"
                            />
                            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        {/* Password strength checklist */}
                        {currentPw && (
                            <div className="mt-2 space-y-1 px-1">
                                {PW_RULES.map(rule => {
                                    const passed = rule.test(currentPw);
                                    return (
                                        <div key={rule.label} className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0",
                                                passed ? "bg-[#1B4D28]" : "bg-gray-200"
                                            )}>
                                                {passed && <Check size={8} className="text-white" strokeWidth={3} />}
                                            </div>
                                            <span className={cn("text-[11px]", passed ? "text-[#1B4D28]" : "text-gray-400")}>
                                                {rule.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Field>

                    {/* ── SHARED: Confirm Password ── */}
                    <Field
                        label="Confirm Password"
                        error={tab === "buyer" ? (bTch.confirmPassword ? bErr.confirmPassword : undefined) : (fTch.confirmPassword ? fErr.confirmPassword : undefined)}
                    >
                        <div className="relative">
                            <input
                                type={showConfirmPw ? "text" : "password"}
                                placeholder="••••••••••"
                                value={tab === "buyer" ? buyer.confirmPassword : farmer.confirmPassword}
                                onChange={e => {
                                    const v = e.target.value;
                                    if (tab === "buyer") { setBuyer(p => ({ ...p, confirmPassword: v })); if (bTch.confirmPassword) setBuyerErrors(validateBuyer({ ...buyer, confirmPassword: v })); }
                                    else { setFarmer(p => ({ ...p, confirmPassword: v })); if (fTch.confirmPassword) setFarmerErrors(validateFarmer({ ...farmer, confirmPassword: v })); }
                                }}
                                onBlur={() => tab === "buyer" ? touchBuyer("confirmPassword") : touchFarmer("confirmPassword")}
                                className={sharedConfirmCls}
                                autoComplete="new-password"
                            />
                            <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </Field>

                    {/* Submit */}
                    <div className="pt-1">
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
                            {isLoading ? <><Spinner /> Signing Up…</> : "Sign Up"}
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <p className="text-center text-xs text-gray-500 mt-6">
                    You already have an account?{" "}
                    <Link href="/login" className="font-bold text-[#343A40] hover:underline">Sign In</Link>
                </p>

            </div>
        </div>
    );
}
