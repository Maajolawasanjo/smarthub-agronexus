"use client";

import { useState, useEffect, useRef } from "react";
import {
    X, CreditCard, Wallet, CircleDollarSign, ShieldCheck,
    Eye, EyeOff, Check, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

function Confetti() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const COLORS = ["#1B4D28", "#FFB800", "#4CAF50", "#ffffff", "#a8e6cf", "#ff6b6b", "#ffd93d"];
        const PARTICLE_COUNT = 120;

        type Particle = {
            x: number; y: number;
            vx: number; vy: number;
            color: string;
            size: number;
            rotation: number;
            rotSpeed: number;
            shape: "rect" | "circle" | "ribbon";
            alpha: number;
        };

        const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
            x: canvas.width / 2 + (Math.random() - 0.5) * 100,
            y: canvas.height * 0.35,
            vx: (Math.random() - 0.5) * 12,
            vy: -(Math.random() * 10 + 4),
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            size: Math.random() * 8 + 4,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.2,
            shape: (["rect", "circle", "ribbon"] as const)[Math.floor(Math.random() * 3)],
            alpha: 1,
        }));

        let animId: number;
        const gravity = 0.35;
        const drag = 0.99;

        function draw() {
            ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
            let alive = false;

            for (const p of particles) {
                p.vy += gravity;
                p.vx *= drag;
                p.x += p.vx;
                p.y += p.vy;
                p.rotation += p.rotSpeed;
                if (p.y < canvas!.height + 20) {
                    p.alpha = Math.max(0, p.alpha - 0.008);
                    alive = true;
                } else {
                    p.alpha = 0;
                }

                ctx!.save();
                ctx!.globalAlpha = p.alpha;
                ctx!.translate(p.x, p.y);
                ctx!.rotate(p.rotation);
                ctx!.fillStyle = p.color;

                if (p.shape === "circle") {
                    ctx!.beginPath();
                    ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                    ctx!.fill();
                } else if (p.shape === "ribbon") {
                    ctx!.fillRect(-p.size / 2, -p.size / 5, p.size, p.size / 2.5);
                } else {
                    ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                }

                ctx!.restore();
            }

            if (alive) {
                animId = requestAnimationFrame(draw);
            }
        }

        animId = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animId);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
        />
    );
}

type CardType = "visa" | "mastercard" | "amex" | "discover" | "verve" | "unknown";

interface CardInfo {
    type: CardType;
    label: string;
    maxLength: number;   // raw digits
    cvvLength: number;
    color: string;
    icon: React.ReactNode;
}

const CARD_TYPES: Record<CardType, CardInfo> = {
    visa: {
        type: "visa",
        label: "Visa",
        maxLength: 16,
        cvvLength: 3,
        color: "#1A1F71",
        icon: (
            <svg viewBox="0 0 38 24" width="38" height="24" xmlns="http://www.w3.org/2000/svg">
                <rect width="38" height="24" rx="3" fill="#1A1F71" />
                <text x="50%" y="62%" textAnchor="middle" fill="white" fontWeight="bold" fontSize="11" fontFamily="Arial">VISA</text>
            </svg>
        ),
    },
    mastercard: {
        type: "mastercard",
        label: "Mastercard",
        maxLength: 16,
        cvvLength: 3,
        color: "#EB001B",
        icon: (
            <svg viewBox="0 0 38 24" width="38" height="24" xmlns="http://www.w3.org/2000/svg">
                <rect width="38" height="24" rx="3" fill="#252525" />
                <circle cx="14" cy="12" r="7" fill="#EB001B" />
                <circle cx="24" cy="12" r="7" fill="#F79E1B" />
                <path d="M19 7.7a7 7 0 0 1 0 8.6A7 7 0 0 1 19 7.7z" fill="#FF5F00" />
            </svg>
        ),
    },
    amex: {
        type: "amex",
        label: "Amex",
        maxLength: 15,
        cvvLength: 4,
        color: "#007BC1",
        icon: (
            <svg viewBox="0 0 38 24" width="38" height="24" xmlns="http://www.w3.org/2000/svg">
                <rect width="38" height="24" rx="3" fill="#007BC1" />
                <text x="50%" y="62%" textAnchor="middle" fill="white" fontWeight="bold" fontSize="8" fontFamily="Arial">AMEX</text>
            </svg>
        ),
    },
    discover: {
        type: "discover",
        label: "Discover",
        maxLength: 16,
        cvvLength: 3,
        color: "#FF6600",
        icon: (
            <svg viewBox="0 0 38 24" width="38" height="24" xmlns="http://www.w3.org/2000/svg">
                <rect width="38" height="24" rx="3" fill="#FFFFFF" stroke="#E0E0E0" strokeWidth="1" />
                <circle cx="26" cy="12" r="8" fill="#FF6600" />
                <text x="9" y="15" fill="#231F20" fontWeight="bold" fontSize="7" fontFamily="Arial">DISC</text>
            </svg>
        ),
    },
    verve: {
        type: "verve",
        label: "Verve",
        maxLength: 19,
        cvvLength: 3,
        color: "#00893C",
        icon: (
            <svg viewBox="0 0 38 24" width="38" height="24" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="verveGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#00893C" />
                        <stop offset="100%" stopColor="#005f2a" />
                    </linearGradient>
                </defs>
                <rect width="38" height="24" rx="3" fill="url(#verveGrad)" />
                <polyline points="8,8 13,17 18,8" fill="none" stroke="white" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
                <text x="22" y="16" fill="white" fontWeight="bold" fontSize="7.5" fontFamily="Arial">VERVE</text>
            </svg>
        ),
    },
    unknown: {
        type: "unknown",
        label: "Card",
        maxLength: 16,
        cvvLength: 3,
        color: "#9CA3AF",
        icon: <CreditCard size={20} className="text-gray-400" />,
    },
};

