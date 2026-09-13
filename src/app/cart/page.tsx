"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Trash2, Plus, Minus, ChevronDown, ChevronUp, ShoppingBag, Lock, MapPin, Store } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart, CartItem } from "@/context/CartContext";
import { PaymentModal } from "@/components/cart/PaymentModal";

export default function CartPage() {
    const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();
    const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Group items by Cooperative/Farmer Seller
    const groupedCart = useMemo(() => {
        return cartItems.reduce<Record<string, CartItem[]>>((acc, item) => {
            const sellerKey = item.farmerName || item.brand || (item.location ? `${item.location} Farmers Hub` : "Verified Cooperative Supplier");
            if (!acc[sellerKey]) {
                acc[sellerKey] = [];
            }
            acc[sellerKey].push(item);
            return acc;
        }, {});
    }, [cartItems]);

    const sellerCount = Object.keys(groupedCart).length;

    const handleCheckout = async () => {
        setIsValidating(true);
        setValidationError(null);
        try {
            const invalidItem = cartItems.find(item => 
                !item || 
                item.id === null || 
                item.id === undefined || 
                String(item.id).trim() === "" || 
                String(item.id) === "NaN" || 
                String(item.id) === "null"
            );

            if (invalidItem) {
                setValidationError(`Item "${invalidItem.name || 'Produce'}" has an invalid product reference. Please remove it and add it again from the marketplace.`);
                setIsValidating(false);
                return;
            }

            const belowMoqItem = cartItems.find(item => {
                const minMoq = parseInt(item.moq || "1", 10) || 1;
                return (Number(item.quantity) || 0) < minMoq;
            });

            if (belowMoqItem) {
                setValidationError(`"${belowMoqItem.name}" requires a minimum order quantity of ${belowMoqItem.moq} ${belowMoqItem.unit || 'units'}. Please adjust quantity before checkout.`);
                setIsValidating(false);
                return;
            }

            const itemsPayload = cartItems.map(item => ({
                productId: String(item.id).trim(),
                quantity: Number(item.quantity) || 1
            }));

            const res = await fetch("/api/orders/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: itemsPayload })
            });
            const data = await res.json();
            if (!res.ok || !data.isValid) {
                setValidationError(data.errors?.[0] || data.error || "Some items in your cart are no longer available or out of stock.");
                return;
            }
            setIsPaymentModalOpen(true);
        } catch (error) {
            setValidationError("Network error during validation. Please try again.");
        } finally {
            setIsValidating(false);
        }
    };

    const itemTotal = cartTotal;
    // Standard logistics freight fee per seller dispatch origin (e.g. ₦3,500 per seller)
    const shipping = sellerCount > 0 ? sellerCount * 3500 : 0;
    const total = itemTotal + shipping;

    return (
        <div className="min-h-screen bg-white font-sans">
            {cartItems.length === 0 && !isPaymentModalOpen ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="min-h-[80vh] bg-white flex flex-col items-center justify-center pt-20 pb-32 px-4"
                >
                    <motion.div
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-sm"
                    >
                        <ShoppingBag size={48} className="text-[#1B4D28] opacity-60" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h2>
                    <p className="text-gray-500 mb-8 max-w-md text-center text-sm">
                        You haven't added any agricultural commodities to your cart yet. Explore certified produce from verified Nigerian farmers.
                    </p>
                    <Link href="/dashboard/products">
                        <motion.div
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.96 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                            <span className="px-8 py-3.5 bg-[#1B4D28] hover:bg-[#143d20] text-white font-bold text-sm rounded-full shadow-lg shadow-green-900/20 inline-block transition-colors cursor-pointer">
                                Explore Produce Catalog
                            </span>
                        </motion.div>
                    </Link>
                </motion.div>
            ) : (
                <>
                    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 pb-32">

                        {/* Breadcrumb / Back Navigation */}
                        <motion.div
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 mb-8 text-sm"
                        >
                            <Link href="/dashboard/products" className="text-gray-500 hover:text-gray-900 flex items-center gap-1.5 transition-colors">
                                <ArrowLeft size={16} />
                                Back to Catalog
                            </Link>
                            <span className="text-gray-300">/</span>
                            <span className="text-gray-800 font-bold">Multi-Vendor Cart ({cartItems.length} items)</span>
                        </motion.div>

                        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">

                            {/* Left Column: Grouped by Seller / Cooperative */}
                            <div className="flex-1 flex flex-col gap-8 order-2 lg:order-1">
                                {Object.entries(groupedCart).map(([sellerName, items], groupIndex) => {
                                    const sellerSubtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

                                    return (
                                        <div
                                            key={sellerName}
                                            className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6"
                                        >
                                            {/* Seller Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-green-50 text-[#1B4D28] rounded-xl">
                                                        <Store size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-bold text-gray-900 text-base">{sellerName}</h3>
                                                            <span className="text-[10px] bg-green-50 text-[#1B4D28] font-bold px-2 py-0.5 rounded-full border border-green-100">
                                                                Sub-Order #{groupIndex + 1}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                                                            <MapPin size={12} />
                                                            <span>Origin: {items[0]?.location || "Northern Agricultural Belt"}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-xs font-semibold text-gray-500 sm:text-right">
                                                    Seller Subtotal: <strong className="text-gray-900 font-bold text-sm">₦{sellerSubtotal.toLocaleString()}</strong>
                                                </div>
                                            </div>

                                            {/* Seller's Line Items */}
                                            <div className="divide-y divide-gray-100">
                                                <AnimatePresence mode="popLayout">
                                                    {items.map((item) => (
                                                        <motion.div
                                                            key={item.id}
                                                            layout
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, x: -30 }}
                                                            className="flex flex-col sm:flex-row gap-4 sm:gap-6 py-5 relative group"
                                                        >
                                                            {/* Product Image */}
                                                            <Link
                                                                href={`/dashboard/products/${item.id}`}
                                                                className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-gray-50 rounded-2xl overflow-hidden relative border border-gray-100 block cursor-pointer"
                                                            >
                                                                <Image
                                                                    src={item.image || "/vegetable-container-white.png"}
                                                                    alt={item.name}
                                                                    fill
                                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                                />
                                                            </Link>

                                                            {/* Product Details */}
                                                            <div className="flex-1 flex flex-col justify-between">
                                                                <div className="flex justify-between items-start gap-4">
                                                                    <div>
                                                                        <Link href={`/dashboard/products/${item.id}`}>
                                                                            <h4 className="font-bold text-gray-900 text-sm sm:text-base group-hover:text-[#1B4D28] transition-colors cursor-pointer">
                                                                                {item.name}
                                                                            </h4>
                                                                        </Link>
                                                                        <div className="flex flex-wrap items-center gap-1.5 mt-1 mb-2">
                                                                            <span className="inline-block px-2 py-0.5 bg-green-50 text-[#1B4D28] text-[10px] font-bold rounded-full">
                                                                                In Stock ({item.stock || "Available"})
                                                                            </span>
                                                                            {item.grade && (
                                                                                <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-full">
                                                                                    {item.grade}
                                                                                </span>
                                                                            )}
                                                                            {item.moq && parseInt(item.moq, 10) > 1 && (
                                                                                <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-full">
                                                                                    MOQ: {item.moq} {item.unit || "units"}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="font-bold text-gray-900 text-base sm:text-lg">
                                                                            ₦{item.price.toLocaleString()}{" "}
                                                                            <span className="text-xs font-normal text-gray-500">
                                                                                / {item.unit || "Bag"}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Delete Button */}
                                                                    <button
                                                                        onClick={() => removeFromCart(item.id)}
                                                                        className="flex items-center gap-1 px-2.5 py-1 border border-gray-200 rounded-full text-xs font-medium text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors cursor-pointer"
                                                                        title="Remove item"
                                                                    >
                                                                        <Trash2 size={13} />
                                                                        <span className="hidden sm:inline">Remove</span>
                                                                    </button>
                                                                </div>

                                                                {/* Quantity Controls */}
                                                                <div className="flex items-center justify-between sm:justify-end mt-3 sm:mt-0 w-full sm:w-auto gap-4">
                                                                    <div className="text-xs text-gray-400 font-semibold sm:hidden">
                                                                        Item total: ₦{(item.price * item.quantity).toLocaleString()}
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <button
                                                                            onClick={() => updateQuantity(item.id, -1)}
                                                                            disabled={item.quantity <= (parseInt(item.moq || "1", 10) || 1)}
                                                                            className="w-7 h-7 rounded-full bg-[#1B4D28] text-white flex items-center justify-center hover:bg-[#143d20] transition-colors shadow-sm cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                                            title={item.quantity <= (parseInt(item.moq || "1", 10) || 1) ? `Minimum Order Quantity is ${item.moq || 1}` : "Decrease quantity"}
                                                                            aria-label="Decrease quantity"
                                                                        >
                                                                            <Minus size={14} />
                                                                        </button>

                                                                        <span className="font-bold text-base w-6 text-center text-gray-900">
                                                                            {item.quantity}
                                                                        </span>

                                                                        <button
                                                                            onClick={() => updateQuantity(item.id, 1)}
                                                                            className="w-7 h-7 rounded-full bg-[#1B4D28] text-white flex items-center justify-center hover:bg-[#143d20] transition-colors shadow-sm cursor-pointer"
                                                                            aria-label="Increase quantity"
                                                                        >
                                                                            <Plus size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Right Column: Order Summary */}
                            <div className="w-full lg:w-[400px] xl:w-[440px] shrink-0 order-1 lg:order-2">
                                <div className="bg-[#1B4D28] rounded-3xl p-6 sm:p-8 text-white lg:sticky lg:top-32 shadow-xl border border-[#2C5E39] space-y-6">
                                    <div
                                        className="flex items-center justify-between cursor-pointer lg:cursor-default"
                                        onClick={() => setIsMobileSummaryOpen(!isMobileSummaryOpen)}
                                    >
                                        <div>
                                            <h2 className="text-xl font-bold tracking-wide">Checkout Summary</h2>
                                            <p className="text-xs text-white/70 mt-0.5">
                                                {sellerCount} {sellerCount === 1 ? "Seller Sub-Order" : "Seller Sub-Orders"}
                                            </p>
                                        </div>
                                        <button className="lg:hidden text-white/80 p-1">
                                            {isMobileSummaryOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </button>
                                    </div>

                                    <div className={`transition-all duration-300 space-y-6 ${isMobileSummaryOpen ? 'block' : 'hidden lg:block'}`}>
                                        {/* Per-Item Summary */}
                                        <div className="space-y-3 text-xs max-h-48 overflow-y-auto pr-1">
                                            {cartItems.map((item) => (
                                                <div key={item.id} className="flex justify-between items-center text-white/90">
                                                    <span className="truncate max-w-[200px]">{item.name} × {item.quantity}</span>
                                                    <span className="font-bold text-white whitespace-nowrap">
                                                        ₦{(item.price * item.quantity).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="h-px bg-white/20 w-full" />

                                        {/* Financial Breakdown */}
                                        <div className="space-y-3 text-xs">
                                            <div className="flex justify-between items-center text-white/80">
                                                <span>Commodity Subtotal</span>
                                                <span className="font-bold text-sm text-white">₦{itemTotal.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-white/80">
                                                <span>Logistics Freight ({sellerCount} origin{sellerCount > 1 ? "s" : ""})</span>
                                                <span className="font-bold text-sm text-white">₦{shipping.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-white/80">
                                                <span>Escrow Protection</span>
                                                <span className="font-bold text-xs text-[#4CAF50]">Included (Free)</span>
                                            </div>

                                            <div className="h-px bg-white/20 w-full pt-1" />

                                            <div className="flex justify-between items-center pt-1">
                                                <span className="text-white font-bold text-sm">Estimated Total</span>
                                                <span className="font-extrabold text-xl text-amber-300">
                                                    ₦{total.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Validation Error Banner */}
                                        {validationError && (
                                            <div className="bg-red-50 text-red-600 text-xs font-semibold p-3.5 rounded-xl border border-red-200">
                                                {validationError}
                                            </div>
                                        )}

                                        {/* Proceed Action Button */}
                                        <button
                                            onClick={handleCheckout}
                                            disabled={cartItems.length === 0 || isValidating}
                                            className="w-full bg-gradient-to-r from-[#FFB800] via-[#F59E0B] to-[#D97706] text-gray-950 font-black text-sm text-center py-4 rounded-2xl shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer"
                                        >
                                            {isValidating ? (
                                                <div className="w-5 h-5 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <Lock size={16} className="text-gray-950 shrink-0" />
                                                    <span>Lock Escrow & Checkout (₦{total.toLocaleString()})</span>
                                                </>
                                            )}
                                        </button>

                                        <Link
                                            href="/products"
                                            className="text-center text-white/70 text-xs font-semibold hover:text-white transition-colors block pb-2"
                                        >
                                            ← Continue Shopping
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>

                    {/* Mobile Checkout Bar */}
                    <div className={`fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:hidden z-50 transition-transform duration-300 ${isMobileSummaryOpen || cartItems.length === 0 ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
                        <button
                            onClick={handleCheckout}
                            disabled={isValidating}
                            className="w-full bg-gradient-to-r from-[#FFB800] via-[#F59E0B] to-[#D97706] text-gray-950 font-black text-sm py-4 rounded-2xl shadow-lg shadow-amber-500/30 active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-60 cursor-pointer"
                        >
                            {isValidating ? (
                                <div className="w-5 h-5 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Lock size={16} />
                                    <span>Checkout (₦{total.toLocaleString()})</span>
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                total={total}
            />
        </div>
    );
}
