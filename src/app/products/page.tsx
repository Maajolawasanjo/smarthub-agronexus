"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { 
    CheckCircle2, 
    ArrowRight, 
    ShieldCheck, 
    Search, 
    Award,
    Calendar,
    Globe2,
    Check,
    Coins
} from "lucide-react";

interface CropDetail {
    name: string;
    scientificName: string;
    category: "nuts" | "seeds" | "fresh";
    grade: string;
    moisture: string;
    admixture: string;
    defects: string;
    specificationKey: string;
    specValue: string;
    description: string;
    seasonStart: string;
    seasonEnd: string;
    packing: string;
    image: string;
}

const commodities: CropDetail[] = [
    {
        name: "Cleaned Natural Sesame Seeds",
        scientificName: "Sesamum indicum",
        category: "seeds",
        grade: "Premium Double-Cleaned (99.5%)",
        moisture: "Max 6.0%",
        admixture: "Max 0.5% (Double Cleaned)",
        defects: "Other Color Seeds: Max 1.5%",
        specificationKey: "Oil Content",
        specValue: "Min 51% Oil Yield",
        description: "Grown in Kano, Jigawa, and Benue states. Double-cleaned via modern color sorters to ensure 99.5% purity, rich nuttiness, and exceptional oil yields for premium pressing.",
        seasonStart: "November",
        seasonEnd: "March",
        packing: "50kg Multi-layer Paper/PP Bags",
        image: "/images/products/sesame_seeds.png"
    },
    {
        name: "Premium Sweet Dried Dates (Debino)",
        scientificName: "Phoenix dactylifera",
        category: "nuts",
        grade: "A Grade Dry Dates",
        moisture: "Max 12.0%",
        admixture: "Max 0.1%",
        defects: "Broken: Max 2.0%",
        specificationKey: "Sugar Content",
        specValue: "Min 65% Fructose",
        description: "Sun-dried organic dates sourced from the arid regions of Jigawa and Katsina. Exceptionally sweet, chewy, rich in fiber, and stored under strict temperature controls for export quality.",
        seasonStart: "August",
        seasonEnd: "December",
        packing: "25kg Cartons / Mesh Bags",
        image: "/images/products/dates.jpg"
    },
    {
        name: "High-Grade Processed Cassava Flour",
        scientificName: "Manihot esculenta",
        category: "fresh",
        grade: "Superfine HQCF (Export Grade)",
        moisture: "Max 10.0%",
        admixture: "Max 0.1% Starch Purity",
        defects: "Ash Content: Max 0.5%",
        specificationKey: "Starch Content",
        specValue: "Min 70% Starch Yield",
        description: "Gluten-free, high-quality cassava flour processed within 24 hours of harvest in Ogun and Edo. 100% white, odorless, and perfectly milled for global baking and starch industries.",
        seasonStart: "January",
        seasonEnd: "December",
        packing: "50kg Kraft Paper Bags",
        image: "/images/products/flour.png"
    },
    {
        name: "Premium Raw Cashew Nuts (RCN)",
        scientificName: "Anacardium occidentale",
        category: "nuts",
        grade: "Export Grade A (KOR 48-52)",
        moisture: "Max 8.0%",
        admixture: "Max 0.25%",
        defects: "Max 8.0% (Nut Count: 180-200/kg)",
        specificationKey: "Out-turn Rate (KOR)",
        specValue: "48 - 52 lbs",
        description: "Directly sourced from Oyo, Kogi, and Enugu farming groups. Our cashews are dried organically, graded rigorously, and packed in eco-safe jute bags to preserve the perfect kernel out-turn rate during transit.",
        seasonStart: "February",
        seasonEnd: "June",
        packing: "80kg Export Jute Bags",
        image: "/images/products/cashew_nut.png"
    },
    {
        name: "Organic Single-Origin Cocoa Beans",
        scientificName: "Theobroma cacao",
        category: "nuts",
        grade: "Main Crop Grade 1 (FOB specs)",
        moisture: "Max 7.5%",
        admixture: "Max 0.5%",
        defects: "Slaty: Max 3.0% | Mouldy: Max 3.0%",
        specificationKey: "Bean Count",
        specValue: "95 - 100 beans/100g",
        description: "Premium fermented and sun-dried cocoa beans sourced from verified smallholders in Ondo and Cross River. Possesses optimal butter content and low FFA levels, ideal for global chocolatiers.",
        seasonStart: "October",
        seasonEnd: "March",
        packing: "64kg Export Jute Bags",
        image: "/images/products/cocoa_beans.png"
    },
    {
        name: "Premium Split Dried Ginger",
        scientificName: "Zingiber officinale",
        category: "seeds",
        grade: "A Grade Export Split",
        moisture: "Max 9.0%",
        admixture: "Max 1.0%",
        defects: "Extraneous Matter: Max 1.0%",
        specificationKey: "Oil Content",
        specValue: "Min 1.5% Essential Oil",
        description: "Highly pungent, sun-dried split ginger from Southern Kaduna. Graded meticulously to eliminate dust and mold, retaining its rich flavor, high oleoresin yields, and long shelf life.",
        seasonStart: "November",
        seasonEnd: "April",
        packing: "40kg PP Bags",
        image: "/images/products/ginger_spices.png"
    },
    {
        name: "Export-Grade Hand-Selected Groundnuts",
        scientificName: "Arachis hypogaea",
        category: "nuts",
        grade: "Bold Kernel Grade 1",
        moisture: "Max 7.0%",
        admixture: "Max 0.5%",
        defects: "Aflatoxin: Max 4ppb (EU Standard)",
        specificationKey: "Oil Content",
        specValue: "Min 48% Oil Yield",
        description: "Carefully hand-sorted bold peanut kernels grown in the fertile plains of Gombe and Taraba. Tested strictly to meet international aflatoxin thresholds, ensuring top peanut-butter grade quality.",
        seasonStart: "October",
        seasonEnd: "February",
        packing: "50kg Eco-friendly Jute Bags",
        image: "/images/products/peanuts.png"
    },
    {
        name: "Fresh Premium Green Cabbages",
        scientificName: "Brassica oleracea var. capitata",
        category: "fresh",
        grade: "Export Grade AAA (Fresh Cut)",
        moisture: "92% Hydration Level",
        admixture: "Zero Foreign Matter",
        defects: "Outer leaf damage: Max 1%",
        specificationKey: "Weight range",
        specValue: "1.5 - 2.5 kg per head",
        description: "Crisp, compact, and organically grown green cabbages from the volcanic soils of the Jos Plateau. Harvested at dawn and immediate cold-chain packed to guarantee fresh delivery.",
        seasonStart: "January",
        seasonEnd: "December",
        packing: "15kg Ventilated Crates",
        image: "/images/products/cabbage.jpg"
    },
    {
        name: "Sweet Organic Seedless Watermelons",
        scientificName: "Citrullus lanatus",
        category: "fresh",
        grade: "Premium Grade A",
        moisture: "91% Water Content",
        admixture: "Zero Damage",
        defects: "Scratches: Max 2%",
        specificationKey: "Sugar Brix Level",
        specValue: "Min 11% Brix Sugar",
        description: "Juicy, exceptionally sweet seedless watermelons from irrigated riverbeds in Kebbi. Loaded with Lycopene, highly uniform in size, and packed in heavy-duty cardboard bins.",
        seasonStart: "October",
        seasonEnd: "April",
        packing: "350kg Cardboard Octabins",
        image: "/images/products/watermelon.jpg"
    }
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ProductsShowroom() {
    const [activeCategory, setActiveCategory] = useState<"all" | "nuts" | "seeds" | "fresh">("all");

    // Filter commodities
    const filteredCommodities = useMemo(() => {
        if (activeCategory === "all") return commodities;
        return commodities.filter(c => c.category === activeCategory);
    }, [activeCategory]);

    return (
        <main className="min-h-screen bg-[#EEF2EE] font-sans antialiased">
            <Navbar />

            {/* ─── Immersive Showroom Hero ─── */}
            <section className="relative min-h-[96vh] w-full flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-[#1B4D28]/90 z-10 mix-blend-multiply" />
                    <Image
                        src="/landing-hero-drone.jpg"
                        alt="Agricultural drone spraying a green crop field"
                        fill
                        className="object-cover object-center"
                        priority
                    />
                </div>
                <div className="relative z-20 text-center px-6 max-w-4xl mx-auto flex flex-col items-center pt-44 pb-28">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-2xl leading-tight">
                        Premium B2B Produce. <br />
                        <span className="text-[#81C784]">Directly Sourced & Certified.</span>
                    </h1>
                    <p className="text-base sm:text-lg text-gray-200 max-w-2xl mx-auto leading-relaxed drop-shadow-lg font-light">
                        Browse our vetted catalog of Nigerian Cash Crops. Double-verified by third-party laboratories to meet strict EU, US, and Asian import standards.
                    </p>
                </div>
            </section>

            {/* ─── Showroom Catalog ─── */}
            <section className="py-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-gray-200 pb-8 mb-16">
                    <div>
                        <h2 className="text-[#1B4D28] text-3xl font-extrabold tracking-tight">Our Export Catalog</h2>
                        <p className="text-gray-500 text-sm sm:text-base mt-2">Filter commodities by their primary export categories.</p>
                    </div>

                    {/* Interactive Categories Tab */}
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
                        <button
                            onClick={() => setActiveCategory("nuts")}
                            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                                activeCategory === "nuts"
                                    ? "bg-[#1B4D28] text-white shadow-sm"
                                    : "text-gray-600 hover:text-[#1B4D28]"
                            }`}
                        >
                            Nuts & Cocoa
                        </button>
                        <button
                            onClick={() => setActiveCategory("seeds")}
                            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                                activeCategory === "seeds"
                                    ? "bg-[#1B4D28] text-white shadow-sm"
                                    : "text-gray-600 hover:text-[#1B4D28]"
                            }`}
                        >
                            Seeds & Grains
                        </button>
                        <button
                            onClick={() => setActiveCategory("fresh")}
                            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                                activeCategory === "fresh"
                                    ? "bg-[#1B4D28] text-white shadow-sm"
                                    : "text-gray-600 hover:text-[#1B4D28]"
                            }`}
                        >
                            Fresh & Processed
                        </button>
                    </div>
                </div>

                {/* Commodities Roster Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredCommodities.map((item, idx) => (
                        <div 
                            key={idx} 
                            className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                        >
                            <div>
                                {/* Card Top Image */}
                                <div className="relative h-48 w-full bg-[#EEF2EE] overflow-hidden">
                                    <div className="absolute inset-0 bg-[#1B4D28]/15 z-10 group-hover:bg-[#1B4D28]/5 transition-colors duration-300" />
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-cover scale-100 group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <span className="absolute top-3 left-3 z-20 bg-[#1B4D28] text-white text-[9px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full border border-[#2C5E39]">
                                        {item.category === "nuts" 
                                            ? "Nuts & Cocoa" 
                                            : item.category === "seeds" 
                                                ? "Seeds & Grains" 
                                                : "Fresh & Processed"}
                                    </span>
                                </div>

                                {/* Content Details */}
                                <div className="p-5 sm:p-6">
                                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 leading-tight group-hover:text-[#1B4D28] transition-colors">
                                            {item.name}
                                        </h3>
                                    </div>
                                    <p className="text-[11px] text-[#739072] font-semibold italic mb-3">{item.scientificName}</p>
                                    
                                    <p className="text-gray-500 text-xs leading-relaxed mb-4 font-light line-clamp-3">
                                        {item.description}
                                    </p>

                                    {/* Specifications Grid */}
                                    <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-4">
                                        <div className="bg-[#EEF2EE]/45 border border-gray-100/50 rounded-xl p-2.5">
                                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Grade</p>
                                            <p className="text-[10px] font-bold text-gray-800 leading-tight truncate" title={item.grade}>{item.grade}</p>
                                        </div>
                                        <div className="bg-[#EEF2EE]/45 border border-gray-100/50 rounded-xl p-2.5">
                                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-0.5 truncate">{item.specificationKey}</p>
                                            <p className="text-[10px] font-bold text-[#1B4D28] leading-tight truncate" title={item.specValue}>{item.specValue}</p>
                                        </div>
                                        <div className="bg-[#EEF2EE]/45 border border-gray-100/50 rounded-xl p-2.5">
                                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Moisture</p>
                                            <p className="text-[10px] font-bold text-gray-800 leading-tight truncate">{item.moisture}</p>
                                        </div>
                                        <div className="bg-[#EEF2EE]/45 border border-gray-100/50 rounded-xl p-2.5">
                                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Defects</p>
                                            <p className="text-[10px] font-bold text-gray-800 leading-tight truncate" title={item.defects}>{item.defects}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="px-5 pb-5 sm:px-6 sm:pb-6 flex flex-col gap-2">
                                <Link href="/signup" className="w-full">
                                    <Button className="bg-[#1B4D28] hover:bg-[#143d20] border border-[#2C5E39] text-white w-full py-2 rounded-full text-[11px] font-bold shadow-md">
                                        Open Sourcing Account
                                    </Button>
                                </Link>
                                <Link href="/contact" className="w-full">
                                    <Button className="bg-transparent hover:bg-green-50/50 border border-[#1B4D28] text-[#1B4D28] w-full py-1.5 rounded-full text-[11px] font-bold">
                                        Request Spec Sheet
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── Seasonality Calendar Chart ─── */}
            <section className="py-24 bg-[#1B4D28] text-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="text-center mb-16">
                        <span className="bg-white/10 text-[#81C784] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                            Harvest Seasonality Map
                        </span>
                        <h2 className="text-3xl md:text-5xl font-extrabold mt-4 mb-4">
                            Nigerian Shipping & Sourcing Calendar
                        </h2>
                        <p className="text-gray-300 text-sm sm:text-base max-w-xl mx-auto font-light">
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
                            {commodities.map((item, idx) => {
                                const startIdx = months.indexOf(item.seasonStart.substring(0, 3));
                                const endIdx = months.indexOf(item.seasonEnd.substring(0, 3));
                                
                                return (
                                    <div key={idx} className="grid grid-cols-12 items-center py-2">
                                        <div className="col-span-3">
                                            <p className="font-extrabold text-sm leading-tight">{item.name}</p>
                                            <p className="text-[10px] text-gray-400 font-semibold mt-1">{item.packing}</p>
                                        </div>
                                        <div className="col-span-9 grid grid-cols-12 h-6 relative bg-white/5 rounded-full overflow-hidden border border-white/5">
                                            {months.map((m, mIdx) => {
                                                // Handle standard wrapped seasons e.g. Oct to Mar
                                                let isHarvest = false;
                                                if (startIdx <= endIdx) {
                                                    isHarvest = mIdx >= startIdx && mIdx <= endIdx;
                                                } else {
                                                    isHarvest = mIdx >= startIdx || mIdx <= endIdx;
                                                }

                                                return (
                                                    <div 
                                                        key={mIdx} 
                                                        className={`h-full border-r border-white/5 transition-all duration-300 ${
                                                            isHarvest ? "bg-[#4CAF50] shadow-inner shadow-green-950/20" : ""
                                                        }`} 
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Premium Spec Verification Banner ─── */}
            <section className="py-24 px-4 sm:px-6 md:px-12 max-w-5xl mx-auto text-center">
                <div className="bg-white border border-gray-200/60 rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col items-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-[#1B4D28] mb-6">
                        <ShieldCheck size={32} />
                    </div>
                    <h2 className="text-[#1B4D28] text-3xl font-extrabold tracking-tight mb-4">
                        Quality Guaranteed by Independent Labs
                    </h2>
                    <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-8">
                        Importers have full access to third-party certifications (moisture levels, admixture counts, oil content percentages) generated on-site by international auditing companies (e.g. SGS, Eye3) uploaded straight to your billing wallet.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <Link href="/signup">
                            <Button className="bg-[#1B4D28] hover:bg-[#143d20] border border-[#2C5E39] text-white px-8 py-3 rounded-full text-sm font-bold shadow-lg">
                                Open Sourcing Account
                            </Button>
                        </Link>
                        <Link href="/contact">
                            <Button className="bg-transparent hover:bg-gray-50 border-2 border-gray-300 text-gray-700 px-8 py-2.5 rounded-full text-sm font-bold">
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