function detectCardType(num: string): CardType {
    const n = num.replace(/\s/g, "");
    if (/^(5061|6500|6220|504834|507865|506099|507860|650[0-9])/.test(n)) return "verve";
    if (/^4/.test(n)) return "visa";
    if (/^5[1-5]/.test(n) || /^2(2[2-9][1-9]|[3-6]\d{2}|7[01]\d|720)/.test(n)) return "mastercard";
    if (/^3[47]/.test(n)) return "amex";
    if (/^6(011|22(1(2[6-9]|[3-9]\d)|[2-8]\d{2}|9([01]\d|2[0-5]))|4[4-9]\d|5\d{2})/.test(n) || /^65/.test(n)) return "discover";
    return "unknown";
}

function formatCardNumber(raw: string, type: CardType): string {
    const digits = raw.replace(/\D/g, "");
    if (type === "amex") {
        const p1 = digits.slice(0, 4);
        const p2 = digits.slice(4, 10);
        const p3 = digits.slice(10, 15);
        return [p1, p2, p3].filter(Boolean).join(" ");
    }
    return digits.match(/.{1,4}/g)?.join(" ") ?? "";
}

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    total: number;
}

type PaymentMethod = "card" | "wallet" | "others";

interface CardForm {
    name: string;
    number: string;
    expiry: string;
    cvv: string;
}

interface CardErrors {
    name?: string;
    number?: string;
    expiry?: string;
    cvv?: string;
}

function FieldWrapper({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 ml-1">{label}</label>
            {children}
            {error && (
                <div className="flex items-center gap-1 ml-1 mt-1">
                    <AlertCircle size={11} className="text-red-500 shrink-0" />
                    <p className="text-[11px] text-red-500">{error}</p>
                </div>
            )}
        </div>
    );
}

function getInputClass(
    field: keyof CardForm,
    touched: Partial<Record<keyof CardForm, boolean>>,
    errors: CardErrors,
    value: string
) {
    const hasError = touched[field] && errors[field];
    const hasValue = value.trim().length > 0;
    return cn(
        "w-full px-4 py-3.5 bg-gray-50 border-2 rounded-2xl text-sm text-gray-900 focus:outline-none transition-all shadow-sm disabled:opacity-60",
        "placeholder:text-gray-400/80",
        hasError
            ? "border-red-300 bg-red-50/30 focus:border-red-400"
            : hasValue
                ? "border-[#1B4D28] bg-white"
                : "border-gray-200 focus:border-[#1B4D28] focus:bg-white"
    );
}

