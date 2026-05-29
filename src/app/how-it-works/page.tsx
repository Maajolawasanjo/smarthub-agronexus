"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { 
    CheckCircle, 
    ArrowRight, 
    TrendingUp, 
    DollarSign, 
    Scale, 
    Ship, 
    ShieldCheck, 
    Search,
    ChevronDown,
    Building2,
    Calendar,
    Award
} from "lucide-react";

// --- Product Baselines for Cost Estimator ---
interface ProductConfig {
    name: string;
    basePricePerTon: number; // in USD
    logisticsBasePerTon: number; // in USD
    qualityControlFeePerTon: number; // in USD
}

const products: Record<string, ProductConfig> = {
    cashew: {
        name: "Premium Raw Cashew Nuts (RCN)",
        basePricePerTon: 1250,
        logisticsBasePerTon: 180,
        qualityControlFeePerTon: 30
    },
    cocoa: {
        name: "Organic Single-Origin Cocoa Beans",
        basePricePerTon: 2450,
        logisticsBasePerTon: 220,
        qualityControlFeePerTon: 45
    },
    ginger: {
        name: "Premium Split Dried Ginger",
        basePricePerTon: 980,
        logisticsBasePerTon: 160,
        qualityControlFeePerTon: 25
    },
    sesame: {
        name: "Cleaned Natural Sesame Seeds",
        basePricePerTon: 1420,
        logisticsBasePerTon: 190,
        qualityControlFeePerTon: 35
    }
};

const destinationFactors: Record<string, { label: string; multiplier: number }> = {
    asia: { label: "Asia-Pacific Ports (e.g. Vietnam, India)", multiplier: 1.0 },
    europe: { label: "European Union Ports (e.g. Rotterdam, Hamburg)", multiplier: 1.15 },
    americas: { label: "North American Ports (e.g. Houston, New York)", multiplier: 1.25 }
};

