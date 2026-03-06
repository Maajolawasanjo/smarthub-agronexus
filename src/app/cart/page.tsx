"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Trash2, Plus, Minus, ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { PaymentModal } from "@/components/cart/PaymentModal";

export default function CartPage() {
    const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();
    const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const itemTotal = cartTotal;
    const shipping = cartItems.length > 0 ? 400 : 0;
    const total = itemTotal + shipping;

    return (
        <div className="min-h-screen bg-white">
            {cartItems.length === 0 && !isPaymentModalOpen ? (
                <div className="min-h-[80vh] bg-white flex flex-col items-center justify-center pt-20 pb-32 animate-in fade-in duration-500">
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
                        <ShoppingBag size={48} className="text-[#1B4D28] opacity-50" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h2>
                    <p className="text-gray-500 mb-8 max-w-md text-center">Looks like you haven't added anything to your cart yet. Explore our premium agricultural products.</p>
                    <Link href="/dashboard/products" className="px-8 py-3 bg-[#1B4D28] text-white font-medium rounded-full hover:bg-green-800 transition-colors shadow-lg">
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <>
                    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 pb-32">

                        {/* Breadcrumb / Back Navigation */}
                        <div className="flex items-center gap-2 mb-8 md:mb-12">
                            <Link href="/dashboard" className="flex items-center text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium">
                                <ArrowLeft size={16} className="mr-2" />
                                Home
                            </Link>
                            <span className="text-gray-300">/</span>
                            <span className="text-gray-500 text-sm font-medium">Add to cart</span>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">

                            {/* Left Column: Cart Items List */}
                            <div className="flex-1 flex flex-col gap-6 md:gap-8 order-2 lg:order-1">
                                {cartItems.length > 0 ? cartItems.map((item) => (
                                    <div key={item.id} className="flex flex-col sm:flex-row gap-4 sm:gap-6 py-6 border-b border-gray-100 relative group">

                                        {/* Product Image */}
                                        <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-[#f8f9fa] rounded-2xl overflow-hidden relative">
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>

                                        {/* Product Details */}
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-2">{item.name}</h3>
                                                    <span className="inline-block px-2.5 py-1 bg-[#e6f4ea] text-[#1e8e3e] text-[10px] sm:text-xs font-bold rounded-sm tracking-wide mb-3">
                                                        In Stock
                                                    </span>
                                                    <div className="font-bold text-gray-900 text-xl sm:text-2xl mt-1">
                                                        ${item.price.toLocaleString()} <span className="text-sm font-semibold text-gray-500">/ Ton</span>
                                                    </div>
                                                </div>

                                                {/* Desktop Delete Button */}
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-full text-xs font-medium text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                    Delete
                                                </button>
                                            </div>

                                            {/* Action Row: Delete (Mobile) + Quantity Controls */}
                                            <div className="flex items-center justify-between sm:justify-end mt-4 sm:mt-0 w-full sm:w-auto">
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-full text-xs font-medium text-gray-500 hover:text-red-500"
                                                >
                                                    <Trash2 size={14} />
                                                    Delete
                                                </button>

                                                <div className="flex items-center gap-4 sm:gap-6">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, -1)}
                                                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1B4D28] text-white flex items-center justify-center hover:bg-[#153b1e] transition-colors"
                                                    >
                                                        <Minus size={16} />
                                                    </button>
                                                    <span className="font-semibold text-gray-900 text-lg sm:text-xl w-6 text-center">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, 1)}
                                                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1B4D28] text-white flex items-center justify-center hover:bg-[#153b1e] transition-colors"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-20 text-center text-gray-400">Cart items cleared</div>
                                )}
                            </div>

                            {/* Right Column: Order Summary */}
                            <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 order-1 lg:order-2">
                                <div className="bg-[#1B4D28] rounded-[24px] lg:rounded-[32px] p-6 sm:p-8 lg:p-10 text-white lg:sticky lg:top-32 shadow-2xl shadow-green-900/10">
                                    <div className="flex items-center justify-between mb-8 cursor-pointer lg:cursor-default" onClick={() => setIsMobileSummaryOpen(!isMobileSummaryOpen)}>
                                        <h2 className="text-xl sm:text-2xl font-semibold tracking-wide">Order Summary</h2>
                                        <button className="lg:hidden text-white/80 p-1">
                                            {isMobileSummaryOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </button>
                                    </div>

                                    <div className={`transition-all duration-300 overflow-hidden ${isMobileSummaryOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 lg:max-h-[800px] lg:opacity-100'}`}>
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
                                                <span className="font-bold text-xl">$ {total.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-6">
                                            <button
                                                onClick={() => setIsPaymentModalOpen(true)}
                                                className="w-full bg-white text-[#1B4D28] font-bold text-center py-4 rounded-xl shadow-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                                                disabled={cartItems.length === 0}
                                            >
                                                Checkout (${total.toLocaleString()})
                                            </button>

                                            <Link href="/dashboard/products" className="text-left text-white/80 text-sm font-medium hover:text-white transition-colors pb-4 inline-block">
                                                Cancel & Return
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>

                    {/* Mobile Checkout Bar */}
                    <div className={`fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] lg:hidden z-50 transition-transform duration-300 ${isMobileSummaryOpen || cartItems.length === 0 ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
                        <button
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="w-full bg-[#1B4D28] text-white font-bold text-center py-4 rounded-xl shadow-md active:scale-[0.98] transition-all"
                        >
                            Checkout (${total.toLocaleString()})
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
