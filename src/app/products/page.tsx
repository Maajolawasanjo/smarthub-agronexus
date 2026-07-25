"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { 
    ShieldCheck, 
    Search,
    Loader2
} from "lucide-react";
import { MarketplaceDTO, MarketplaceProductItemDTO } from "@/dto";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ProductsShowroom() {
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const [dto, setDto] = useState<MarketplaceDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchMarketplaceDataWithRetry() {
            setLoading(true);
            setError(null);

            const url = activeCategory !== "all" 
                ? `/api/products?category=${encodeURIComponent(activeCategory)}` 
                : "/api/products";
            const maxRetries = 3;
            let attempt = 0;

            while (attempt < maxRetries) {
                try {
                    const res = await fetch(url);
                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.error || "Failed to fetch marketplace catalog.");
                    }
                    const data: MarketplaceDTO = await res.json();
                    if (isMounted) {
                        setDto(data);
                        setError(null);
                    }
                    break;
                } catch (err: any) {
                    attempt++;
                    if (attempt >= maxRetries) {
                        if (isMounted) {
                            setError(err.message || "Error loading products.");
                        }
                    } else {
                        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
                    }
                }
            }

            if (isMounted) {
                setLoading(false);
            }
        }

        fetchMarketplaceDataWithRetry();

        return () => {
            isMounted = false;
        };
    }, [activeCategory]);

    const products = dto?.products || [];

    return (
        <main className="min-h-screen bg-[#EEF2EE] font-sans antialiased">
            <Navbar />

            {/* ─── Immersive Showroom Hero ─── */}
            <section className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden font-sans">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/80 z-10" />
                    <div className="absolute inset-0 bg-black/20 z-10" />
                    <Image
                        src="/landing-hero-drone.jpg"
                        alt="Agricultural drone spraying a green crop field"
                        fill
                        className="object-cover object-center"
                        priority
                    />
                </div>
                <div className="relative z-20 text-center px-6 max-w-5xl mx-auto flex flex-col items-center pt-24 pb-28 md:pb-24">
                    <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light text-white tracking-tight leading-[1.1] mb-6 md:mb-8 drop-shadow-2xl">
                        Premium B2B Produce. <br />
                        <span className="block mt-1 md:mt-2 text-[#4CAF50] font-normal">Directly Sourced & Certified</span>
                    </h1>
                    <p className="text-base sm:text-lg md:text-2xl text-gray-100 max-w-3xl mx-auto leading-relaxed drop-shadow-lg font-light mb-8 md:mb-12">
                        Browse our vetted catalog of Nigerian Cash Crops. Double-verified by third-party laboratories to meet strict EU, US, and Asian import standards.
                    </p>
                    <a href="#catalog" className="px-8 py-3 bg-[#4CAF50] hover:bg-[#43A047] text-white text-base md:text-lg font-medium rounded-full transition-all shadow-xl shadow-green-900/30 transform hover:scale-105 inline-block">
                        Explore Catalog
                    </a>
                </div>

                {/* Partner Logos Banner */}
                <div className="absolute bottom-5 z-20 w-full flex justify-center items-center px-4">
                    <div className="flex items-center justify-center gap-6 md:gap-14 flex-wrap max-w-xs sm:max-w-none">
                        <Image src="/logos/CARGIL LOGO.png" alt="Cargill" width={80} height={28} className="h-6 sm:h-7 md:h-9 w-auto object-contain mix-blend-screen opacity-90" />
                        <Image src="/logos/LDC.png" alt="Louis Dreyfus Company" width={65} height={28} className="h-6 sm:h-7 md:h-9 w-auto object-contain mix-blend-screen opacity-90" />
                        <Image src="/logos/CARGO.png" alt="Cargo Lab" width={80} height={28} className="h-6 sm:h-7 md:h-9 w-auto object-contain mix-blend-screen opacity-90" />
                        <Image src="/logos/VISTA.png" alt="Vista" width={70} height={28} className="h-6 sm:h-7 md:h-9 w-auto object-contain mix-blend-screen opacity-90" />
                        <Image src="/logos/kuehne-nagel-logo.png" alt="Kuehne+Nagel" width={90} height={28} className="h-6 sm:h-7 md:h-9 w-auto object-contain mix-blend-screen opacity-90" />
                    </div>
                </div>
            </section>

            {/* ─── Showroom Catalog ─── */}
            <section id="catalog" className="py-32 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-gray-200 pb-8 mb-16">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="font-handwriting text-[#4CAF50] text-2xl md:text-3xl italic">
                                Direct Sourcing & Verified Commodities
                            </span>
                            <span className="text-2xl">🌾</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] tracking-tight">Our Export Catalog</h2>
                        <p className="text-gray-600 text-lg leading-relaxed mt-2">Filter commodities by their primary export categories.</p>
                    </div>

                    {/* Dynamic Categories Tab from PostgreSQL */}
                    <div className="inline-flex flex-wrap bg-white/70 border border-gray-200/50 p-1 rounded-full shadow-md backdrop-blur-sm justify-center gap-1">
                        <button
                            onClick={() => setActiveCategory("all")}
                            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                                activeCategory === "all"
                                    ? "bg-[#1B4D28] text-white shadow-sm"
                                    : "text-gray-600 hover:text-[#1B4D28]"
                            }`}
                        >
                            All Commodities
                        </button>
                        {dto?.categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.name)}
                                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                                    activeCategory === cat.name
                                        ? "bg-[#1B4D28] text-white shadow-sm"
                                        : "text-gray-600 hover:text-[#1B4D28]"
                                }`}
                            >
                                {cat.name} ({cat.productCount})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="w-full py-24 flex flex-col items-center justify-center text-center">
                        <Loader2 size={36} className="text-[#1B4D28] animate-spin mb-4" />
                        <p className="text-gray-600 font-medium text-sm">Loading verified export catalog...</p>
                    </div>
                ) : error ? (
                    <div className="w-full py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-red-100 p-8">
                        <p className="text-red-600 font-semibold mb-4">{error}</p>
                        <Button onClick={() => setActiveCategory("all")} className="bg-[#1B4D28] text-white text-xs px-6 py-2 rounded-full">
                            Retry Connection
                        </Button>
                    </div>
                ) : products.length === 0 ? (
                    <div className="w-full py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                        <Search className="text-gray-400 mb-3" size={32} />
                        <h3 className="text-lg font-bold text-gray-800 mb-1">No commodities found</h3>
                        <p className="text-xs text-gray-500 max-w-sm mb-6">
                            There are currently no available export listings in this category.
                        </p>
                        <button
                            onClick={() => setActiveCategory("all")}
                            className="px-6 py-2 bg-[#1B4D28] text-white font-medium text-xs rounded-full hover:bg-[#143d20] transition-colors"
                        >
                            View All Commodities
                        </button>
                    </div>
                ) : (
                    /* Commodities Roster Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map((item) => (
                            <div 
                                key={item.id} 
                                className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                            >
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
                                            {item.category.name}
                                        </span>
                                        <span className={`absolute top-3 right-3 z-20 text-[9px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${
                                            item.inventory.stockStatus === "IN_STOCK" 
                                                ? "bg-emerald-600 text-white border-emerald-700" 
                                                : item.inventory.stockStatus === "LOW_STOCK" 
                                                    ? "bg-amber-500 text-white border-amber-600" 
                                                    : "bg-red-600 text-white border-red-700"
                                        }`}>
                                            {item.inventory.stockStatus.replace("_", " ")}
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
                                            {item.farmer.farmName} • {item.farmer.state}
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
                                                <p className="text-[10px] font-bold text-[#1B4D28] leading-tight truncate">{item.inventory.availableQty} {item.unit}s</p>
                                            </div>
                                            <div className="bg-[#EEF2EE]/45 border border-gray-100/50 rounded-xl p-2.5">
                                                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Farm Location</p>
                                                <p className="text-[10px] font-bold text-gray-800 leading-tight truncate">{item.farmer.state}</p>
                                            </div>
                                            <div className="bg-[#EEF2EE]/45 border border-gray-100/50 rounded-xl p-2.5">
                                                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Verification</p>
                                                <p className="text-[10px] font-bold text-[#1B4D28] leading-tight truncate">{item.farmer.verificationStatus}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Footer Actions */}
                                <div className="px-5 pb-5 sm:px-6 sm:pb-6 flex flex-col gap-2">
                                    <Link href={`/dashboard/products/${item.id}`} className="w-full">
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
                        ))}
                    </div>
                )}
            </section>

            {/* ─── Seasonality Calendar Chart ─── */}
            <section className="py-32 bg-[#1B4D28] text-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="text-center mb-16">
                        <span className="font-handwriting text-[#81C784] text-2xl md:text-3xl italic block mb-2">
                            Harvest & Shipping Schedules
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                            Nigerian Shipping & Sourcing Calendar
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

                            {/* Seasonality rows */}
                            {products.slice(0, 5).map((item, idx) => (
                                <div key={idx} className="grid grid-cols-12 items-center py-2">
                                    <div className="col-span-3">
                                        <p className="font-extrabold text-sm leading-tight">{item.name}</p>
                                        <p className="text-[10px] text-gray-400 font-semibold mt-1">{item.farmer.farmName}</p>
                                    </div>
                                    <div className="col-span-9 grid grid-cols-12 h-6 relative bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        {months.map((m, mIdx) => (
                                            <div 
                                                key={mIdx} 
                                                className={`h-full border-r border-white/5 transition-all duration-300 ${
                                                    mIdx >= 2 && mIdx <= 10 ? "bg-[#4CAF50] shadow-inner shadow-green-950/20" : ""
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
                        Quality & Verification
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
