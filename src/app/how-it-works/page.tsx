"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { 
    ArrowRight, 
    TrendingUp, 
    Ship, 
    ShieldCheck, 
    Search,
    ChevronDown,
    Building2,
    Calendar,
    Award
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MotionFade, MotionStagger, MotionStaggerItem, Marquee } from "@/components/motion";

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
        <main className="min-h-screen bg-[#EEF2EE] font-sans antialiased overflow-hidden">
            <Navbar />

            {/* ─── How It Works Hero (Gold Gradient) ─── */}
            <section className="relative w-full flex flex-col items-center justify-center overflow-hidden font-sans bg-gradient-to-br from-[#2a1a00] via-[#3d2800] to-[#1a1200] pt-40 pb-24 md:pt-48 md:pb-32">
                {/* Subtle ambient decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        animate={{ scale: [1, 1.15, 1], opacity: [0.05, 0.12, 0.05] }}
                        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                        className="absolute top-0 right-1/4 w-96 h-96 bg-[#c8960a]/10 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{ scale: [1.1, 1, 1.1], opacity: [0.08, 0.15, 0.08] }}
                        transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
                        className="absolute bottom-0 left-1/4 w-80 h-80 bg-[#a67c00]/10 rounded-full blur-3xl"
                    />
                </div>

                <div className="relative z-10 text-center px-6 max-w-5xl mx-auto flex flex-col items-center">
                    <motion.span
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="inline-block px-4 py-1.5 bg-[#c8960a]/10 border border-[#c8960a]/20 rounded-full text-[#e8b84a] text-xs font-bold tracking-wider uppercase mb-8"
                    >
                        ⚡ How Agrochain Works
                    </motion.span>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white tracking-tight leading-[1.15] mb-6 md:mb-8"
                    >
                        Transparent Sourcing. <br />
                        <span className="text-[#e8b84a]">Globally Verified.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed font-light mb-8 md:mb-10"
                    >
                        Agrochain connects international grain, nut, and oilseed importers directly to verified farms in Nigeria. Explore our visual workflow below.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-col sm:flex-row items-center gap-4"
                    >
                        <a href="#workflow" className="inline-block">
                            <motion.span
                                whileHover={{ scale: 1.05, y: -2, boxShadow: "0 20px 35px -5px rgba(200, 150, 10, 0.4)" }}
                                whileTap={{ scale: 0.96 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                className="px-8 py-3 bg-[#c8960a] hover:bg-[#a67c00] text-white text-base md:text-lg font-medium rounded-full shadow-xl shadow-amber-900/30 inline-block transition-colors cursor-pointer"
                            >
                                Explore Workflow ↓
                            </motion.span>
                        </a>
                        <a href="#estimator" className="inline-block">
                            <motion.span
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.96 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-base md:text-lg font-medium rounded-full backdrop-blur-sm inline-block transition-colors cursor-pointer"
                            >
                                Cost Estimator
                            </motion.span>
                        </a>
                    </motion.div>
                </div>

                {/* Partner Logos Marquee */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-10 mt-14 w-full max-w-5xl mx-auto flex flex-col items-center px-4"
                >
                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-4">Trusted by global commodity traders</p>
                    <Marquee speed={26} pauseOnHover={true} gap="gap-12 md:gap-16">
                        <Image src="/logos/CARGIL LOGO.png" alt="Cargill" width={90} height={32} className="h-7 md:h-8 w-auto object-contain brightness-0 invert opacity-50 hover:opacity-90 transition-opacity" />
                        <Image src="/logos/LDC.png" alt="Louis Dreyfus Company" width={75} height={32} className="h-7 md:h-8 w-auto object-contain brightness-0 invert opacity-50 hover:opacity-90 transition-opacity" />
                        <Image src="/logos/CARGO.png" alt="Cargo Lab" width={90} height={32} className="h-7 md:h-8 w-auto object-contain brightness-0 invert opacity-50 hover:opacity-90 transition-opacity" />
                        <Image src="/logos/VISTA.png" alt="Vista" width={80} height={32} className="h-7 md:h-8 w-auto object-contain brightness-0 invert opacity-50 hover:opacity-90 transition-opacity" />
                        <Image src="/logos/kuehne-nagel-logo.png" alt="Kuehne+Nagel" width={100} height={32} className="h-7 md:h-8 w-auto object-contain brightness-0 invert opacity-50 hover:opacity-90 transition-opacity" />
                    </Marquee>
                </motion.div>
            </section>

            {/* ─── Interactive Role Perspective Switcher ─── */}
            <section id="workflow" className="py-32 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
                <div className="text-center mb-16">
                    <MotionFade direction="down" distance={16}>
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="font-handwriting text-[#4CAF50] text-2xl md:text-3xl italic">
                                Seamless Export Lifecycle
                            </span>
                            <span className="text-2xl">⚡</span>
                        </div>
                    </MotionFade>
                    <MotionFade direction="up" distance={20} delay={0.1}>
                        <h2 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] tracking-tight mb-4">
                            Choose Your Perspective
                        </h2>
                        <p className="text-gray-600 text-lg max-w-xl mx-auto leading-relaxed">
                            Toggle between roles to see how Smarthub Agrochain optimizes the export lifecycle tailored to your operational needs.
                        </p>
                    </MotionFade>
                    
                    {/* Switch Toggle Tab with Animated Sliding Pill */}
                    <div className="inline-flex bg-white/80 border border-gray-200/60 p-1.5 rounded-full shadow-lg mt-8 relative backdrop-blur-sm">
                        <button
                            onClick={() => setRole("buyer")}
                            className={`relative flex items-center gap-2 px-8 py-3 rounded-full text-sm font-bold transition-colors duration-200 cursor-pointer ${
                                role === "buyer" ? "text-white" : "text-gray-600 hover:text-[#1B4D28]"
                            }`}
                        >
                            {role === "buyer" && (
                                <motion.div
                                    layoutId="activeRolePerspectivePill"
                                    className="absolute inset-0 bg-[#1B4D28] rounded-full shadow-md z-0"
                                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <Building2 size={16} />
                                International Buyer
                            </span>
                        </button>
                        <button
                            onClick={() => setRole("farmer")}
                            className={`relative flex items-center gap-2 px-8 py-3 rounded-full text-sm font-bold transition-colors duration-200 cursor-pointer ${
                                role === "farmer" ? "text-white" : "text-gray-600 hover:text-[#1B4D28]"
                            }`}
                        >
                            {role === "farmer" && (
                                <motion.div
                                    layoutId="activeRolePerspectivePill"
                                    className="absolute inset-0 bg-[#1B4D28] rounded-full shadow-md z-0"
                                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <Calendar size={16} />
                                Local Farmer / Producer
                            </span>
                        </button>
                    </div>
                </div>

                {/* Perspective Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    
                    {/* Left: Step Cards with AnimatePresence cross-fade */}
                    <div className="lg:col-span-7">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={role}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                className="space-y-6"
                            >
                                {role === "buyer" ? (
                                    <>
                                        {[
                                            {
                                                num: 1,
                                                title: "Request Quote & Place Order",
                                                desc: "Importers specify product requirements, target grade, tonnage, and chosen destination port. Request custom FOB pricing securely through the portal."
                                            },
                                            {
                                                num: 2,
                                                title: "Smart Sourcing & Matchmaking",
                                                desc: "Our smart logistics backend aggregates matching crops from certified local farms, locking in stable seasonal prices and mitigating delivery volatility."
                                            },
                                            {
                                                num: 3,
                                                title: "Multi-Tier Laboratory Verification",
                                                desc: "Independent labs verify moisture content, defect rates, oil yield, or bean counts. Test reports are uploaded directly to your dashboard before bulk dispatch."
                                            },
                                            {
                                                num: 4,
                                                title: "FOB Logistics & Document Release",
                                                desc: "We handle cargo transit, customs clearing, and ship loading at Nigerian ports. The Bill of Lading, SGS certificates, and customs releases upload directly to your wallet account."
                                            }
                                        ].map((step) => (
                                            <motion.div
                                                key={step.num}
                                                whileHover={{ y: -4, boxShadow: "0 15px 30px -5px rgba(27, 77, 40, 0.08)" }}
                                                transition={{ type: "spring", stiffness: 350, damping: 20 }}
                                                className="bg-white hover:bg-green-50/20 border border-gray-100 rounded-2xl p-6 shadow-sm transition-colors duration-300 flex gap-4 group cursor-pointer"
                                            >
                                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 text-[#1B4D28] font-bold text-lg group-hover:scale-110 group-hover:bg-[#1B4D28] group-hover:text-white transition-all duration-300 shadow-sm">
                                                    {step.num}
                                                </div>
                                                <div>
                                                    <h3 className="font-extrabold text-gray-800 text-lg mb-2 group-hover:text-[#1B4D28] transition-colors">{step.title}</h3>
                                                    <p className="text-gray-500 text-sm leading-relaxed">
                                                        {step.desc}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </>
                                ) : (
                                    <>
                                        {[
                                            {
                                                num: 1,
                                                title: "Agent Farm Assessment",
                                                desc: "A field officer conducts soil inspections, tracks crop growth, and confirms sustainable harvest yields to clear you for our export-ready register."
                                            },
                                            {
                                                num: 2,
                                                title: "Submit Yield & Secure Pricing",
                                                desc: "List your available harvest (e.g. tones of Cashew, bags of Ginger) in the Farmer Portal. Receive prompt guaranteed buying quotes linked directly to global contracts."
                                            },
                                            {
                                                num: 3,
                                                title: "Quality & Bagging Checks",
                                                desc: "Once harvested, crops are graded, sealed in export-quality bags, and loaded into secure regional sorting centers for direct global matching."
                                            },
                                            {
                                                num: 4,
                                                title: "Instant Mobile Payout",
                                                desc: "Receive 100% of your guaranteed payout directly to your secure portal wallet immediately upon quality verification, bypassing slow broker agencies."
                                            }
                                        ].map((step) => (
                                            <motion.div
                                                key={step.num}
                                                whileHover={{ y: -4, boxShadow: "0 15px 30px -5px rgba(27, 77, 40, 0.08)" }}
                                                transition={{ type: "spring", stiffness: 350, damping: 20 }}
                                                className="bg-white hover:bg-green-50/20 border border-gray-100 rounded-2xl p-6 shadow-sm transition-colors duration-300 flex gap-4 group cursor-pointer"
                                            >
                                                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 text-[#c8960a] font-bold text-lg group-hover:scale-110 group-hover:bg-[#c8960a] group-hover:text-white transition-all duration-300 shadow-sm">
                                                    {step.num}
                                                </div>
                                                <div>
                                                    <h3 className="font-extrabold text-gray-800 text-lg mb-2 group-hover:text-[#c8960a] transition-colors">{step.title}</h3>
                                                    <p className="text-gray-500 text-sm leading-relaxed">
                                                        {step.desc}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Right: Immersive Visual Dashboard Mock */}
                    <div className="lg:col-span-5 flex flex-col items-center">
                        <MotionFade direction="left" distance={30}>
                            <div className="w-full bg-[#1B4D28] rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-[#2C5E39]">
                                {/* Ambient blurred accents */}
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.12, 0.05] }}
                                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                                    className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"
                                />
                                <motion.div
                                    animate={{ scale: [1.2, 1, 1.2], opacity: [0.08, 0.15, 0.08] }}
                                    transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
                                    className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#4CAF50]/15 rounded-full blur-2xl"
                                />

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
                                    <motion.div
                                        whileHover={{ x: 4 }}
                                        className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center justify-between transition-colors hover:bg-white/10"
                                    >
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
                                    </motion.div>

                                    <motion.div
                                        whileHover={{ x: 4 }}
                                        className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center justify-between transition-colors hover:bg-white/10"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                                                <Search size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] text-gray-400">Quality Inspection Reports</p>
                                                <p className="text-xs font-bold text-white">Aflatoxin Limit test &amp; Moisture</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-yellow-400 font-extrabold bg-yellow-400/15 px-2 py-0.5 rounded">99.8% OK</span>
                                    </motion.div>

                                    <motion.div
                                        whileHover={{ x: 4 }}
                                        className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center justify-between transition-colors hover:bg-white/10"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                                                <Ship size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] text-gray-400">Transit &amp; Ocean Vessel</p>
                                                <p className="text-xs font-bold text-white">Direct F.O.B Shipping Dispatch</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-blue-400 font-extrabold bg-blue-400/15 px-2 py-0.5 rounded">LOCKED</span>
                                    </motion.div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between text-white">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#4CAF50] animate-ping" />
                                        <span className="text-xs font-semibold">Active Portal Guards</span>
                                    </div>
                                    <Link href="/signup" className="text-xs text-[#81C784] hover:text-white flex items-center gap-1 font-bold group">
                                        Register Now
                                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </MotionFade>
                    </div>
                </div>
            </section>

            {/* ─── Immersive Loop Timeline ─── */}
            <section className="py-32 bg-[#1B4D28] text-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <MotionFade direction="up" distance={20} className="text-center mb-16">
                        <span className="font-handwriting text-[#81C784] text-2xl md:text-3xl italic block mb-2">
                            Integrated Cargo Network
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                            The Smarthub Agrochain Loop
                        </h2>
                        <p className="text-gray-200 text-lg max-w-xl mx-auto font-light leading-relaxed">
                            How we maintain a 100% successful export record through our integrated cargo network.
                        </p>
                    </MotionFade>

                    <MotionStagger staggerDelay={0.12} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Node 1 */}
                        <MotionStaggerItem direction="up" distance={30}>
                            <motion.div
                                whileHover={{ y: -8 }}
                                transition={{ type: "spring", stiffness: 350, damping: 20 }}
                                className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors duration-300 relative group cursor-pointer h-full"
                            >
                                <div className="w-12 h-12 rounded-full bg-[#4CAF50]/20 flex items-center justify-center text-[#4CAF50] mb-6 font-bold group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-md">
                                    <ShieldCheck size={24} />
                                </div>
                                <h3 className="font-extrabold text-lg mb-2 group-hover:text-[#81C784] transition-colors">1. Crop Verification</h3>
                                <p className="text-gray-300 text-xs leading-relaxed mb-4">
                                    Our agents physically map farms and test yield quality before loading to secure authentic batch registries.
                                </p>
                                <div className="text-[10px] text-green-300 bg-green-500/10 px-2 py-1 rounded w-fit font-bold">
                                    Speed: Avg. 3 Days
                                </div>
                            </motion.div>
                        </MotionStaggerItem>

                        {/* Node 2 */}
                        <MotionStaggerItem direction="up" distance={30}>
                            <motion.div
                                whileHover={{ y: -8 }}
                                transition={{ type: "spring", stiffness: 350, damping: 20 }}
                                className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors duration-300 relative group cursor-pointer h-full"
                            >
                                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 mb-6 font-bold group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-md">
                                    <Award size={24} />
                                </div>
                                <h3 className="font-extrabold text-lg mb-2 group-hover:text-yellow-300 transition-colors">2. Double Quality Gate</h3>
                                <p className="text-gray-300 text-xs leading-relaxed mb-4">
                                    Certified laboratory analysis is run at local collection centers and re-verified at regional ports before bagging.
                                </p>
                                <div className="text-[10px] text-yellow-300 bg-yellow-500/10 px-2 py-1 rounded w-fit font-bold">
                                    QC Pass Rate: 99.8%
                                </div>
                            </motion.div>
                        </MotionStaggerItem>

                        {/* Node 3 */}
                        <MotionStaggerItem direction="up" distance={30}>
                            <motion.div
                                whileHover={{ y: -8 }}
                                transition={{ type: "spring", stiffness: 350, damping: 20 }}
                                className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors duration-300 relative group cursor-pointer h-full"
                            >
                                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6 font-bold group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-md">
                                    <Search size={24} />
                                </div>
                                <h3 className="font-extrabold text-lg mb-2 group-hover:text-blue-300 transition-colors">3. Smart Matching</h3>
                                <p className="text-gray-300 text-xs leading-relaxed mb-4">
                                    Dynamic sorting backends match active buyer requests with locked, graded agricultural produce instantly.
                                </p>
                                <div className="text-[10px] text-blue-300 bg-blue-500/10 px-2 py-1 rounded w-fit font-bold">
                                    Sourcing Time: Instant
                                </div>
                            </motion.div>
                        </MotionStaggerItem>

                        {/* Node 4 */}
                        <MotionStaggerItem direction="up" distance={30}>
                            <motion.div
                                whileHover={{ y: -8 }}
                                transition={{ type: "spring", stiffness: 350, damping: 20 }}
                                className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors duration-300 relative group cursor-pointer h-full"
                            >
                                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 mb-6 font-bold group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-md">
                                    <Ship size={24} />
                                </div>
                                <h3 className="font-extrabold text-lg mb-2 group-hover:text-purple-300 transition-colors">4. Secured Port Logistics</h3>
                                <p className="text-gray-300 text-xs leading-relaxed mb-4">
                                    Fast-track cargo transit, container stuffing, customs release, and export dispatch are completed smoothly.
                                </p>
                                <div className="text-[10px] text-purple-300 bg-purple-500/10 px-2 py-1 rounded w-fit font-bold">
                                    Deliveries: 4 Continents
                                </div>
                            </motion.div>
                        </MotionStaggerItem>
                    </MotionStagger>
                </div>
            </section>

            {/* ─── Interactive Cost & Commission Estimator ─── */}
            <section id="estimator" className="py-32 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
                <div className="text-center mb-16">
                    <MotionFade direction="down" distance={16}>
                        <span className="font-handwriting text-[#4CAF50] text-2xl md:text-3xl italic block mb-2">
                            Real-Time Cost Calculator
                        </span>
                    </MotionFade>
                    <MotionFade direction="up" distance={20} delay={0.1}>
                        <h2 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] tracking-tight mb-4">
                            Calculate Your Export Budget
                        </h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
                            Estimate your total cargo budget instantly. Select crop baseline types, destination regions, and adjust quantities to see pricing real-time.
                        </p>
                    </MotionFade>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
                    
                    {/* Left Panel: Slider Controls */}
                    <MotionFade direction="right" distance={30} className="lg:col-span-7 bg-white border border-gray-200/60 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between">
                        <div className="space-y-8">
                            {/* Product Selector */}
                            <div>
                                <label className="block text-sm font-extrabold text-gray-700 mb-3 uppercase tracking-wider">
                                    1. Select Commodity Type
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(products).map(([key, value]) => {
                                        const isSelected = selectedProduct === key;
                                        return (
                                            <motion.button
                                                key={key}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                                onClick={() => setSelectedProduct(key)}
                                                className={`px-4 py-3 rounded-2xl border text-sm font-bold text-left transition-colors cursor-pointer ${
                                                    isSelected
                                                        ? "bg-[#1B4D28] text-white border-[#1B4D28] shadow-md"
                                                        : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                                                }`}
                                            >
                                                {value.name}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Quantity Slider */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-extrabold text-gray-700 uppercase tracking-wider">
                                        2. Adjust Export Quantity
                                    </label>
                                    <motion.span
                                        key={quantity}
                                        initial={{ scale: 1.15, color: "#4CAF50" }}
                                        animate={{ scale: 1, color: "#1B4D28" }}
                                        transition={{ duration: 0.25 }}
                                        className="font-black text-xl"
                                    >
                                        {quantity} <span className="text-xs font-semibold text-gray-500">Metric Tonnes (MT)</span>
                                    </motion.span>
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
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 focus:outline-none focus:border-[#1B4D28] focus:bg-white transition-all shadow-sm cursor-pointer"
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
                    </MotionFade>

                    {/* Right Panel: Invoice Breakdown */}
                    <MotionFade direction="left" distance={30} className="lg:col-span-5 bg-[#1B4D28] text-white rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden border border-[#2C5E39]">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.12, 0.05] }}
                            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                            className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"
                        />
                        
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
                                    <span className="text-gray-300 font-medium">Logistics &amp; Ocean Freight:</span>
                                    <span className="font-extrabold text-white">${calculations.logisticsCost.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-300 font-medium">QC &amp; Laboratory Testing:</span>
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
                                <motion.span
                                    key={calculations.totalCost}
                                    initial={{ scale: 1.05, color: "#81C784" }}
                                    animate={{ scale: 1, color: "#ffffff" }}
                                    transition={{ duration: 0.3 }}
                                    className="text-3xl sm:text-4xl font-black"
                                >
                                    ${calculations.totalCost.toLocaleString()}
                                    <span className="text-xs font-bold block text-right text-gray-300 mt-1">USD (approx.)</span>
                                </motion.span>
                            </div>

                            <Link href="/signup" className="block w-full">
                                <motion.div
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                >
                                    <Button className="bg-[#4CAF50] hover:bg-[#43A047] text-white w-full py-4 rounded-full text-base font-bold shadow-xl shadow-green-900/20 transition-colors cursor-pointer">
                                        Lock in Sourcing Quote
                                    </Button>
                                </motion.div>
                            </Link>
                        </div>
                    </MotionFade>
                </div>
            </section>

            {/* ─── Elegant FAQ Accordion with Framer Motion AnimatePresence ─── */}
            <section className="py-32 bg-white px-4 sm:px-6 md:px-12">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <MotionFade direction="down" distance={16}>
                            <span className="font-handwriting text-[#4CAF50] text-2xl md:text-3xl italic block mb-2">
                                Help &amp; Support
                            </span>
                        </MotionFade>
                        <MotionFade direction="up" distance={20} delay={0.1}>
                            <h2 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] tracking-tight mb-4">
                                Frequently Asked Questions
                            </h2>
                            <p className="text-gray-600 text-lg max-w-xl mx-auto leading-relaxed">
                                Got questions about laboratory tests, shipping logistics, payment terms, or crop grades? We have the answers.
                            </p>
                        </MotionFade>
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
                        ].map((faq, idx) => {
                            const isOpen = activeFaq === idx;
                            return (
                                <div
                                    key={idx}
                                    className="bg-[#EEF2EE]/50 hover:bg-[#EEF2EE]/80 border border-gray-200/50 rounded-2xl transition-colors duration-200 overflow-hidden"
                                >
                                    <button
                                        onClick={() => toggleFaq(idx)}
                                        className="w-full flex items-center justify-between p-6 text-left focus:outline-none cursor-pointer"
                                    >
                                        <span className="font-extrabold text-gray-800 text-sm sm:text-base pr-4">
                                            {faq.q}
                                        </span>
                                        <motion.div
                                            animate={{ rotate: isOpen ? 180 : 0 }}
                                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                            className="text-gray-500 shrink-0"
                                        >
                                            <ChevronDown size={20} />
                                        </motion.div>
                                    </button>

                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                key="faq-content"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                                className="overflow-hidden"
                                            >
                                                <div className="p-6 pt-0 text-gray-600 text-sm leading-relaxed border-t border-gray-200/40">
                                                    {faq.a}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
