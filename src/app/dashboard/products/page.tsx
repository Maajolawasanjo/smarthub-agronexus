"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Search, SlidersHorizontal, X, Loader2, ShoppingBag, Eye } from "lucide-react";
import { useSearch } from "@/context/SearchContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/Toast";
import { MarketplaceDTO, MarketplaceProductItemDTO } from "@/dto";

export default function DashboardProductsPage() {
    const { searchTerm } = useSearch();
    const { addToCart, cartItems } = useCart();
    const cartItemsCount = cartItems?.length || 0;
    const { toast } = useToast();

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedStates, setSelectedStates] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<number>(10000);
    const [inStockOnly, setInStockOnly] = useState(false);

    const [dto, setDto] = useState<MarketplaceDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchProductsWithRetry() {
            setLoading(true);
            setError(null);

            const queryParams = new URLSearchParams();
            if (searchTerm) queryParams.set("search", searchTerm);
            if (selectedCategories.length > 0) queryParams.set("category", selectedCategories.join(","));
            if (selectedStates.length > 0) queryParams.set("state", selectedStates.join(","));
            if (priceRange < 10000) queryParams.set("maxPrice", priceRange.toString());

            const url = `/api/products?${queryParams.toString()}`;
            const maxRetries = 3;
            let attempt = 0;

            while (attempt < maxRetries) {
                try {
                    const res = await fetch(url);
                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.error || `HTTP ${res.status}: Failed to load marketplace products.`);
                    }
                    const data: MarketplaceDTO = await res.json();
                    if (isMounted) {
                        setDto(data);
                        setError(null);
                    }
                    break; // Success! Exit loop.
                } catch (err: any) {
                    attempt++;
                    if (attempt >= maxRetries) {
                        if (isMounted) {
                            setError(err.message || "Unable to reach marketplace database. Please try again.");
                        }
                    } else {
                        // Exponential backoff delay (500ms, 1000ms)
                        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
                    }
                }
            }

            if (isMounted) {
                setLoading(false);
            }
        }

        fetchProductsWithRetry();

        return () => {
            isMounted = false;
        };
    }, [searchTerm, selectedCategories, selectedStates, priceRange]);

    const handleCategoryToggle = (categoryName: string) => {
        setSelectedCategories((prev) =>
            prev.includes(categoryName) ? prev.filter((c) => c !== categoryName) : [...prev, categoryName]
        );
    };

    const handleStateToggle = (stateName: string) => {
        setSelectedStates((prev) =>
            prev.includes(stateName) ? prev.filter((s) => s !== stateName) : [...prev, stateName]
        );
    };

    const handleResetFilters = () => {
        setSelectedCategories([]);
        setSelectedStates([]);
        setPriceRange(10000);
        setInStockOnly(false);
        setIsFilterOpen(false);
    };

    const rawProducts = dto?.products || [];
    const products = inStockOnly
        ? rawProducts.filter((p) => p.inventory.stockStatus !== "OUT_OF_STOCK")
        : rawProducts;

    return (
        <div className="w-full min-h-screen bg-[#F9FBF8] text-gray-900 font-sans pb-16 pt-2">
            <div className="w-full max-w-7xl mx-auto px-4 md:px-6">

                {/* ── Top Header Bar ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pt-2">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                            All Products
                        </h1>
                        <p className="text-xs md:text-sm text-gray-500 mt-1 font-normal">
                            Showing {products.length} verified export listings from PostgreSQL
                        </p>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto">
                        {/* Cart — only shown on the marketplace */}
                        <Link
                            href="/cart"
                            className="relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FFB800] via-[#F59E0B] to-[#D97706] text-gray-950 font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all group cursor-pointer"
                        >
                            <ShoppingBag size={16} className="group-hover:rotate-6 transition-transform" />
                            <span>Cart</span>
                            {cartItemsCount > 0 && (
                                <span className="w-5 h-5 bg-gray-950 text-amber-400 font-extrabold text-[10px] rounded-full flex items-center justify-center">
                                    {cartItemsCount}
                                </span>
                            )}
                        </Link>

                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="bg-[#EAEFE9] hover:bg-[#dfe6de] text-gray-800 text-xs font-semibold px-4 py-2.5 rounded-xl border border-gray-200/60 flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                            <SlidersHorizontal size={15} className="text-gray-700" />
                            <span>Filter Results</span>
                        </button>
                    </div>
                </div>

                {/* ── Main Content Grid & Filter Drawer Layout ── */}
                <div className="relative w-full">
                    <div
                        className={`w-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                            isFilterOpen ? "md:pr-[340px]" : "pr-0"
                        }`}
                    >
                        {loading ? (
                            <div className="w-full py-24 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <Loader2 size={36} className="text-[#1B4D28] animate-spin mb-4" />
                                <p className="text-gray-600 font-medium text-sm">Hydrating PostgreSQL product catalog...</p>
                            </div>
                        ) : error ? (
                            <div className="w-full py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-red-100 p-8">
                                <p className="text-red-600 font-semibold mb-4">{error}</p>
                                <button
                                    onClick={handleResetFilters}
                                    className="px-6 py-2 bg-[#1B4D28] text-white font-medium text-xs rounded-full hover:bg-[#143d20] transition-colors"
                                >
                                    Reset Filters & Retry
                                </button>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="w-full py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                                    <Search className="text-gray-400" size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2">No products found</h3>
                                <p className="text-xs text-gray-500 max-w-sm mb-6">
                                    We couldn&apos;t find any products matching your current filters. Try relaxing your search query or filter options.
                                </p>
                                <button
                                    onClick={handleResetFilters}
                                    className="px-6 py-2 bg-[#1B4D28] text-white font-medium text-xs rounded-full hover:bg-[#143d20] transition-colors"
                                >
                                    Reset all filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                                {products.map((product) => (
                                    <div
                                        key={product.id}
                                        className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col hover:-translate-y-1.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] transition-all duration-300 group"
                                    >
                                        {/* Card Top Image Container */}
                                        <div className="relative w-full h-56 md:h-60 bg-gray-100 overflow-hidden">
                                            {/* Stock Badge */}
                                            <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider text-gray-800 flex items-center gap-1.5 shadow-sm border border-gray-100">
                                                <span className={`w-2 h-2 rounded-full ${
                                                    product.inventory.stockStatus === "IN_STOCK"
                                                        ? "bg-emerald-500"
                                                        : product.inventory.stockStatus === "LOW_STOCK"
                                                            ? "bg-amber-500"
                                                            : "bg-red-500"
                                                }`}></span>
                                                {product.inventory.stockStatus.replace("_", " ")}
                                            </div>

                                            <Image
                                                src={product.primaryImage}
                                                alt={product.name}
                                                fill
                                                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src =
                                                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="%23cccccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                                                }}
                                            />
                                        </div>

                                        {/* Card Body Section */}
                                        <div className="p-5 flex flex-col flex-1 justify-between bg-white">
                                            <div>
                                                {/* Top Row: Title + Category */}
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <h3 className="font-bold text-gray-900 text-lg md:text-xl leading-snug tracking-tight group-hover:text-[#1B4D28] transition-colors">
                                                        {product.name}
                                                    </h3>
                                                    <span className="font-handwriting text-[#527052] text-lg md:text-xl italic shrink-0 text-right font-normal">
                                                        {product.category.name}
                                                    </span>
                                                </div>

                                                {/* Location Pin */}
                                                <div className="flex items-center gap-1 text-gray-500 text-xs mt-1 font-medium">
                                                    <MapPin size={13} className="text-gray-400 shrink-0" />
                                                    <span>{product.farmer.farmName} • {product.farmer.state}</span>
                                                </div>
                                            </div>

                                            {/* Divider Line */}
                                            <div className="w-full h-px bg-gray-100 my-4" />

                                            {/* Price Row */}
                                            <div className="flex items-baseline justify-between mb-4">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
                                                        ₦{product.price.toLocaleString()}
                                                    </span>
                                                    <span className="text-xs text-gray-500 font-medium">
                                                        / {product.unit}
                                                    </span>
                                                </div>
                                                <Link
                                                    href={`/dashboard/products/${product.id}`}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-[#1B4D28] transition-colors hover:underline cursor-pointer"
                                                >
                                                    <Eye size={13} />
                                                    <span>Details</span>
                                                </Link>
                                            </div>

                                            {/* Prominent High-Impact Call-To-Action (CTA) Button */}
                                            <button
                                                onClick={() => {
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
                                                        moq: `1 ${product.unit}`,
                                                        grade: "Grade A",
                                                        packaging: "Export Bags",
                                                    });
                                                    toast(`${product.name} added to cart!`, "success");
                                                }}
                                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-[#1B4D28] via-[#246335] to-[#2E7D42] hover:from-[#153b1e] hover:to-[#246335] text-white font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-md shadow-green-950/20 active:scale-95 transition-all group cursor-pointer"
                                            >
                                                <ShoppingBag size={16} className="group-hover:scale-110 group-hover:rotate-6 transition-transform" />
                                                <span>Add to Cart</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Mobile Backdrop */}
                    {isFilterOpen && (
                        <div
                            className="md:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm animate-in fade-in"
                            onClick={() => setIsFilterOpen(false)}
                        />
                    )}

                    {/* Filter Slideout Panel */}
                    <div
                        className={`
                            fixed inset-x-0 bottom-0 z-50 md:absolute md:top-0 md:right-0 md:bottom-auto md:inset-x-auto
                            w-full md:w-[320px] max-h-[85vh] md:max-h-none flex flex-col
                            bg-white md:bg-white/95 md:backdrop-blur-xl md:border md:border-gray-200/80 rounded-t-2xl md:rounded-2xl 
                            shadow-[0_-8px_30px_rgba(0,0,0,0.12)] md:shadow-[0_8px_30px_rgb(0,0,0,0.08)]
                            transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] md:origin-top-right md:z-30
                            ${
                                isFilterOpen
                                    ? "translate-y-0 opacity-100 md:scale-100 md:-translate-y-0 pointer-events-auto"
                                    : "translate-y-full opacity-0 md:translate-y-0 md:-translate-x-4 md:scale-95 pointer-events-none"
                            }
                        `}
                    >
                        {/* Mobile Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 md:hidden">
                            <span className="font-semibold text-gray-800 px-2">Filters</span>
                            <button
                                onClick={() => setIsFilterOpen(false)}
                                className="bg-gray-50 hover:bg-gray-100 text-gray-500 p-2 rounded-full transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {/* Product Category */}
                            <div className="mb-8">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
                                    Product Category
                                </h3>
                                <div className="flex flex-col gap-3">
                                    {dto?.categories.map((cat) => (
                                        <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-gray-300 text-[#1B4D28] focus:ring-[#1B4D28] cursor-pointer"
                                                checked={selectedCategories.includes(cat.name)}
                                                onChange={() => handleCategoryToggle(cat.name)}
                                            />
                                            <span className="text-xs text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                                                {cat.name} ({cat.productCount})
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* State Origin */}
                            <div className="mb-8">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
                                    State / Region
                                </h3>
                                <div className="flex flex-col gap-3">
                                    {["Kano State", "Kaduna State", "Ogun State", "Oyo State"].map((state) => (
                                        <label key={state} className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-gray-300 text-[#1B4D28] focus:ring-[#1B4D28] cursor-pointer"
                                                checked={selectedStates.includes(state)}
                                                onChange={() => handleStateToggle(state)}
                                            />
                                            <span className="text-xs text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                                                {state}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Max Price Range */}
                            <div className="mb-8">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
                                    Max Price ($/Ton)
                                </h3>
                                <div className="relative pt-2 pb-2 px-1">
                                    <input
                                        type="range"
                                        min="500"
                                        max="10000"
                                        step="100"
                                        value={priceRange}
                                        onChange={(e) => setPriceRange(Number(e.target.value))}
                                        className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#1B4D28]"
                                    />
                                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500 font-medium">
                                        <span>₦500</span>
                                        <span className="font-bold text-[#1B4D28]">
                                            ₦{priceRange.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 mt-8">
                                <button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="bg-[#1B4D28] hover:bg-[#143d20] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors flex-1 shadow-sm"
                                >
                                    Apply Filters
                                </button>
                                <button
                                    onClick={handleResetFilters}
                                    className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
