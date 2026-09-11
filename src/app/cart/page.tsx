"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Trash2, Plus, Minus, ChevronDown, ChevronUp, ShoppingBag, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { PaymentModal } from "@/components/cart/PaymentModal";

export default function CartPage() {
    const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();
    const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

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
                setValidationError(data.errors?.[0] || data.error || "Some items in your cart are no longer available.");
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
    const shipping = cartItems.length > 0 ? 400 : 0;
    const total = itemTotal + shipping;

    return (
        <div className="min-h-screen bg-white">
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
                        className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-sm shadow-green-900/10"
                    >
                        <ShoppingBag size={48} className="text-[#1B4D28] opacity-60" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h2>
                    <p className="text-gray-500 mb-8 max-w-md text-center">Looks like you haven't added anything to your cart yet. Explore our premium agricultural products.</p>
                    <Link href="/products">
                        <motion.div
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.96 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                            <span className="px-8 py-3.5 bg-[#1B4D28] hover:bg-[#153b1e] text-white font-medium rounded-full shadow-lg shadow-green-900/20 inline-block transition-colors cursor-pointer">
                                Start Shopping
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
                            transition={{ duration: 0.4 }}
                            className="flex items-center gap-2 mb-8 md:mb-12"
                        >
                            <Link href="/products" className="flex items-center text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium group">
                                <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                                Marketplace
                            </Link>
                            <span className="text-gray-300">/</span>
                            <span className="text-gray-700 text-sm font-semibold">Shopping Cart</span>
                        </motion.div>

                        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">

                            {/* Left Column: Cart Items List with AnimatePresence layout animations */}
                            <motion.div layout className="flex-1 flex flex-col gap-6 md:gap-8 order-2 lg:order-1">
                                <AnimatePresence mode="popLayout">
                                    {cartItems.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{
                                                opacity: 0,
                                                x: -50,
                                                height: 0,
                                                paddingTop: 0,
                                                paddingBottom: 0,
                                                marginBottom: 0,
                                                overflow: "hidden",
                                                transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
                                            }}
                                            className="flex flex-col sm:flex-row gap-4 sm:gap-6 py-6 border-b border-gray-100 relative group"
                                        >
                                            {/* Product Image */}
                                            <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-[#f8f9fa] rounded-2xl overflow-hidden relative border border-gray-100 shadow-sm">
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>

                                            {/* Product Details */}
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-2 group-hover:text-[#1B4D28] transition-colors">
                                                            {item.name}
                                                        </h3>
                                                        <span className="inline-block px-2.5 py-1 bg-[#e6f4ea] text-[#1e8e3e] text-[10px] sm:text-xs font-bold rounded-full tracking-wide mb-3">
                                                            In Stock
                                                        </span>
                                                        <div className="font-bold text-gray-900 text-xl sm:text-2xl mt-1">
                                                            ${item.price.toLocaleString()} <span className="text-sm font-semibold text-gray-500">/ Ton</span>
                                                        </div>
                                                    </div>

                                                    {/* Desktop Delete Button */}
                                                    <motion.button
                                                        whileHover={{ scale: 1.08, color: "#ef4444", borderColor: "#fca5a5" }}
                                                        whileTap={{ scale: 0.92 }}
                                                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-full text-xs font-medium text-gray-500 hover:bg-red-50/50 transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 size={14} />
                                                        Delete
                                                    </motion.button>
                                                </div>

                                                {/* Action Row: Delete (Mobile) + Quantity Controls */}
                                                <div className="flex items-center justify-between sm:justify-end mt-4 sm:mt-0 w-full sm:w-auto">
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.92 }}
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-full text-xs font-medium text-gray-500 hover:text-red-500 cursor-pointer"
                                                    >
                                                        <Trash2 size={14} />
                                                        Delete
                                                    </motion.button>

                                                    <div className="flex items-center gap-4 sm:gap-6">
                                                        <motion.button
                                                            whileHover={{ scale: 1.15 }}
                                                            whileTap={{ scale: 0.85 }}
                                                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                                            onClick={() => updateQuantity(item.id, -1)}
                                                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1B4D28] text-white flex items-center justify-center hover:bg-[#153b1e] transition-colors shadow-sm cursor-pointer"
                                                            aria-label="Decrease quantity"
                                                        >
                                                            <Minus size={16} />
                                                        </motion.button>

                                                        <motion.span
                                                            key={item.quantity}
                                                            initial={{ scale: 1.3, color: "#4CAF50" }}
                                                            animate={{ scale: 1, color: "#111827" }}
                                                            transition={{ duration: 0.25 }}
                                                            className="font-semibold text-lg sm:text-xl w-6 text-center"
                                                        >
                                                            {item.quantity}
                                                        </motion.span>

                                                        <motion.button
                                                            whileHover={{ scale: 1.15 }}
                                                            whileTap={{ scale: 0.85 }}
                                                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                                            onClick={() => updateQuantity(item.id, 1)}
                                                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1B4D28] text-white flex items-center justify-center hover:bg-[#153b1e] transition-colors shadow-sm cursor-pointer"
                                                            aria-label="Increase quantity"
                                                        >
                                                            <Plus size={16} />
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>

                            {/* Right Column: Order Summary */}
                            <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 order-1 lg:order-2">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                    className="bg-[#1B4D28] rounded-[24px] lg:rounded-[32px] p-6 sm:p-8 lg:p-10 text-white lg:sticky lg:top-32 shadow-2xl shadow-green-900/15 border border-[#2C5E39]"
                                >
                                    <div
                                        className="flex items-center justify-between mb-8 cursor-pointer lg:cursor-default"
                                        onClick={() => setIsMobileSummaryOpen(!isMobileSummaryOpen)}
                                    >
                                        <h2 className="text-xl sm:text-2xl font-semibold tracking-wide">Order Summary</h2>
                                        <button className="lg:hidden text-white/80 p-1">
                                            {isMobileSummaryOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </button>
                                    </div>

                                    <div className={`transition-all duration-300 ${isMobileSummaryOpen ? 'block' : 'hidden lg:block'}`}>
                                        <div className="flex flex-col gap-4 text-sm font-medium mb-10">
                                            {cartItems.map(item => (
                                                <div key={item.id} className="flex justify-between items-center">
                                                    <span className="text-white/90">{item.name}</span>
                                                    <span className="font-bold">
                                                        $ {(item.price * item.quantity).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="h-px bg-white/20 w-full mb-8"></div>

                                        <div className="flex flex-col gap-5 text-sm mb-12">
                                            <div className="flex justify-between items-center">
                                                <span className="text-white/90 font-medium tracking-wide">Item</span>
                                                <span className="font-bold text-lg">$ {itemTotal.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-white/90 font-medium tracking-wide">Shipping</span>
                                                <span className="font-bold text-lg">$ {shipping.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-white font-semibold text-base tracking-wide">Total</span>
                                                <motion.span
                                                    key={total}
                                                    initial={{ scale: 1.1, color: "#e8b84a" }}
                                                    animate={{ scale: 1, color: "#ffffff" }}
                                                    transition={{ duration: 0.25 }}
                                                    className="font-bold text-xl"
                                                >
                                                    $ {total.toLocaleString()}
                                                </motion.span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-6">
                                            {validationError && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -6 }}
                                                    animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
                                                    transition={{ duration: 0.4 }}
                                                    className="bg-red-50 text-red-600 text-sm font-medium p-3.5 rounded-xl border border-red-100 mt-2"
                                                >
                                                    {validationError}
                                                </motion.div>
                                            )}

                                            <motion.button
                                                whileHover={{ scale: 1.02, filter: "brightness(1.05)" }}
                                                whileTap={{ scale: 0.98 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                                onClick={handleCheckout}
                                                className="w-full bg-gradient-to-r from-[#FFB800] via-[#F59E0B] to-[#D97706] text-gray-950 font-black text-base tracking-wide text-center py-4 rounded-2xl shadow-xl shadow-amber-500/30 active:scale-[0.98] transition-all disabled:opacity-50 flex justify-center items-center gap-2.5 cursor-pointer"
                                                disabled={cartItems.length === 0 || isValidating}
                                            >
                                                {isValidating ? (
                                                    <div className="w-5 h-5 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <Lock size={18} className="text-gray-950 shrink-0" />
                                                        <span>Proceed to Checkout (${total.toLocaleString()})</span>
                                                    </>
                                                )}
                                            </motion.button>

                                            <Link href="/products" className="text-center text-white/80 text-sm font-medium hover:text-white transition-colors pb-4 inline-block">
                                                ← Continue Shopping
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </main>

                    {/* Mobile Checkout Bar */}
                    <div className={`fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:hidden z-50 transition-transform duration-300 ${isMobileSummaryOpen || cartItems.length === 0 ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleCheckout}
                            className="w-full bg-gradient-to-r from-[#FFB800] via-[#F59E0B] to-[#D97706] text-gray-950 font-black text-base py-4 rounded-2xl shadow-lg shadow-amber-500/30 active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-60 cursor-pointer"
                            disabled={isValidating}
                        >
                            {isValidating ? (
                                <div className="w-5 h-5 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Lock size={18} />
                                    <span>Proceed to Checkout (${total.toLocaleString()})</span>
                                </>
                            )}
                        </motion.button>
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