function validateName(v: string): string {
    if (!v.trim()) return "Cardholder name is required";
    if (!/^[a-zA-Z\s'-]+$/.test(v)) return "Name must contain only letters";
    if (v.trim().length < 2) return "Name is too short";
    return "";
}

function validateNumber(raw: string, type: CardType) {
    const digits = raw.replace(/\s/g, "");
    const info = CARD_TYPES[type];
    if (!digits) return "Card number is required";
    if (!/^\d+$/.test(digits)) return "Card number must contain only digits";
    if (digits.length < info.maxLength) return `${info.label} card number must be ${info.maxLength} digits`;
    return "";
}

function validateExpiry(v: string) {
    if (!v) return "Expiry date is required";
    if (!/^\d{2}\/\d{2}$/.test(v)) return "Use MM/YY format";
    const [mm] = v.split("/").map(Number);
    // Only validate month range — no past-date check so testers can use any card
    if (mm < 1 || mm > 12) return "Invalid month (01\u201312)";
    return "";
}

function validateCvv(v: string, type: CardType) {
    const info = CARD_TYPES[type];
    if (!v) return "CVV is required";
    if (!/^\d+$/.test(v)) return "CVV must be digits only";
    if (v.length < info.cvvLength) return `CVV must be ${info.cvvLength} digits for ${info.label}`;
    return "";
}

export function PaymentModal({ isOpen, onClose, total }: PaymentModalProps) {
    const { clearCart } = useCart();
    const [method, setMethod] = useState<PaymentMethod>("card");
    const [showCvv, setShowCvv] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Card form state
    const [card, setCard] = useState<CardForm>({ name: "", number: "", expiry: "", cvv: "" });
    const [errors, setErrors] = useState<CardErrors>({});
    const [touched, setTouched] = useState<Partial<Record<keyof CardForm, boolean>>>({});

    const detectedType = detectCardType(card.number);
    const cardInfo = CARD_TYPES[detectedType];

    if (!isOpen) return null;

    const getErrors = (): CardErrors => ({
        name: validateName(card.name),
        number: validateNumber(card.number, detectedType),
        expiry: validateExpiry(card.expiry),
        cvv: validateCvv(card.cvv, detectedType),
    });

    const isCardValid = () => {
        const e = getErrors();
        return !e.name && !e.number && !e.expiry && !e.cvv;
    };

    const handleBlur = (field: keyof CardForm): void => {
        setTouched(prev => ({ ...prev, [field]: true }));
        setErrors(getErrors());
    };

    const handleCardNumber = (raw: string): void => {
        const digits = raw.replace(/\D/g, "");
        const type = detectCardType(digits);
        const max = CARD_TYPES[type].maxLength;
        const clamped = digits.slice(0, max);
        const formatted = formatCardNumber(clamped, type);
        setCard(prev => ({ ...prev, number: formatted }));
        if (touched.number) setErrors(prev => ({ ...prev, number: validateNumber(formatted, type) }));
    };

    const handleExpiry = (raw: string): void => {
        let digits = raw.replace(/\D/g, "").slice(0, 4);
        let formatted = digits;
        if (digits.length > 2) {
            let mm = digits.slice(0, 2);
            if (Number(mm) > 12) mm = "12";
            if (mm === "00") mm = "01";
            formatted = mm + "/" + digits.slice(2);
        }
        setCard(prev => ({ ...prev, expiry: formatted }));
        if (touched.expiry) setErrors(prev => ({ ...prev, expiry: validateExpiry(formatted) }));
    };

    const handleCvv = (raw: string) => {
        const digits = raw.replace(/\D/g, "").slice(0, cardInfo.cvvLength);
        setCard(prev => ({ ...prev, cvv: digits }));
        if (touched.cvv) setErrors(prev => ({ ...prev, cvv: validateCvv(digits, detectedType) }));
    };

    const handleName = (v: string) => {
        setCard(prev => ({ ...prev, name: v }));
        if (touched.name) setErrors(prev => ({ ...prev, name: validateName(v) }));
    };

    const handleSubmit = async (): Promise<void> => {
        if (method === "card") {
            setTouched({ name: true, number: true, expiry: true, cvv: true });
            const e = getErrors();
            setErrors(e);
            if (!isCardValid()) return;
        }
        if (method === "wallet" && !selectedWallet) return;

        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSubmitting(false);
        setIsSuccess(true);
        clearCart();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={!isSubmitting ? onClose : undefined}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-[560px] bg-white rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 flex flex-col max-h-[90vh]">

                {isSuccess ? (
                    /* ── Success View ── */
                    <div className="relative flex-1 flex flex-col items-center justify-center p-10 text-center animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
                        <Confetti />
                        <div className="relative z-10 w-20 h-20 bg-[#e6f4ea] rounded-full flex items-center justify-center mb-6 shadow-lg">
                            <div className="w-12 h-12 bg-[#1B4D28] rounded-full flex items-center justify-center text-white">
                                <Check size={28} strokeWidth={3} />
                            </div>
                        </div>
                        <h2 className="relative z-10 text-2xl font-bold text-gray-900 mb-3">Payment Successful! 🎉</h2>
                        <p className="relative z-10 text-gray-500 text-sm max-w-[260px] leading-relaxed mb-10">
                            Your order has been confirmed and payment processed securely through Smarthub Agrochain.
                        </p>
                        <button
                            onClick={onClose}
                            className="relative z-10 w-full bg-[#1B4D28] hover:bg-[#153b1e] text-white py-4 rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-green-900/20"
                        >
                            Back to Platform
                        </button>
                    </div>
                ) : (
                    /* ── Payment View ── */
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-end p-5 pb-0 shrink-0">
                            <button
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="px-7 pb-8 overflow-y-auto">
                            <h2 className="text-center text-lg font-semibold text-gray-800 mb-6">Choose a payment method</h2>

                            {/* Method Selector */}
                            <div className="grid grid-cols-3 gap-3 mb-8">
                                {(["card", "wallet", "others"] as PaymentMethod[]).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setMethod(m)}
                                        disabled={isSubmitting}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-2.5 p-3.5 rounded-2xl border-2 transition-all group disabled:opacity-50",
                                            method === m ? "border-[#1B4D28] bg-green-50/30" : "border-gray-100 bg-white hover:border-gray-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                                            m === "card" && method === "card" ? "bg-[#1B4D28] text-white" :
                                                m === "wallet" && method === "wallet" ? "bg-[#FFB800] text-white" :
                                                    m === "others" && method === "others" ? "bg-black text-white" :
                                                        "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                                        )}>
                                            {m === "card" && <CreditCard size={18} />}
                                            {m === "wallet" && <Wallet size={18} />}
                                            {m === "others" && <CircleDollarSign size={18} />}
                                        </div>
                                        <span className={cn(
                                            "text-[11px] font-bold transition-colors",
                                            method === m ? "text-gray-900" : "text-gray-400"
                                        )}>
                                            {m === "card" ? "Credit Card" : m === "wallet" ? "Connect Wallet" : "Others"}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* ── Card Form ── */}
                            {method === "card" && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">

                                    {/* Detected Card Type Badge */}
                                    <div className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all",
                                        detectedType !== "unknown"
                                            ? "border-[#1B4D28]/20 bg-green-50/40"
                                            : "border-gray-100 bg-gray-50/60"
                                    )}>
                                        <div className="shrink-0">{cardInfo.icon}</div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-700">
                                                {detectedType !== "unknown" ? `${cardInfo.label} detected` : "Enter card number to detect type"}
                                            </p>
                                            <p className="text-[10px] text-gray-400">
                                                {detectedType !== "unknown"
                                                    ? `${cardInfo.maxLength} digits · CVV: ${cardInfo.cvvLength} digits`
                                                    : "Supports Visa, Mastercard, Amex, Discover"}
                                            </p>
                                        </div>
                                        {detectedType !== "unknown" && (
                                            <div className="ml-auto w-5 h-5 rounded-full bg-[#1B4D28] flex items-center justify-center">
                                                <Check size={11} className="text-white" strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Cardholder Name */}
                                    <FieldWrapper label="Cardholder Name" error={touched.name ? errors.name : undefined}>
                                        <input
                                            type="text"
                                            placeholder="John Doe"
                                            value={card.name}
                                            onChange={e => handleName(e.target.value)}
                                            onBlur={() => handleBlur("name")}
                                            disabled={isSubmitting}
                                            autoComplete="cc-name"
                                            className={getInputClass("name", touched, errors, card.name)}
                                        />
                                    </FieldWrapper>

                                    {/* Card Number */}
                                    <FieldWrapper label="Card Number" error={touched.number ? errors.number : undefined}>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder={detectedType === "amex" ? "3782 822463 10005" : "4111 1111 1111 1111"}
                                                value={card.number}
                                                onChange={e => handleCardNumber(e.target.value)}
                                                onBlur={() => handleBlur("number")}
                                                disabled={isSubmitting}
                                                autoComplete="cc-number"
                                                maxLength={detectedType === "amex" ? 17 : 19}
                                                className={cn(getInputClass("number", touched, errors, card.number), "pr-14 font-mono tracking-widest")}
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                {cardInfo.icon}
                                            </div>
                                        </div>
                                    </FieldWrapper>

                                    {/* Expiry + CVV row */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <FieldWrapper label="Expiry Date" error={touched.expiry ? errors.expiry : undefined}>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="MM/YY"
                                                value={card.expiry}
                                                onChange={e => handleExpiry(e.target.value)}
                                                onBlur={() => handleBlur("expiry")}
                                                disabled={isSubmitting}
                                                autoComplete="cc-exp"
                                                maxLength={5}
                                                className={getInputClass("expiry", touched, errors, card.expiry)}
                                            />
                                        </FieldWrapper>

                                        <FieldWrapper
                                            label={`CVV (${cardInfo.cvvLength} digits)`}
                                            error={touched.cvv ? errors.cvv : undefined}
                                        >
                                            <div className="relative">
                                                <input
                                                    type={showCvv ? "text" : "password"}
                                                    inputMode="numeric"
                                                    placeholder={"•".repeat(cardInfo.cvvLength)}
                                                    value={card.cvv}
                                                    onChange={e => handleCvv(e.target.value)}
                                                    onBlur={() => handleBlur("cvv")}
                                                    disabled={isSubmitting}
                                                    autoComplete="cc-csc"
                                                    maxLength={cardInfo.cvvLength}
                                                    className={cn(getInputClass("cvv", touched, errors, card.cvv), "pr-10 font-mono tracking-widest")}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCvv(!showCvv)}
                                                    disabled={isSubmitting}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    {showCvv ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </FieldWrapper>
                                    </div>

                                    {/* CVV hint for Amex */}
                                    {detectedType === "amex" && (
                                        <p className="text-[11px] text-amber-600 bg-amber-50 rounded-xl px-3 py-2 border border-amber-100">
                                            ℹ️ American Express uses a <strong>4-digit CVV</strong> printed on the <strong>front</strong> of the card.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* ── Wallet Method ── */}
                            {method === "wallet" && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <h3 className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Select Wallet</h3>
                                    {[
                                        { name: "Metamask", color: "#F6851B", desc: "Browser extension & mobile" },
                                        { name: "Phantom", color: "#AB9FF2", desc: "Solana & multi-chain" },
                                        { name: "Trust Wallet", color: "#3375BB", desc: "Mobile & Web3" },
                                        { name: "Coinbase Wallet", color: "#0052FF", desc: "Easy crypto access" },
                                    ].map((wallet) => (
                                        <button
                                            key={wallet.name}
                                            onClick={() => setSelectedWallet(wallet.name)}
                                            disabled={isSubmitting}
                                            className={cn(
                                                "flex items-center justify-between w-full p-4 bg-white border rounded-2xl transition-all group disabled:opacity-60",
                                                selectedWallet === wallet.name
                                                    ? "border-[#1B4D28] bg-green-50/20"
                                                    : "border-gray-100 hover:border-gray-200"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-9 h-9 rounded-full flex items-center justify-center"
                                                    style={{ backgroundColor: wallet.color + "22" }}
                                                >
                                                    <div className="w-5 h-5 rounded-full" style={{ backgroundColor: wallet.color }} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-semibold text-gray-800">{wallet.name}</p>
                                                    <p className="text-[10px] text-gray-400">{wallet.desc}</p>
                                                </div>
                                            </div>
                                            {selectedWallet === wallet.name && (
                                                <div className="w-5 h-5 rounded-full bg-[#1B4D28] flex items-center justify-center text-white">
                                                    <ShieldCheck size={12} />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* ── Others Method ── */}
                            {method === "others" && (
                                <div className="py-10 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                                        <CircleDollarSign className="text-gray-300" size={32} />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-800 mb-1">Other Payment Methods</h3>
                                    <p className="text-xs text-gray-400">Bank Transfer, PayPal, and more coming soon.</p>
                                </div>
                            )}

                            {/* ── Submit ── */}
                            <div className="mt-7 space-y-3">
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || (method === "wallet" && !selectedWallet)}
                                    className="w-full bg-[#1B4D28] hover:bg-[#153b1e] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-green-900/10 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span className="text-base">$ {total.toLocaleString()}</span>
                                            <span className="text-[16px]">Pay Now</span>
                                        </>
                                    )}
                                </button>

                                <div className="flex items-center justify-center gap-2 pt-1">
                                    <ShieldCheck size={16} className="text-[#1B4D28]" />
                                    <div className="text-left">
                                        <p className="text-[10px] font-bold text-gray-700">256-bit SSL Encrypted · Secure payment</p>
                                        <p className="text-[10px] text-gray-400">Protected by Smarthub Agrochain</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
