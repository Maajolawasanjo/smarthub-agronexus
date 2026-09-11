"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Search } from "lucide-react";
import {
    SHOWCASE_PRODUCTS,
    SHOWCASE_CATEGORIES,
    type ShowcaseProduct,
} from "@/lib/data/showcase-products";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ProductsShowroom() {
    const [activeCategory, setActiveCategory] = useState<string>("All Commodities");

    const filteredProducts = useMemo(() => {
        if (activeCategory === "All Commodities") return SHOWCASE_PRODUCTS;
        return SHOWCASE_PRODUCTS.filter((p) => p.category === activeCategory);
    }, [activeCategory]);

    /** Count products per category for the tab badges */
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const cat of SHOWCASE_CATEGORIES) {
            counts[cat] =
                cat === "All Commodities"
                    ? SHOWCASE_PRODUCTS.length
                    : SHOWCASE_PRODUCTS.filter((p) => p.category === cat).length;
        }
        return counts;
    }, []);

    return (
        <main className="min-h-screen bg-[#EEF2EE] font-sans antialiased">
            <Navbar />

            {/* ─── Products Hero (Dark Gradient) ─── */}
            <section className="relative w-full flex flex-col items-center justify-center overflow-hidden font-sans bg-gradient-to-br from-[#0a1f0f] via-[#112818] to-[#0d0d0d] pt-40 pb-24 md:pt-48 md:pb-32">
                {/* Subtle decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#4CAF50]/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#1B4D28]/10 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 text-center px-6 max-w-5xl mx-auto flex flex-col items-center">
                    <span className="inline-block px-4 py-1.5 bg-[#4CAF50]/10 border border-[#4CAF50]/20 rounded-full text-[#81C784] text-xs font-bold tracking-wider uppercase mb-8">
                        🌿 Verified Export Commodities
                    </span>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white tracking-tight leading-[1.15] mb-6 md:mb-8">
                        Our Export Catalog
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed font-light mb-8 md:mb-10">
                        Browse our vetted catalog of Nigerian Cash Crops. Double-verified by third-party laboratories to meet strict EU, US, and Asian import standards.
                    </p>
                    <a href="#catalog" className="px-8 py-3 bg-[#4CAF50] hover:bg-[#43A047] text-white text-base md:text-lg font-medium rounded-full transition-all shadow-xl shadow-green-900/30 transform hover:scale-105 inline-block">
                        Explore Catalog ↓
                    </a>
                </div>

                {/* Partner Logos */}
                <div className="relative z-10 mt-14 w-full flex flex-col items-center px-4">
                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-4">Trusted by global commodity traders</p>
                    <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap">
                        <Image src="/logos/CARGIL LOGO.png" alt="Cargill" width={90} height={32} className="h-7 md:h-8 w-auto object-contain brightness-0 invert opacity-50 hover:opacity-80 transition-opacity" />
                        <Image src="/logos/LDC.png" alt="Louis Dreyfus Company" width={75} height={32} className="h-7 md:h-8 w-auto object-contain brightness-0 invert opacity-50 hover:opacity-80 transition-opacity" />
                        <Image src="/logos/CARGO.png" alt="Cargo Lab" width={90} height={32} className="h-7 md:h-8 w-auto object-contain brightness-0 invert opacity-50 hover:opacity-80 transition-opacity" />
                        <Image src="/logos/VISTA.png" alt="Vista" width={80} height={32} className="h-7 md:h-8 w-auto object-contain brightness-0 invert opacity-50 hover:opacity-80 transition-opacity" />
                        <Image src="/logos/kuehne-nagel-logo.png" alt="Kuehne+Nagel" width={100} height={32} className="h-7 md:h-8 w-auto object-contain brightness-0 invert opacity-50 hover:opacity-80 transition-opacity" />
                    </div>
                </div>
            </section>

            {/* ─── Showroom Catalog ─── */}
            <section id="catalog" className="py-32 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-gray-200 pb-8 mb-16">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="font-handwriting text-[#4CAF50] text-2xl md:text-3xl italic">
                                Direct Sourcing &amp; Verified Commodities
                            </span>
                            <span className="text-2xl">🌾</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] tracking-tight">Our Export Catalog</h2>
                        <p className="text-gray-600 text-lg leading-relaxed mt-2">Filter commodities by their primary export categories.</p>
                    </div>

                    {/* Category Tabs */}
                    <div className="inline-flex flex-wrap bg-white/70 border border-gray-200/50 p-1 rounded-full shadow-md backdrop-blur-sm justify-center gap-1">
                        {SHOWCASE_CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                                    activeCategory === cat
                                        ? "bg-[#1B4D28] text-white shadow-sm"
                                        : "text-gray-600 hover:text-[#1B4D28]"
                                }`}
                            >
                                {cat} ({categoryCounts[cat]})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                {filteredProducts.length === 0 ? (
                    <div className="w-full py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                        <Search className="text-gray-400 mb-3" size={32} />
                        <h3 className="text-lg font-bold text-gray-800 mb-1">No commodities found</h3>
                        <p className="text-xs text-gray-500 max-w-sm mb-6">
                            There are currently no available export listings in this category.
                        </p>
                        <button
                            onClick={() => setActiveCategory("All Commodities")}
                            className="px-6 py-2 bg-[#1B4D28] text-white font-medium text-xs rounded-full hover:bg-[#143d20] transition-colors"
                        >
                            View All Commodities
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredProducts.map((item) => (
                            <ProductCard key={item.id} item={item} />
                        ))}
                    </div>
                )}
            </section>

            {/* ─── Seasonality Calendar Chart ─── */}
            <section className="py-32 bg-[#1B4D28] text-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="text-center mb-16">
                        <span className="font-handwriting text-[#81C784] text-2xl md:text-3xl italic block mb-2">
                            Harvest &amp; Shipping Schedules
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                            Nigerian Shipping &amp; Sourcing Calendar
                        </h2>
                        <p className="text-gray-200 text-lg max-w-2xl mx-auto font-light leading-relaxed">
                            Plan your annual importing schedules. The green bars indicate peak harvesting, drying, and vessel loading seasons at Nigerian ports.
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-3xl overflow-x-auto shadow-2xl backdrop-blur-md">
                        <div className="min-w-[760px] space-y-6">
                            {/* Months Header row */}
                            <div className="grid grid-cols-12 border-b border-white/10 pb-4">
                                <div className="col-span-3 text-xs font-bold uppercase text-gray-300">Commodity Name</div>
                                <div className="col-span-9 grid grid-cols-12 text-center text-xs font-bold uppercase text-gray-300">
                                    {months.map(m => (
                                        <div key={m}>{m}</div>
                                    ))}
                                </div>
                            </div>

                            {/* Seasonality rows — show first 8 products */}
                            {SHOWCASE_PRODUCTS.slice(0, 8).map((item) => (
                                <div key={item.id} className="grid grid-cols-12 items-center py-2">
                                    <div className="col-span-3">
                                        <p className="font-extrabold text-sm leading-tight">{item.name}</p>
                                        <p className="text-[10px] text-gray-400 font-semibold mt-1">{item.farmName}</p>
                                    </div>
                                    <div className="col-span-9 grid grid-cols-12 h-6 relative bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        {months.map((_m, mIdx) => (
                                            <div
                                                key={mIdx}
                                                className={`h-full border-r border-white/5 transition-all duration-300 ${
                                                    item.seasonMonths.includes(mIdx) ? "bg-[#4CAF50] shadow-inner shadow-green-950/20" : ""
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Premium Spec Verification Banner ─── */}
            <section className="py-32 px-4 sm:px-6 md:px-12 max-w-5xl mx-auto text-center">
                <div className="bg-white border border-gray-200/60 rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col items-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-[#1B4D28] mb-6">
                        <ShieldCheck size={32} />
                    </div>
                    <span className="font-handwriting text-[#4CAF50] text-2xl md:text-3xl italic block mb-2">
                        Quality &amp; Verification
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] tracking-tight mb-4">
                        Quality Guaranteed by Independent Labs
                    </h2>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
                        Importers have full access to third-party certifications (moisture levels, admixture counts, oil content percentages) generated on-site by international auditing companies.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <Link href="/signup">
                            <Button className="bg-[#4CAF50] hover:bg-[#43A047] text-white px-8 py-3 rounded-full text-base font-medium shadow-lg shadow-green-900/20">
                                Open Sourcing Account
                            </Button>
                        </Link>
                        <Link href="/contact">
                            <Button className="bg-transparent hover:bg-gray-50 border-2 border-gray-300 text-gray-700 px-8 py-2.5 rounded-full text-base font-medium">
                                Contact Trade Desk
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}

