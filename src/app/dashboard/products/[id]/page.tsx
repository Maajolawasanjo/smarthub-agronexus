"use client";

import { use, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { products } from "@/lib/data/products";
import {
    ArrowLeft,
    ShoppingCart,
    FileText,
    ChevronRight,
    Check
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/Toast";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { addToCart } = useCart();
    const { toast } = useToast();

    // Simulate fetching product
    const product = products.find((p) => p.id === parseInt(id));

    // Image gallery state
    const [selectedImage, setSelectedImage] = useState("");

    useEffect(() => {
        if (product) {
            setSelectedImage(product.image);
        }
    }, [product]);

    if (!product) {
        notFound();
    }

    const handleAddToCart = () => {
        addToCart(product);
        toast(`${product.name} has been added to your cart.`, "success");
    };

    // Get 4 related products (excluding current one)
    const relatedProducts = products.filter(p => p.id !== product.id).slice(0, 4);

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col pt-4 md:pt-8 pb-20 animate-in fade-in duration-500 bg-white min-h-screen px-4 md:px-6">

            {/* Top Breadcrumb (Desktop & Mobile) */}
            <div className="flex items-center gap-3 text-sm text-gray-400 mb-6 md:mb-10 font-medium">
                <button
                    onClick={() => router.back()}
                    className="flex items-center hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={16} className="mr-2" />
                </button>
                <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Home</Link>
                <span className="text-gray-300"></span>
                <span className="text-gray-400">{product.name}</span>
            </div>

            {/* Main Product Layout (2 Column Desktop, Stacked Mobile) */}
            <div className="flex flex-col md:flex-row gap-8 md:gap-16 mb-16">

                {/* Left: Image & Thumbnails */}
                <div className="w-full md:w-1/2 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-8 md:slide-in-from-left-8 duration-700">
                    {/* Main Large Image Container */}
                    <div className="relative w-full aspect-square bg-[#F5F5F5] rounded-3xl overflow-hidden flex items-center justify-center p-8">
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-contain drop-shadow-xl p-8 transition-transform duration-500 hover:scale-105"
                            priority
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="%23cccccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                            }}
                        />
                    </div>

                    {/* Thumbnail Row */}
                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                        {[1, 2, 3].map((thumb, idx) => (
                            <div key={idx} className={`relative aspect-[4/3] bg-[#F5F5F5] rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${idx === 0 ? 'border-[#1B4D28]' : 'border-transparent hover:border-gray-300'}`}>
                                <Image
                                    src={product.image}
                                    alt={`${product.name} thumbnail ${idx + 1}`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Details & Actions */}
                <div className="w-full md:w-1/2 flex flex-col pt-2 md:pt-4 animate-in fade-in slide-in-from-bottom-8 md:slide-in-from-right-8 duration-700 delay-150 fill-mode-both">
                    <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4 tracking-tight">
                        {product.name}
                    </h1>

                    <div className="flex flex-col mb-6">
                        <span className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-2">
                            ${product.price.toLocaleString()} / {product.unit}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                            <Link href="#" className="hover:text-gray-900 transition-colors uppercase">{product.category}</Link>
                            <span className="h-2 w-2 border-t border-r border-gray-400 transform rotate-45 mx-1"></span>
                            <span>{product.category === 'Seeds' ? 'Cashew' : product.category}</span>
                        </div>
                    </div>

                    {/* Specification Grid */}
                    <div className="flex flex-col gap-4 mt-4 mb-8">
                        <div className="grid grid-cols-[140px_1fr] md:grid-cols-[160px_1fr] gap-4 items-center border-b border-gray-100 pb-4">
                            <span className="text-[13px] md:text-sm text-gray-500 font-medium tracking-wide">Availability :</span>
                            <span className="text-[14px] md:text-[15px] font-bold text-gray-900">{product.stock > 0 ? "In Stock" : "Out of Stock"}</span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] md:grid-cols-[160px_1fr] gap-4 items-center border-b border-gray-100 pb-4">
                            <span className="text-[13px] md:text-sm text-gray-500 font-medium tracking-wide">Minimum Order Quantity :</span>
                            <span className="text-[14px] md:text-[15px] font-bold text-gray-900">{product.moq}</span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] md:grid-cols-[160px_1fr] gap-4 items-center border-b border-gray-100 pb-4">
                            <span className="text-[13px] md:text-sm text-gray-500 font-medium tracking-wide">Grade :</span>
                            <span className="text-[14px] md:text-[15px] font-bold text-gray-900">{product.grade}</span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] md:grid-cols-[160px_1fr] gap-4 items-center border-b border-gray-100 pb-4">
                            <span className="text-[13px] md:text-sm text-gray-500 font-medium tracking-wide">Packaging :</span>
                            <span className="text-[14px] md:text-[15px] font-bold text-gray-900">{product.packaging}</span>
                        </div>
                    </div>

                    {/* Description Paragraph */}
                    <p className="text-sm md:text-[15px] text-gray-600 leading-relaxed mb-8 md:mb-12 max-w-[90%]">
                        {product.description}
                    </p>

                    {/* Desktop Actions (Hidden on Mobile, replaced by bottom bar later) */}
                    <div className="hidden md:flex items-center gap-4">
                        <button
                            onClick={handleAddToCart}
                            className="bg-[#1B4D28] hover:bg-[#153b1e] text-white py-4 px-8 rounded-full font-medium text-[15px] transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-3 w-fit shadow-md hover:shadow-lg shadow-green-900/10 active:scale-95"
                        >
                            <ShoppingCart size={18} />
                            Add to cart
                        </button>

                        <Link
                            href="/cart"
                            className="bg-white border-2 border-gray-200 text-gray-700 py-4 px-8 rounded-full font-medium text-[15px] transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-3 w-fit hover:bg-gray-50 active:scale-95 shadow-sm"
                        >
                            View Cart
                        </Link>
                    </div>

                    <div className="hidden md:flex mt-6">
                        <button className="flex items-center gap-2 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors w-fit group">
                            <FileText size={16} className="text-gray-400 group-hover:text-gray-700 transition-colors" />
                            Download Product Spec Sheet (PDF)
                        </button>
                    </div>

                </div>
            </div>

            {/* Mobile Actions (Visible only on mobile) */}
            <div className="flex md:hidden flex-col gap-4 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="flex-1 bg-white border-2 border-gray-200 text-gray-700 py-3.5 rounded-full font-semibold text-sm transition-colors flex items-center justify-center gap-2 active:scale-95"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>
                    <button
                        onClick={handleAddToCart}
                        className="flex-[2] bg-[#1B4D28] hover:bg-[#153b1e] text-white py-3.5 rounded-full font-semibold text-sm transition-colors shadow-md flex items-center justify-center gap-2 active:scale-95"
                    >
                        <ShoppingCart size={16} />
                        Add to cart
                    </button>
                </div>

                <Link
                    href="/cart"
                    className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3.5 rounded-full font-semibold text-sm transition-colors flex items-center justify-center gap-2 active:scale-95"
                >
                    View Cart
                </Link>

                <button className="flex items-center justify-center gap-2 text-[12px] font-medium text-gray-500 mt-2">
                    <FileText size={14} className="text-gray-400" />
                    Download Product Spec Sheet (PDF)
                </button>
            </div>

            {/* Related Products Section */}
            <div className="w-full mt-4 md:mt-8 border-t border-gray-100 pt-10 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-500 fill-mode-both">
                <h3 className="text-[17px] font-bold text-gray-900 mb-8 border-b-2 border-transparent relative w-fit after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-12 after:h-0.5 after:bg-[#1B4D28]">Related Product</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {relatedProducts.map((related, idx) => (
                        <Link
                            key={related.id}
                            href={`/dashboard/products/${related.id}`}
                            className="group bg-white flex items-center gap-4 py-2 hover:bg-gray-50 rounded-xl transition-all duration-300 pr-4 hover:-translate-y-1 hover:shadow-sm"
                        >
                            <div className="relative w-20 h-20 md:w-24 md:h-24 bg-[#F5F5F5] rounded-xl overflow-hidden shrink-0">
                                <Image
                                    src={related.image}
                                    alt={related.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                            <div className="flex flex-col">
                                <h4 className="text-[13px] md:text-sm font-semibold text-gray-800 leading-tight mb-1.5 group-hover:text-[#1B4D28] transition-colors">{related.name}</h4>
                                <span className="text-[13px] font-bold text-gray-900">
                                    $ {related.price.toLocaleString()} / {related.unit}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

        </div>
    );
}
