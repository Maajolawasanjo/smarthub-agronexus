"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { products } from "@/lib/data/products";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/Toast";
import { useSearch } from "@/context/SearchContext";

export default function ProductsPage() {
    const { addToCart } = useCart();
    const { toast } = useToast();
    const { searchTerm } = useSearch();

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<number>(10000);
    const [inStockOnly, setInStockOnly] = useState(false);

    const handleCategoryToggle = (category: string) => {
        setSelectedCategories((prev) =>
            prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
        );
    };

    const handleCountryToggle = (country: string) => {
        setSelectedCountries((prev) =>
            prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]
        );
    };

    const handleResetFilters = () => {
        setSelectedCategories([]);
        setSelectedCountries([]);
        setPriceRange(10000);
        setInStockOnly(false);
        setIsFilterOpen(false);
    };

    // Derived Filtered List
    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.category.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
            const matchesCountry = selectedCountries.length === 0 || selectedCountries.includes(product.country);
            const matchesPrice = product.price <= priceRange;
            const matchesStock = !inStockOnly || product.stock > 0;

            return matchesSearch && matchesCategory && matchesCountry && matchesPrice && matchesStock;
        });
    }, [searchTerm, selectedCategories, selectedCountries, priceRange, inStockOnly]);


    return (
        <div className="w-full h-full flex flex-col pt-4 animate-in fade-in duration-500 relative bg-white pb-20 overflow-x-hidden">

            {/* Main Content Area */}
            <div className="w-full px-4 md:px-6 relative z-10 mx-auto max-w-[1600px]">

                {/* Header: Title & Filter Button */}
                <div className="flex items-center justify-between mb-6 relative z-20">
                    <h1 className="text-xl font-semibold text-gray-800 tracking-tight">All Product</h1>

                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`w-10 h-10 flex items-center justify-center border rounded-lg transition-colors shadow-sm relative z-50 ${isFilterOpen ? 'border-[#1B4D28] text-[#1B4D28] bg-green-50' : 'border-gray-300 text-gray-600 hover:bg-gray-50 bg-white'}`}
                        aria-label="Toggle Filters"
                        title="Toggle Filters"
                    >
                        <SlidersHorizontal size={18} />
                    </button>
                </div>

                {/* Grid Container & Filter Overlay Wrapper */}
                <div className="relative w-full">

                    {/* The Product Grid Wrapper */}
                    <div
                        className={`w-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isFilterOpen ? 'md:pr-[340px]' : 'pr-0'}`}
                    >
                        <div
                            className="grid gap-6 w-full pb-20"
                            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
                        >
                            {filteredProducts.length === 0 ? (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                                        <Search className="text-gray-400" size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">No products found</h3>
                                    <p className="text-sm text-gray-500 max-w-sm mb-6">We couldn't find any products matching your current filters. Try adjusting your search query or relaxing the filter criteria.</p>
                                    <button onClick={handleResetFilters} className="px-6 py-2 border border-[#1B4D28] text-[#1B4D28] font-medium rounded-full hover:bg-green-50 transition-colors">Clear all filters</button>
                                </div>
                            ) : (
                                filteredProducts.map((product) => (
                                    <div key={product.id} className="bg-white rounded-[20px] p-3 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">

                                        <Link href={`/dashboard/products/${product.id}`} className="block flex-grow group">
                                            {/* Image Container */}
                                            <div className="relative w-full aspect-[4/3] rounded-[16px] overflow-hidden bg-[#FAFAFA] border border-gray-50 mb-3 block">
                                                {/* Top Left Badge */}
                                                {product.stock > 0 && (
                                                    <div className="absolute top-2 left-2 z-10 bg-[#e6f4ea] text-[#1e8e3e] px-2.5 py-1 text-[10px] font-bold rounded-sm tracking-wide">
                                                        In Stock
                                                    </div>
                                                )}

                                                <Image
                                                    src={product.image}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="%23cccccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                                                        (e.target as HTMLImageElement).style.objectFit = 'contain';
                                                    }}
                                                />
                                            </div>

                                            {/* Title & Origin */}
                                            <div className="flex items-start justify-between mb-4 px-1">
                                                <h3 className="font-medium text-gray-800 text-[15px] leading-tight truncate pr-2 group-hover:text-[#1B4D28] transition-colors">{product.name}</h3>
                                                <div className="flex items-center gap-1 text-gray-500 shrink-0">
                                                    <MapPin size={12} strokeWidth={2.5} />
                                                    <span className="text-[12px] font-medium">{product.country}</span>
                                                </div>
                                            </div>
                                        </Link>

                                        {/* Price & Action */}
                                        <div className="mt-auto px-1 pb-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="font-extrabold text-gray-900 text-[20px] tracking-tight">${product.price.toLocaleString()}/</span>
                                                    <span className="font-extrabold text-gray-900 text-[14px]">Ton</span>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        addToCart(product);
                                                        toast(`${product.name} added to cart`, "success");
                                                    }}
                                                    className="bg-[#1B4D28] hover:bg-[#153b1e] text-white text-[12px] px-4 py-2.5 rounded-full flex items-center gap-1.5 transition-colors font-medium active:scale-95"
                                                >
                                                    <ShoppingCart size={14} />
                                                    Add to cart
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Mobile Backdrop */}
                    {isFilterOpen && (
                        <div
                            className="md:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm animate-in fade-in"
                            onClick={() => setIsFilterOpen(false)}
                        />
                    )}

                    {/* The Filter Panel */}
                    <div
                        className={`
                            fixed inset-x-0 bottom-0 z-50 md:absolute md:top-0 md:right-0 md:bottom-auto md:inset-x-auto
                            w-full md:w-[320px] max-h-[85vh] md:max-h-none flex flex-col
                            bg-white md:bg-white/95 md:backdrop-blur-xl md:border md:border-gray-100 rounded-t-2xl md:rounded-xl 
                            shadow-[0_-8px_30px_rgba(0,0,0,0.12)] md:shadow-[0_8px_30px_rgb(0,0,0,0.08)]
                            transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] md:origin-top-right md:z-30
                            ${isFilterOpen
                                ? 'translate-y-0 opacity-100 md:scale-100 md:-translate-y-0 pointer-events-auto'
                                : 'translate-y-full opacity-0 md:translate-y-0 md:-translate-x-4 md:scale-95 pointer-events-none'
                            }
                        `}
                    >
                        {/* Mobile Close Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 md:hidden">
                            <span className="font-semibold text-gray-800 px-2">Filters</span>
                            <button
                                onClick={() => setIsFilterOpen(false)}
                                className="bg-gray-50 hover:bg-gray-100 text-gray-500 p-2 rounded-full transition-colors"
                                aria-label="Close Filters"
                                title="Close Filters"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">

                            {/* Product Category Filter */}
                            <div className="mb-8">
                                <h3 className="text-[14px] font-semibold text-gray-800 mb-4 tracking-wide">Product Category</h3>
                                <div className="flex flex-col gap-3">
                                    {["Grains", "Fruits", "Seed", "Spices"].map(category => (
                                        <label key={category} className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-gray-300 text-[#1B4D28] focus:ring-[#1B4D28] cursor-pointer"
                                                checked={selectedCategories.includes(category === "Fruits" ? "Fruit" : category === "Seed" ? "Seeds" : category)}
                                                onChange={() => handleCategoryToggle(category === "Fruits" ? "Fruit" : category === "Seed" ? "Seeds" : category)}
                                            />
                                            <span className="text-[13px] text-gray-600 font-medium group-hover:text-gray-900 transition-colors">{category}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Country of Origin Filter */}
                            <div className="mb-8">
                                <h3 className="text-[14px] font-semibold text-gray-800 mb-4 tracking-wide">Country of origin</h3>
                                <div className="flex flex-col gap-3">
                                    {["Nigeria", "Ghana", "Ivory Coast", "Benin", "Togo"].map(country => (
                                        <label key={country} className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-gray-300 text-[#1B4D28] focus:ring-[#1B4D28] cursor-pointer"
                                                checked={selectedCountries.includes(country)}
                                                onChange={() => handleCountryToggle(country)}
                                            />
                                            <span className="text-[13px] text-gray-600 font-medium group-hover:text-gray-900 transition-colors">{country}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Growth Score range Filter (Price Simulation) */}
                            <div className="mb-8">
                                <h3 className="text-[14px] font-semibold text-gray-800 mb-4 tracking-wide">Growth Score range</h3>
                                <div className="relative pt-2 pb-2 px-1">
                                    <div className="relative h-1.5 w-full bg-blue-50/50 rounded-full">
                                        <input
                                            type="range"
                                            min="100"
                                            max="10000"
                                            step="100"
                                            value={priceRange}
                                            onChange={(e) => setPriceRange(Number(e.target.value))}
                                            className="absolute top-0 left-0 w-full h-1.5 bg-transparent appearance-none cursor-pointer accent-[#1B4D28] [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#1B4D28] [&::-webkit-slider-thumb]:bg-white"
                                        />
                                        <div
                                            className="absolute top-0 left-0 h-1.5 bg-[#1B4D28] rounded-full pointer-events-none"
                                            style={{ width: `${(priceRange / 10000) * 100}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between mt-4 text-[11px] text-gray-500 font-medium">
                                        <span>$100</span>
                                        <span>${priceRange < 10000 ? priceRange.toLocaleString() : "10,000"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Availability Filter */}
                            <div className="mb-8">
                                <h3 className="text-[14px] font-semibold text-gray-800 mb-4 tracking-wide">Availability</h3>
                                <div className="flex flex-col gap-3">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300 text-[#1B4D28] focus:ring-[#1B4D28] cursor-pointer"
                                            checked={inStockOnly}
                                            onChange={() => setInStockOnly(!inStockOnly)}
                                        />
                                        <span className="text-[13px] text-gray-600 font-medium group-hover:text-gray-900 transition-colors">In Stock</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300 text-gray-400 focus:ring-gray-400 cursor-not-allowed"
                                            disabled
                                        />
                                        <span className="text-[13px] text-gray-400 font-medium group-hover:text-gray-500 transition-colors cursor-not-allowed">Coming Soon</span>
                                    </label>
                                </div>
                            </div>

                            {/* Filter Actions */}
                            <div className="flex items-center gap-3 mt-10">
                                <button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="bg-[#1B4D28] hover:bg-[#153b1e] text-white px-5 py-2.5 rounded-md text-[13px] font-semibold transition-colors flex-1"
                                >
                                    Apply Filters
                                </button>
                                <button
                                    onClick={handleResetFilters}
                                    className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 px-5 py-2.5 rounded-md text-[13px] font-semibold transition-colors"
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