/** Individual product card component */
function ProductCard({ item }: { item: ShowcaseProduct }) {
    return (
        <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div>
                {/* Card Top Image */}
                <div className="relative h-48 w-full bg-[#EEF2EE] overflow-hidden">
                    <div className="absolute inset-0 bg-[#1B4D28]/15 z-10 group-hover:bg-[#1B4D28]/5 transition-colors duration-300" />
                    <Image
                        src={item.primaryImage}
                        alt={item.name}
                        fill
                        className="object-cover scale-100 group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 z-20 bg-[#1B4D28] text-white text-[9px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full border border-[#2C5E39]">
                        {item.category}
                    </span>
                    <span className={`absolute top-3 right-3 z-20 text-[9px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${
                        item.stockStatus === "IN_STOCK"
                            ? "bg-emerald-600 text-white border-emerald-700"
                            : "bg-amber-500 text-white border-amber-600"
                    }`}>
                        {item.stockStatus.replace("_", " ")}
                    </span>
                </div>

                {/* Content Details */}
                <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 leading-tight group-hover:text-[#1B4D28] transition-colors">
                            {item.name}
                        </h3>
                    </div>
                    <p className="text-[11px] text-[#739072] font-semibold italic mb-3">
                        {item.farmName} • {item.state}
                    </p>

                    <p className="text-gray-500 text-xs leading-relaxed mb-4 font-light line-clamp-3">
                        {item.description}
                    </p>

                    {/* Specifications Grid */}
                    <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-4">
                        <div className="bg-[#EEF2EE]/45 border border-gray-100/50 rounded-xl p-2.5">
                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Price</p>
                            <p className="text-[10px] font-bold text-gray-800 leading-tight truncate">${item.price.toLocaleString()} / {item.unit}</p>
                        </div>
                        <div className="bg-[#EEF2EE]/45 border border-gray-100/50 rounded-xl p-2.5">
                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-0.5 truncate">Available Quantity</p>
                            <p className="text-[10px] font-bold text-[#1B4D28] leading-tight truncate">{item.availableQty} {item.unit}s</p>
                        </div>
                        <div className="bg-[#EEF2EE]/45 border border-gray-100/50 rounded-xl p-2.5">
                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Farm Location</p>
                            <p className="text-[10px] font-bold text-gray-800 leading-tight truncate">{item.state}</p>
                        </div>
                        <div className="bg-[#EEF2EE]/45 border border-gray-100/50 rounded-xl p-2.5">
                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Verification</p>
                            <p className="text-[10px] font-bold text-[#1B4D28] leading-tight truncate">{item.verificationStatus}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card Footer Actions */}
            <div className="px-5 pb-5 sm:px-6 sm:pb-6 flex flex-col gap-2">
                <Link href="/signup" className="w-full">
                    <Button className="bg-[#1B4D28] hover:bg-[#143d20] border border-[#2C5E39] text-white w-full py-2 rounded-full text-[11px] font-bold shadow-md">
                        View Product Details
                    </Button>
                </Link>
                <Link href="/signup" className="w-full">
                    <Button className="bg-transparent hover:bg-green-50/50 border border-[#1B4D28] text-[#1B4D28] w-full py-1.5 rounded-full text-[11px] font-bold">
                        Open Sourcing Account
                    </Button>
                </Link>
            </div>
        </div>
    );
}
