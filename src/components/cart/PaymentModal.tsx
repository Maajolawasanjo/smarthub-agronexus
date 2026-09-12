"use client";

import { useState, useEffect, useRef } from "react";
import {
    X, CreditCard, Wallet, ShieldCheck,
    Eye, EyeOff, Check, AlertCircle, Zap, ArrowRight, RefreshCw, Lock, MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";
import { useLocalization } from "@/hooks/useLocalization";

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

export type PaymentMethod = "card" | "flutterwave" | "wallet";

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
    if (mm < 1 || mm > 12) return "Invalid month (01–12)";
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
    // ── ALL REACT HOOKS DECLARED UNCONDITIONALLY AT TOP LEVEL ──
    const { clearCart } = useCart();
    const { formatCurrency } = useLocalization();
    const [method, setMethod] = useState<PaymentMethod>("wallet");
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [submitError, setSubmitError] = useState<string | null>(null);
    const [orderNumber, setOrderNumber] = useState<string>("");

    // Live Wallet Balance State
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [isFetchingWallet, setIsFetchingWallet] = useState<boolean>(false);

    // Live Saved Addresses State from PostgreSQL
    const [addresses, setAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string>("");

    // Dynamic Shipping Calculation State (BUY-07)
    const [shippingQuote, setShippingQuote] = useState<{
        destinationState: string;
        baseRate: number;
        weightSurcharge: number;
        totalShippingFee: number;
        estimatedDeliveryTime: string;
    } | null>(null);
    const [isCalculatingShipping, setIsCalculatingShipping] = useState<boolean>(false);

    // Fetch user's live wallet balance and saved addresses whenever modal opens
    useEffect(() => {
        if (isOpen) {
            setIsFetchingWallet(true);
            fetch("/api/wallet")
                .then(res => res.json())
                .then(data => {
                    const balance =
                        data?.data?.balances?.availableBalance ??
                        data?.availableBalance ??
                        0;
                    setWalletBalance(Number(balance));
                })
                .catch(() => setWalletBalance(0))
                .finally(() => setIsFetchingWallet(false));

            fetch("/api/user/addresses")
                .then(res => res.json())
                .then(data => {
                    const addrList = data?.data?.addresses || data?.addresses || [];
                    setAddresses(addrList);
                    const defaultAddr = addrList.find((a: any) => a.isDefault) || addrList[0];
                    if (defaultAddr) {
                        setSelectedAddressId(defaultAddr.id);
                    }
                })
                .catch((err) => console.error("Could not fetch delivery addresses:", err));
        }
    }, [isOpen]);

    // Recalculate shipping whenever selected address changes
    useEffect(() => {
        if (!selectedAddressId || addresses.length === 0) {
            setShippingQuote(null);
            return;
        }

        const selectedAddr = addresses.find((a: any) => a.id === selectedAddressId);
        if (selectedAddr?.state) {
            setIsCalculatingShipping(true);
            fetch("/api/shipping/calculate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    destinationState: selectedAddr.state,
                    weightKg: 5,
                    deliverySpeed: "STANDARD",
                }),
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data?.success && data?.data) {
                        setShippingQuote(data.data);
                    }
                })
                .catch((err) => console.error("Failed to compute shipping quote:", err))
                .finally(() => setIsCalculatingShipping(false));
        }
    }, [selectedAddressId, addresses]);

    // Unconditional Early Return ONLY AFTER all Hooks are defined
    if (!isOpen) return null;

    const isWalletSufficient = walletBalance !== null && walletBalance >= total;
    const walletShortfall = walletBalance !== null ? Math.max(0, total - walletBalance) : 0;

    const handleSubmit = async (): Promise<void> => {
        if (method === "wallet") {
            if (walletBalance !== null && walletBalance < total) {
                setSubmitError(
                    `Insufficient AgroChain Wallet balance. Available: ${formatCurrency(walletBalance)}, Required: ${formatCurrency(total)}. Shortfall: ${formatCurrency(walletShortfall)}.`
                );
                return;
            }
        }

        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const cartItems = JSON.parse(localStorage.getItem("smarthub_cart") || "[]");
            const orderItems = cartItems.map((item: any) => ({
                productId: item && item.id ? String(item.id).trim() : undefined,
                quantity: Number(item.quantity) || 1,
            })).filter((i: any) => i.productId && i.productId !== "NaN" && i.productId !== "null");

            if (orderItems.length === 0) {
                setSubmitError("No valid products in cart. Please re-add items from the marketplace.");
                setIsSubmitting(false);
                return;
            }

            const selectedAddress = addresses.find((a: any) => a.id === selectedAddressId);
            const formattedShippingAddress = selectedAddress
                ? `${selectedAddress.label ? `[${selectedAddress.label}] ` : ""}${selectedAddress.addressLine}, ${selectedAddress.city ? selectedAddress.city + ", " : ""}${selectedAddress.lga}, ${selectedAddress.state} (Recipient: ${selectedAddress.recipientName}, ${selectedAddress.phoneNumber})`
                : "Lagos Port Terminal, Nigeria";

            // Handle Hosted Payment Gateway (Make Payment)
            if (method === "flutterwave" || method === "card") {
                const flwRes = await fetch("/api/payments/flutterwave/initialize", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        items: orderItems,
                        totalAmount: total,
                        shippingAddress: formattedShippingAddress,
                        shippingAddressId: selectedAddressId || undefined,
                    }),
                });

                const flwData = await flwRes.json();
                if (flwRes.ok && flwData.link) {
                    window.location.href = flwData.link;
                    return;
                } else {
                    setSubmitError(flwData.error || "Failed to launch payment checkout session.");
                    setIsSubmitting(false);
                    return;
                }
            }

            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: orderItems,
                    shippingAddress: formattedShippingAddress,
                    shippingAddressId: selectedAddressId || undefined,
                    incoterm: "FOB",
                    paymentMethod: "WALLET",
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setSubmitError(data.error || "Order placement failed. Please try again.");
                setIsSubmitting(false);
                return;
            }

            setOrderNumber(data.order?.orderNumber || "");
            setIsSubmitting(false);
            setIsSuccess(true);
            clearCart();
        } catch (err) {
            setSubmitError("Network error. Please check your connection and try again.");
            setIsSubmitting(false);
        }
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
                        <p className="relative z-10 text-gray-500 text-sm max-w-[280px] leading-relaxed mb-6">
                            Your order has been confirmed and payment processed securely through Smarthub Agrochain.
                        </p>
                        {orderNumber && (
                            <div className="relative z-10 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 mb-10 inline-flex items-center gap-2">
                                <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Order No</span>
                                <span className="text-sm font-bold text-[#1B4D28]">{orderNumber}</span>
                            </div>
                        )}
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
                        <div className="flex items-center justify-between p-6 pb-2 shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Complete Payment</h2>
                                <p className="text-xs text-gray-400">Total payable: <span className="font-bold text-[#1B4D28]">₦{total.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span></p>
                            </div>
                            <button
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 disabled:opacity-50 cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="px-6 pb-8 overflow-y-auto pt-4">

                            {/* Delivery Destination Selector */}
                            <div className="mb-5 p-3.5 bg-gray-50 border border-gray-200 rounded-2xl">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                                        <MapPin size={14} className="text-[#1B4D28]" />
                                        <span>Delivery Destination</span>
                                    </div>
                                    <span className="text-[11px] text-gray-400 font-medium">
                                        {addresses.length} saved {addresses.length === 1 ? "address" : "addresses"}
                                    </span>
                                </div>
                                {addresses.length > 0 ? (
                                    <div className="space-y-2">
                                        <select
                                            value={selectedAddressId}
                                            onChange={(e) => setSelectedAddressId(e.target.value)}
                                            className="w-full text-xs font-semibold bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#1B4D28] cursor-pointer"
                                        >
                                            {addresses.map((addr) => (
                                                <option key={addr.id} value={addr.id}>
                                                    {addr.label ? `${addr.label} — ` : ""}{addr.addressLine}, {addr.city ? `${addr.city}, ` : ""}{addr.state} ({addr.recipientName})
                                                </option>
                                            ))}
                                        </select>
                                        {selectedAddressId && (() => {
                                            const currentAddr = addresses.find(a => a.id === selectedAddressId);
                                            return currentAddr ? (
                                                <div className="bg-white/80 p-2.5 rounded-xl border border-gray-200/80 space-y-1 text-[11px]">
                                                    <p className="text-gray-700 font-semibold truncate">
                                                        Recipient: <span className="font-normal text-gray-600">{currentAddr.recipientName} ({currentAddr.phoneNumber})</span>
                                                    </p>
                                                    <p className="text-gray-500 truncate">
                                                        {currentAddr.addressLine}, {currentAddr.city ? `${currentAddr.city}, ` : ""}{currentAddr.lga}, {currentAddr.state}
                                                    </p>
                                                    {isCalculatingShipping ? (
                                                        <div className="pt-1 text-[11px] text-gray-400 italic">Calculating state logistics quote…</div>
                                                    ) : shippingQuote ? (
                                                        <div className="pt-1 mt-1 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-[#1B4D28]">
                                                            <span>Logistics Rate: ₦{shippingQuote.totalShippingFee.toLocaleString("en-NG")}</span>
                                                            <span className="text-gray-400 font-normal">ETA: {shippingQuote.estimatedDeliveryTime}</span>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ) : null;
                                        })()}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500 italic">
                                        Default destination: Lagos Port Terminal, Nigeria
                                    </p>
                                )}
                            </div>

                            {/* Method Selector */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {[
                                    { id: "wallet", label: "Pay from Balance", icon: <Wallet size={18} />, color: "bg-[#1B4D28]" },
                                    { id: "flutterwave", label: "Make Payment", icon: <CreditCard size={18} />, color: "bg-[#F5A623]" },
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => {
                                            setMethod(m.id as PaymentMethod);
                                            setSubmitError(null);
                                        }}
                                        disabled={isSubmitting}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border-2 transition-all group disabled:opacity-50 cursor-pointer",
                                            method === m.id
                                                ? "border-[#1B4D28] bg-green-50/40 shadow-sm"
                                                : "border-gray-100 bg-white hover:border-gray-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-9 h-9 rounded-full flex items-center justify-center transition-colors text-white",
                                            method === m.id ? m.color : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                                        )}>
                                            {m.icon}
                                        </div>
                                        <span className={cn(
                                            "text-[11px] font-bold transition-colors",
                                            method === m.id ? "text-gray-900" : "text-gray-500"
                                        )}>
                                            {m.label}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* ── 1. Make Payment View ── */}
                            {(method === "flutterwave" || method === "card") && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="p-5 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-green-500/10 border-2 border-green-500/30 rounded-3xl text-center">
                                        <div className="w-14 h-14 bg-gradient-to-tr from-[#1B4D28] to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg mx-auto mb-3">
                                            <CreditCard size={28} />
                                        </div>
                                        <h3 className="text-base font-bold text-gray-900 mb-1">Make Payment</h3>
                                        <p className="text-xs text-gray-500 max-w-[320px] mx-auto leading-relaxed mb-4">
                                            Proceed to complete your order payment securely via SmartHub payment portal.
                                        </p>
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100/60 rounded-full border border-green-200 text-[#1B4D28] text-xs font-semibold">
                                            <ShieldCheck size={14} className="text-[#1B4D28]" />
                                            <span>256-Bit SSL Encrypted Payment</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── 2. SmartHub Agro Wallet View ── */}
                            {method === "wallet" && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="p-5 bg-emerald-900 text-white rounded-3xl shadow-xl relative overflow-hidden">
                                        <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
                                            <Wallet size={160} />
                                        </div>

                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Wallet className="text-emerald-400" size={20} />
                                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">SmartHub Agro Wallet</span>
                                            </div>
                                            {isFetchingWallet && (
                                                <div className="flex items-center gap-1 text-xs text-emerald-300">
                                                    <RefreshCw size={12} className="animate-spin" />
                                                    <span>Syncing balance...</span>
                                                </div>
                                            )}
                                        </div>

                                         <div className="grid grid-cols-2 gap-4 pt-1">
                                            <div>
                                                <p className="text-[11px] text-emerald-300/80 font-medium uppercase tracking-wider">Available Balance</p>
                                                <p className="text-2xl font-extrabold tracking-tight mt-0.5">
                                                    {walletBalance !== null
                                                        ? formatCurrency(walletBalance)
                                                        : formatCurrency(0)}
                                                </p>
                                            </div>

                                            <div className="text-right border-l border-emerald-700/50 pl-4">
                                                <p className="text-[11px] text-emerald-300/80 font-medium uppercase tracking-wider">Order Total</p>
                                                <p className="text-xl font-bold text-emerald-100 mt-0.5">
                                                    {formatCurrency(total)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Balance Status Banners */}
                                    {walletBalance !== null && (
                                        isWalletSufficient ? (
                                            <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-start gap-3 text-green-900">
                                                <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                                                    <Check size={16} strokeWidth={3} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-green-900">Sufficient Wallet Balance Available</p>
                                                    <p className="text-[11px] text-green-700 mt-0.5">
                                                        Your wallet has enough funds. Clicking pay will instantly debit {formatCurrency(total)} into Escrow Protection.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900">
                                                <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-xs font-bold text-amber-900">Insufficient Wallet Balance</p>
                                                    <p className="text-[11px] text-amber-700 mt-0.5">
                                                        You need <strong className="text-amber-900">{formatCurrency(walletShortfall)}</strong> more to complete this purchase using your wallet.
                                                    </p>
                                                    <a
                                                        href="/dashboard/wallet"
                                                        target="_blank"
                                                        className="inline-flex items-center gap-1 text-xs font-bold text-[#1B4D28] hover:underline mt-2"
                                                    >
                                                        <span>Top up wallet in dashboard</span>
                                                        <ArrowRight size={12} />
                                                    </a>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                            {/* Error Banner */}
                            {submitError && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 animate-in fade-in">
                                    <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-xs font-semibold leading-relaxed">{submitError}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || (method === "wallet" && walletBalance !== null && !isWalletSufficient)}
                                className="w-full mt-6 py-4 px-6 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed bg-[#1B4D28] hover:bg-[#153b1e] shadow-green-900/20 cursor-pointer"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Processing Order...</span>
                                    </div>
                                ) : (
                                    <>
                                        <Lock size={16} />
                                        <span>
                                            {method === "wallet"
                                                ? `Pay ${formatCurrency(total)} from Balance`
                                                : `Make Payment (${formatCurrency(total)})`}
                                        </span>
                                    </>
                                )}
                            </button>

                            {/* Trust Badge Footer */}
                            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-gray-400 font-medium">
                                <ShieldCheck size={14} className="text-[#1B4D28]" />
                                <span>Escrow Protection Enabled · SmartHub Agronexus</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