export default function HowItWorks() {
    // Role Perspective Switcher
    const [role, setRole] = useState<"buyer" | "farmer">("buyer");
    
    // Cost Estimator States
    const [selectedProduct, setSelectedProduct] = useState<string>("cashew");
    const [quantity, setQuantity] = useState<number>(50); // in metric tonnes
    const [destination, setDestination] = useState<string>("asia");

    // Dynamic Calculations
    const calculations = useMemo(() => {
        const prod = products[selectedProduct];
        const factor = destinationFactors[destination].multiplier;

        const rawGoodsCost = prod.basePricePerTon * quantity;
        const qualityControlCost = prod.qualityControlFeePerTon * quantity;
        const logisticsCost = prod.logisticsBasePerTon * factor * quantity;
        
        // Dynamic commission rate: slide scales based on quantity
        // Large volume gets a minor fee discount (4% down to 2.5%)
        let commissionRate = 0.04;
        if (quantity >= 100 && quantity < 250) commissionRate = 0.032;
        if (quantity >= 250) commissionRate = 0.025;

        const commissionCost = rawGoodsCost * commissionRate;
        const totalCost = rawGoodsCost + qualityControlCost + logisticsCost + commissionCost;

        return {
            rawGoodsCost,
            qualityControlCost,
            logisticsCost,
            commissionRate: (commissionRate * 100).toFixed(1),
            commissionCost,
            totalCost
        };
    }, [selectedProduct, quantity, destination]);

    // Accordion FAQ State
    const [activeFaq, setActiveFaq] = useState<number | null>(null);

    const toggleFaq = (index: number) => {
        setActiveFaq(activeFaq === index ? null : index);
    };

    return (
        <main className="min-h-screen bg-[#EEF2EE] font-sans antialiased">
            <Navbar />

            {/* ─── Premium Glassmorphic Hero ─── */}
            <section className="relative min-h-[96vh] w-full flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-black/60 z-10" />
                    <Image
                        src="/how-it-works-hero.jpg"
                        alt="Creative workspace desk flatlay with plants and laptop"
                        fill
                        className="object-cover object-center"
                        priority
                    />
                </div>
                <div className="relative z-20 text-center px-6 max-w-4xl mx-auto flex flex-col items-center pt-44 pb-28">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-2xl leading-tight">
                        Transparent Sourcing. <br />
                        <span className="text-[#81C784]">
                            Globally Verified Sourcing.
                        </span>
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-gray-200 max-w-2xl mx-auto leading-relaxed drop-shadow-lg mb-10 font-light">
                        Agrochain connects international grain, nut, and oilseed importers directly to verified farms in Nigeria. Explore our visual workflow below.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <a href="#workflow">
                            <Button className="bg-[#1B4D28] hover:bg-[#143d20] border border-[#2C5E39] text-white px-8 py-3.5 rounded-full text-base font-semibold shadow-2xl transition-all hover:scale-105">
                                Explore Workflow
                            </Button>
                        </a>
                        <a href="#estimator">
                            <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-3.5 rounded-full text-base font-medium shadow-xl backdrop-blur-sm transition-all hover:scale-105">
                                Cost Estimator
                            </Button>
                        </a>
                    </div>
                </div>
            </section>

            {/* ─── Interactive Role Perspective Switcher ─── */}
            <section id="workflow" className="py-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
                <div className="text-center mb-16">
                    <h2 className="text-[#1B4D28] text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                        Choose Your Perspective
                    </h2>
                    <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
                        Toggle between roles to see how Smarthub Agrochain optimizes the export lifecycle tailored to your operational needs.
                    </p>
                    
                    {/* Switch Toggle Tab */}
                    <div className="inline-flex bg-white/70 border border-gray-200/50 p-1.5 rounded-full shadow-lg mt-8 relative backdrop-blur-sm">
                        <button
                            onClick={() => setRole("buyer")}
                            className={`flex items-center gap-2 px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                                role === "buyer"
                                    ? "bg-[#1B4D28] text-white shadow-md scale-105"
                                    : "text-gray-600 hover:text-[#1B4D28]"
                            }`}
                        >
                            <Building2 size={16} />
                            International Buyer
                        </button>
                        <button
                            onClick={() => setRole("farmer")}
                            className={`flex items-center gap-2 px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                                role === "farmer"
                                    ? "bg-[#1B4D28] text-white shadow-md scale-105"
                                    : "text-gray-600 hover:text-[#1B4D28]"
                            }`}
                        >
                            <Calendar size={16} />
                            Local Farmer / Producer
                        </button>
                    </div>
                </div>

                {/* Perspective Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    
                    {/* Left: Step Cards */}
                    <div className="lg:col-span-7 space-y-6">
                        {role === "buyer" ? (
                            <>
                                <div className="bg-white hover:bg-green-50/20 border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex gap-4 group">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 text-[#1B4D28] font-bold text-lg group-hover:scale-110 transition-transform">
                                        1
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-gray-800 text-lg mb-2">Request Quote & Place Order</h3>
                                        <p className="text-gray-500 text-sm leading-relaxed">
                                            Importers specify product requirements, target grade, tonnage, and chosen destination port. Request custom FOB pricing securely through the portal.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white hover:bg-green-50/20 border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex gap-4 group">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 text-[#1B4D28] font-bold text-lg group-hover:scale-110 transition-transform">
                                        2
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-gray-800 text-lg mb-2">Smart Sourcing & Matchmaking</h3>
                                        <p className="text-gray-500 text-sm leading-relaxed">
                                            Our smart logistics backend aggregates matching crops from certified local farms, locking in stable seasonal prices and mitigating delivery volatility.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white hover:bg-green-50/20 border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex gap-4 group">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 text-[#1B4D28] font-bold text-lg group-hover:scale-110 transition-transform">
                                        3
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-gray-800 text-lg mb-2">Multi-Tier Laboratory Verification</h3>
                                        <p className="text-gray-500 text-sm leading-relaxed">
                                            Independent labs verify moisture content, defect rates, oil yield, or bean counts. Test reports are uploaded directly to your dashboard before bulk dispatch.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white hover:bg-green-50/20 border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex gap-4 group">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 text-[#1B4D28] font-bold text-lg group-hover:scale-110 transition-transform">
                                        4
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-gray-800 text-lg mb-2">FOB Logistics & Document Release</h3>
                                        <p className="text-gray-500 text-sm leading-relaxed">
                                            We handle cargo transit, customs clearing, and ship loading at Nigerian ports. The Bill of Lading, SGS certificates, and customs releases upload directly to your wallet account.
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="bg-white hover:bg-green-50/20 border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex gap-4 group">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 text-[#1B4D28] font-bold text-lg group-hover:scale-110 transition-transform">
                                        1
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-gray-800 text-lg mb-2">Agent Farm Assessment</h3>
                                        <p className="text-gray-500 text-sm leading-relaxed">
                                            A field officer conducts soil inspections, tracks crop growth, and confirms sustainable harvest yields to clear you for our export-ready register.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white hover:bg-green-50/20 border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex gap-4 group">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 text-[#1B4D28] font-bold text-lg group-hover:scale-110 transition-transform">
                                        2
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-gray-800 text-lg mb-2">Submit Yield & Secure Pricing</h3>
                                        <p className="text-gray-500 text-sm leading-relaxed">
                                            List your available harvest (e.g. tones of Cashew, bags of Ginger) in the Farmer Portal. Receive prompt guaranteed buying quotes linked directly to global contracts.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white hover:bg-green-50/20 border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex gap-4 group">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 text-[#1B4D28] font-bold text-lg group-hover:scale-110 transition-transform">
                                        3
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-gray-800 text-lg mb-2">Quality & Bagging Checks</h3>
                                        <p className="text-gray-500 text-sm leading-relaxed">
                                            Once harvested, crops are graded, sealed in export-quality bags, and loaded into secure regional sorting centers for direct global matching.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white hover:bg-green-50/20 border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex gap-4 group">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 text-[#1B4D28] font-bold text-lg group-hover:scale-110 transition-transform">
                                        4
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-gray-800 text-lg mb-2">Instant Mobile Payout</h3>
                                        <p className="text-gray-500 text-sm leading-relaxed">
                                            Receive 100% of your guaranteed payout directly to your secure portal wallet immediately upon quality verification, bypassing slow broker agencies.
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right: Immersive Visual Dashboard Mock */}
                    <div className="lg:col-span-5 flex flex-col items-center">
                        <div className="w-full bg-[#1B4D28] rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-[#2C5E39]">
                            {/* Graphic elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#4CAF50]/10 rounded-full blur-2xl" />

                            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-400" />
                                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                                    <span className="w-3 h-3 rounded-full bg-green-400" />
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-[#81C784] bg-[#4CAF50]/10 px-3 py-1 rounded-full">
                                    Live Tracker Demo
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-gray-400">Onboarding Stage</p>
                                            <p className="text-xs font-bold text-white">Verified Agro-Group #024</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-[#4CAF50] font-extrabold bg-[#4CAF50]/15 px-2 py-0.5 rounded">PASSED</span>
                                </div>

                                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                                            <Search size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-gray-400">Quality Inspection Reports</p>
                                            <p className="text-xs font-bold text-white">Aflatoxin Limit test & Moisture</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-yellow-400 font-extrabold bg-yellow-400/15 px-2 py-0.5 rounded">99.8% OK</span>
                                </div>

                                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                                            <Ship size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-gray-400">Transit & Ocean Vessel</p>
                                            <p className="text-xs font-bold text-white">Direct F.O.B Shipping Dispatch</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-blue-400 font-extrabold bg-blue-400/15 px-2 py-0.5 rounded">LOCKED</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between text-white">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#4CAF50] animate-ping" />
                                    <span className="text-xs font-semibold">Active Portal Guards</span>
                                </div>
                                <Link href="/signup" className="text-xs text-[#81C784] hover:text-white flex items-center gap-1 font-bold">
                                    Register Now
                                    <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Immersive Loop Timeline ─── */}
            <section className="py-24 bg-[#1B4D28] text-white">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="text-center mb-16">
                        <span className="bg-white/10 text-[#81C784] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                            Secure Logistics Cycle
                        </span>
                        <h2 className="text-3xl md:text-5xl font-extrabold mt-4 mb-4">
                            The Smarthub Agrochain Loop
                        </h2>
                        <p className="text-gray-300 text-base md:text-lg max-w-xl mx-auto font-light">
                            How we maintain a 100% successful export record through our integrated cargo network.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Node 1 */}
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all duration-300 relative group">
                            <div className="w-12 h-12 rounded-full bg-[#4CAF50]/20 flex items-center justify-center text-[#4CAF50] mb-6 font-bold group-hover:scale-110 transition-transform">
                                <ShieldCheck size={24} />
                            </div>
                            <h3 className="font-extrabold text-lg mb-2">1. Crop Verification</h3>
                            <p className="text-gray-300 text-xs leading-relaxed mb-4">
                                Our agents physically map farms and test yield quality before loading to secure authentic batch registries.
                            </p>
                            <div className="text-[10px] text-green-300 bg-green-500/10 px-2 py-1 rounded w-fit font-bold">
                                Speed: Avg. 3 Days
                            </div>
                        </div>

                        {/* Node 2 */}
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all duration-300 relative group">
                            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 mb-6 font-bold group-hover:scale-110 transition-transform">
                                <Award size={24} />
                            </div>
                            <h3 className="font-extrabold text-lg mb-2">2. Double Quality Gate</h3>
                            <p className="text-gray-300 text-xs leading-relaxed mb-4">
                                Certified laboratory analysis is run at local collection centers and re-verified at regional ports before bagging.
                            </p>
                            <div className="text-[10px] text-yellow-300 bg-yellow-500/10 px-2 py-1 rounded w-fit font-bold">
                                QC Pass Rate: 99.8%
                            </div>
                        </div>

                        {/* Node 3 */}
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all duration-300 relative group">
                            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6 font-bold group-hover:scale-110 transition-transform">
                                <Search size={24} />
                            </div>
                            <h3 className="font-extrabold text-lg mb-2">3. Smart Matching</h3>
                            <p className="text-gray-300 text-xs leading-relaxed mb-4">
                                Dynamic sorting backends match active buyer requests with locked, graded agricultural produce instantly.
                            </p>
                            <div className="text-[10px] text-blue-300 bg-blue-500/10 px-2 py-1 rounded w-fit font-bold">
                                Sourcing Time: Instant
                            </div>
                        </div>

                        {/* Node 4 */}
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all duration-300 relative group">
                            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 mb-6 font-bold group-hover:scale-110 transition-transform">
                                <Ship size={24} />
                            </div>
                            <h3 className="font-extrabold text-lg mb-2">4. Secured Port Logistics</h3>
                            <p className="text-gray-300 text-xs leading-relaxed mb-4">
                                Fast-track cargo transit, container stuffing, customs release, and export dispatch are completed smoothly.
                            </p>
                            <div className="text-[10px] text-purple-300 bg-purple-500/10 px-2 py-1 rounded w-fit font-bold">
                                Deliveries: 4 Continents
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Interactive Cost & Commission Estimator ─── */}
            <section id="estimator" className="py-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
                <div className="text-center mb-16">
                    <span className="bg-[#1B4D28]/10 text-[#1B4D28] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                        Cost Transparent Estimator
                    </span>
                    <h2 className="text-[#1B4D28] text-3xl md:text-5xl font-extrabold tracking-tight mt-4 mb-4">
                        Calculate Your Export Budget
                    </h2>
                    <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto">
                        Estimate your total cargo budget instantly. Select crop baseline types, destination regions, and adjust quantities to see pricing real-time.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
                    
                    {/* Left Panel: Slider Controls */}
                    <div className="lg:col-span-7 bg-white border border-gray-200/60 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between">
                        
                        <div className="space-y-8">
                            {/* Product Selector */}
                            <div>
                                <label className="block text-sm font-extrabold text-gray-700 mb-3 uppercase tracking-wider">
                                    1. Select Commodity Type
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(products).map(([key, value]) => (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedProduct(key)}
                                            className={`px-4 py-3 rounded-2xl border text-sm font-bold text-left transition-all ${
                                                selectedProduct === key
                                                    ? "bg-[#1B4D28] text-white border-[#1B4D28] shadow-md"
                                                    : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                                            }`}
                                        >
                                            {value.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quantity Slider */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-extrabold text-gray-700 uppercase tracking-wider">
                                        2. Adjust Export Quantity
                                    </label>
                                    <span className="text-[#1B4D28] font-black text-xl">
                                        {quantity} <span className="text-xs font-semibold text-gray-500">Metric Tonnes (MT)</span>
                                    </span>
                                </div>
                                <div className="relative mt-2">
                                    <input
                                        type="range"
                                        min="10"
                                        max="500"
                                        step="10"
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1B4D28]"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-widest">
                                        <span>Min: 10 MT</span>
                                        <span>Medium Volume</span>
                                        <span>Max: 500 MT</span>
                                    </div>
                                </div>
                            </div>

                            {/* Destination Dropdown */}
                            <div>
                                <label className="block text-sm font-extrabold text-gray-700 mb-3 uppercase tracking-wider">
                                    3. Select Destination Region
                                </label>
                                <select
                                    value={destination}
                                    onChange={(e) => setDestination(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 focus:outline-none focus:border-[#1B4D28] focus:bg-white transition-all shadow-sm"
                                >
                                    {Object.entries(destinationFactors).map(([key, val]) => (
                                        <option key={key} value={key}>
                                            {val.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Slider Info Notification */}
                        <div className="mt-8 bg-green-50 border border-green-200/50 p-4 rounded-2xl flex items-start gap-3">
                            <TrendingUp className="text-[#1B4D28] mt-0.5 flex-shrink-0" size={18} />
                            <p className="text-xs text-green-800 leading-relaxed font-semibold">
                                Large volume sourcing discount automatically applied. Volumes starting at 100 MT get a flat reduction in commission fees (from 4.0% down to 2.5%).
                            </p>
                        </div>
                    </div>

                    {/* Right Panel: Invoice Breakdown */}
                    <div className="lg:col-span-5 bg-[#1B4D28] text-white rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden border border-[#2C5E39]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
                        
                        <div>
                            <div className="border-b border-white/10 pb-6 mb-6">
                                <p className="text-[10px] uppercase font-bold tracking-widest text-[#81C784]">Estimated Breakdown</p>
                                <h3 className="text-2xl font-black mt-1">Export Budget Proposal</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-300 font-medium">Commodity Base Cost:</span>
                                    <span className="font-extrabold text-white">${calculations.rawGoodsCost.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-300 font-medium">Logistics & Ocean Freight:</span>
                                    <span className="font-extrabold text-white">${calculations.logisticsCost.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-300 font-medium">QC & Laboratory Testing:</span>
                                    <span className="font-extrabold text-white">${calculations.qualityControlCost.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-300 font-medium">Smarthub Flat Commission ({calculations.commissionRate}%):</span>
                                    <span className="font-extrabold text-[#81C784]">${calculations.commissionCost.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/10">
                            <div className="flex items-baseline justify-between mb-8">
                                <span className="text-sm font-semibold uppercase tracking-wider text-gray-300">Grand Total (FOB):</span>
                                <span className="text-3xl sm:text-4xl font-black text-white">
                                    ${calculations.totalCost.toLocaleString()}
                                    <span className="text-xs font-bold block text-right text-gray-300 mt-1">USD (approx.)</span>
                                </span>
                            </div>

                            <Link href="/signup" className="block w-full">
                                <Button className="bg-[#4CAF50] hover:bg-[#43A047] text-white w-full py-4 rounded-full text-base font-bold shadow-xl shadow-green-900/20 transition-all hover:scale-[1.02]">
                                    Lock in Sourcing Quote
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Elegant FAQ Accordion ─── */}
            <section className="py-24 bg-white px-4 sm:px-6 md:px-12">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="bg-[#1B4D28]/10 text-[#1B4D28] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                            Customer FAQ Helpdesk
                        </span>
                        <h2 className="text-[#1B4D28] text-3xl md:text-4xl font-extrabold tracking-tight mt-4 mb-4">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
                            Got questions about laboratory tests, shipping logistics, payment terms, or crop grades? We have the answers.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {[
                            {
                                q: "How does Smarthub Agrochain ensure cargo grade specs and premium quality?",
                                a: "We run a strict, double-gate quality verification system. Before loading at local warehouses, crops undergo strict laboratory tests (checking moisture limits, defect counts, oil levels, and foreign matter) by certified independent labs. All test reports are published transparently on your buyer dashboard before export shipment clearance."
                            },
                            {
                                q: "What shipping terms (Incoterms) do you operate under?",
                                a: "By default, we operate on standard Free on Board (FOB) terms at major Nigerian ports (such as Apapa or Tin Can). We manage all domestic transport, laboratory tests, bagging, export documentation, and loading onto the buyer's designated shipping vessel."
                            },
                            {
                                q: "How are payments handled to secure transactions?",
                                a: "Importers secure their contracts using dynamic portal wallets linked directly to major escrow and banking gateways. Payments are fully transparently tracked, guaranteeing safety for buyers and prompt payouts for local farmers upon batch quality certification."
                            },
                            {
                                q: "Can we request custom packaging or brand bagging?",
                                a: "Yes. Importers can customize bag packaging sizes, request custom bags, or apply brand-specific labelling/logos. Simply state your requirements in your order request portal under the buyers settings panel."
                            }
                        ].map((faq, idx) => (
                            <div
                                key={idx}
                                className="bg-[#EEF2EE]/50 hover:bg-[#EEF2EE]/80 border border-gray-200/50 rounded-2xl transition-all duration-300"
                            >
                                <button
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                                >
                                    <span className="font-extrabold text-gray-800 text-sm sm:text-base pr-4">
                                        {faq.q}
                                    </span>
                                    <ChevronDown
                                        className={`text-gray-500 transition-transform duration-300 flex-shrink-0 ${
                                            activeFaq === idx ? "rotate-180" : ""
                                        }`}
                                        size={20}
                                    />
                                </button>
                                <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                        activeFaq === idx ? "max-h-96 opacity-100 border-t border-gray-200/50" : "max-h-0 opacity-0"
                                    }`}
                                >
                                    <div className="p-6 text-gray-500 text-sm leading-relaxed">
                                        {faq.a}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
