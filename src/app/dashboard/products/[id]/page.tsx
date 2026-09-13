"use client";

import { use, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ShoppingCart,
    FileText,
    Loader2,
    CheckCircle2
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/Toast";
import { ProductDTO } from "@/dto";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { addToCart } = useCart();
    const { toast } = useToast();

    const [product, setProduct] = useState<ProductDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Image gallery state
    const [selectedImage, setSelectedImage] = useState("");

    useEffect(() => {
        async function fetchProductDetail() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/products/${id}`);
                if (!res.ok) {
                    if (res.status === 404) throw new Error("Product listing not found.");
                    throw new Error("Failed to load product details.");
                }
                const data: ProductDTO = await res.json();
                setProduct(data);
                setSelectedImage(data.primaryImage);
            } catch (err: any) {
                setError(err.message || "Error loading product.");
            } finally {
                setLoading(false);
            }
        }
        fetchProductDetail();
    }, [id]);

    if (loading) {
        return (
            <div className="w-full min-h-[70vh] flex flex-col items-center justify-center bg-white">
                <Loader2 size={36} className="text-[#1B4D28] animate-spin mb-4" />
                <p className="text-gray-600 font-medium text-sm">Fetching product details from database...</p>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="w-full min-h-[60vh] flex flex-col items-center justify-center bg-white p-6 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Listing Unavailable</h2>
                <p className="text-sm text-gray-500 max-w-md mb-6">{error || "The requested product listing could not be found."}</p>
                <button
                    onClick={() => router.back()}
                    className="bg-[#1B4D28] text-white px-6 py-2.5 rounded-full text-xs font-bold transition-all hover:bg-[#143d20]"
                >
                    Return to Marketplace
                </button>
            </div>
        );
    }

    const handleAddToCart = () => {
        addToCart({
            id: product.id,
            name: product.name,
            category: product.category.name,
            country: product.farmer.state,
            price: product.price,
            unit: product.unit,
            image: product.primaryImage,
            description: product.description,
            stock: product.inventory.availableQty,
            rating: 4.9,
            reviewsCount: 12,
            certification: "Certified Export Grade",
            sku: `PROD-${product.id.substring(0, 6)}`,
            brand: product.farmer.farmName,
            farmerProfileId: product.farmer.id,
            farmerName: product.farmer.farmName,
            moq: product.specifications.minOrderQty,
            grade: product.specifications.grade,
            packaging: product.specifications.packaging,
        });
        toast(`${product.name} has been added to your cart.`, "success");
    };

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col pt-4 md:pt-8 pb-20 animate-in fade-in duration-500 bg-white min-h-screen px-4 md:px-6">

            {/* Top Breadcrumb */}
            <div className="flex items-center gap-3 text-sm text-gray-400 mb-6 md:mb-10 font-medium">
                <button
                    onClick={() => router.back()}
                    className="flex items-center hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={16} className="mr-2" />
                </button>
                <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Home</Link>
                <span className="text-gray-300">/</span>
                <Link href="/dashboard/products" className="hover:text-gray-900 transition-colors">Products</Link>
                <span className="text-gray-300">/</span>
                <span className="text-gray-600 font-bold">{product.name}</span>
            </div>

            {/* Main Product Layout (2 Column Desktop, Stacked Mobile) */}
            <div className="flex flex-col md:flex-row gap-8 md:gap-16 mb-16">

                {/* Left: Image & Thumbnails */}
                <div className="w-full md:w-1/2 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-8 md:slide-in-from-left-8 duration-700">
                    {/* Main Large Image Container */}
                    <div className="relative w-full aspect-square bg-[#F5F5F5] rounded-3xl overflow-hidden flex items-center justify-center p-8 border border-gray-100">
                        <Image
                            src={selectedImage || product.primaryImage}
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
                        {product.images.length > 0 ? (
                            product.images.map((img, idx) => (
                                <div
                                    key={img.id}
                                    onClick={() => setSelectedImage(img.imageUrl)}
                                    className={`relative aspect-[4/3] bg-[#F5F5F5] rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${
                                        selectedImage === img.imageUrl ? 'border-[#1B4D28]' : 'border-transparent hover:border-gray-300'
                                    }`}
                                >
                                    <Image
                                        src={img.imageUrl}
                                        alt={`${product.name} thumbnail ${idx + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ))
                        ) : (
                            <div className="relative aspect-[4/3] bg-[#F5F5F5] rounded-2xl overflow-hidden border-2 border-[#1B4D28]">
                                <Image
                                    src={product.primaryImage}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Details & Actions */}
                <div className="w-full md:w-1/2 flex flex-col pt-2 md:pt-4 animate-in fade-in slide-in-from-bottom-8 md:slide-in-from-right-8 duration-700 delay-150 fill-mode-both">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-[#1B4D28]/10 text-[#1B4D28] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            {product.category.name}
                        </span>
                        {product.farmer.verificationStatus === "APPROVED" && (
                            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                                <CheckCircle2 size={13} /> Verified Farmer
                            </span>
                        )}
                    </div>

                    <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4 tracking-tight">
                        {product.name}
                    </h1>

                    <div className="flex flex-col mb-6">
                        <span className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-1">
                            ₦{product.price.toLocaleString()} / {product.unit.toLowerCase() === "kg" ? "KG" : product.unit}
                        </span>
                        <p className="text-xs text-gray-500 font-medium">
                            Producer:{" "}
                            <Link
                                href={`/farmers/${product.farmer.id}`}
                                className="font-bold text-[#1B4D28] hover:underline"
                            >
                                {product.farmer.farmName}
                            </Link>{" "}
                            ({product.farmer.farmAddress || `${product.farmer.state}, ${product.farmer.lga}`})
                        </p>
                    </div>

                    {/* Specification Grid */}
                    <div className="flex flex-col gap-4 mt-2 mb-8">
                        <div className="grid grid-cols-[140px_1fr] md:grid-cols-[160px_1fr] gap-4 items-center border-b border-gray-100 pb-3">
                            <span className="text-[13px] md:text-sm text-gray-500 font-medium tracking-wide">Availability :</span>
                            <span className={`text-[14px] md:text-[15px] font-bold ${
                                product.inventory.stockStatus === "IN_STOCK" ? "text-emerald-700" : "text-amber-700"
                            }`}>
                                {product.inventory.stockStatus.replace("_", " ")} ({product.inventory.availableQty} {product.unit} available)
                            </span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] md:grid-cols-[160px_1fr] gap-4 items-center border-b border-gray-100 pb-3">
                            <span className="text-[13px] md:text-sm text-gray-500 font-medium tracking-wide">Minimum Order :</span>
                            <span className="text-[14px] md:text-[15px] font-bold text-gray-900">{product.specifications.minOrderQty}</span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] md:grid-cols-[160px_1fr] gap-4 items-center border-b border-gray-100 pb-3">
                            <span className="text-[13px] md:text-sm text-gray-500 font-medium tracking-wide">Quality Grade :</span>
                            <span className="text-[14px] md:text-[15px] font-bold text-gray-900">{product.specifications.grade}</span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] md:grid-cols-[160px_1fr] gap-4 items-center border-b border-gray-100 pb-3">
                            <span className="text-[13px] md:text-sm text-gray-500 font-medium tracking-wide">Delivery ETA :</span>
                            <span className="text-[14px] md:text-[15px] font-bold text-gray-900">{product.deliveryEstimate}</span>
                        </div>
                    </div>

                    {/* Description Paragraph */}
                    <p className="text-sm md:text-[15px] text-gray-600 leading-relaxed mb-8 md:mb-12 max-w-[95%]">
                        {product.description}
                    </p>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        <button
                            onClick={handleAddToCart}
                            disabled={product.inventory.stockStatus === "OUT_OF_STOCK"}
                            className="bg-[#1B4D28] hover:bg-[#153b1e] text-white py-4 px-8 rounded-full font-medium text-[15px] transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-3 w-fit shadow-md hover:shadow-lg shadow-green-900/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Mobile Actions */}
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
                        disabled={product.inventory.stockStatus === "OUT_OF_STOCK"}
                        className="flex-[2] bg-[#1B4D28] hover:bg-[#153b1e] text-white py-3.5 rounded-full font-semibold text-sm transition-colors shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
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
            </div>

            {/* Recommended Commodities & Frequently Bought Together */}
            {product.relatedProducts.length > 0 && (
                <div className="w-full mt-10 md:mt-16 border-t border-gray-100 pt-12 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-500 fill-mode-both">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
                        <div>
                            <span className="font-handwriting text-[#527052] text-xl md:text-2xl italic block mb-1">
                                Complementary Commodities
                            </span>
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                                Recommended Produce &amp; Frequently Bought Together
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                High-demand Nigerian agricultural commodities frequently paired with {product.name}
                            </p>
                        </div>
                        <Link
                            href="/dashboard/products"
                            className="text-xs font-bold text-[#1B4D28] hover:underline flex items-center gap-1 shrink-0"
                        >
                            Browse All Commodities &rarr;
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
                        {product.relatedProducts.map((related) => (
                            <div
                                key={related.id}
                                onClick={() => router.push(related.id.startsWith("rec_") ? "/dashboard/products" : `/dashboard/products/${related.id}`)}
                                className="group bg-white rounded-2xl border border-gray-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col hover:-translate-y-1.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer"
                            >
                                <div className="relative w-full aspect-[4/3] bg-gray-50 overflow-hidden">
                                    <Image
                                        src={related.primaryImage}
                                        alt={related.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src =
                                                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="%23cccccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                                        }}
                                    />
                                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                                        <span className="bg-[#1B4D28]/95 backdrop-blur-md text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-sm">
                                            {related.category.name}
                                        </span>
                                    </div>
                                    {related.grade && (
                                        <span className="absolute top-2.5 right-2.5 bg-blue-600/95 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                            {related.grade}
                                        </span>
                                    )}
                                </div>

                                <div className="p-4 flex flex-col flex-1 justify-between">
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm sm:text-base leading-snug group-hover:text-[#1B4D28] transition-colors line-clamp-1 mb-1">
                                            {related.name}
                                        </h4>
                                        <p className="text-[11px] text-gray-500 mb-2 font-medium">
                                            {related.farmer.farmName} • {related.farmer.state}
                                        </p>
                                        <p className="text-gray-600 text-xs leading-relaxed line-clamp-2 mb-3 font-normal">
                                            {related.description}
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-gray-100">
                                        <div className="flex items-baseline justify-between mb-3">
                                            <span className="text-base font-extrabold text-gray-900">
                                                ₦{related.price.toLocaleString()}
                                                <span className="text-[11px] font-normal text-gray-500"> / {related.unit}</span>
                                            </span>
                                            <span className="text-[10px] font-bold text-[#1B4D28] bg-green-50 px-2 py-0.5 rounded border border-green-200/50">
                                                MOQ: {related.moq || 1}
                                            </span>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                addToCart({
                                                    id: related.id,
                                                    name: related.name,
                                                    category: related.category.name,
                                                    country: related.farmer.state,
                                                    price: related.price,
                                                    unit: related.unit,
                                                    image: related.primaryImage,
                                                    description: related.description,
                                                    stock: related.inventory.availableQty,
                                                    rating: 4.9,
                                                    reviewsCount: 8,
                                                    certification: "Certified Export Grade",
                                                    sku: `PROD-${related.id.substring(0, 6)}`,
                                                    brand: related.farmer.farmName,
                                                    farmerProfileId: related.farmer.id,
                                                    farmerName: related.farmer.farmName,
                                                    moq: `${related.moq || 1} ${related.unit}`,
                                                    grade: related.grade || "Grade A",
                                                    packaging: related.packaging || "Export Bags",
                                                });
                                                toast(`${related.name} added to cart!`, "success");
                                            }}
                                            className="w-full py-2.5 px-3 bg-[#1B4D28] hover:bg-[#153b1e] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                                        >
                                            <ShoppingCart size={14} />
                                            <span>+ Add to Cart</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
