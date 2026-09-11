"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { MotionFade, MotionStagger, MotionStaggerItem, Marquee } from "@/components/motion";

// --- Icons for Process Section ---
const CheckShieldIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
    </svg>
);

const SearchIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="11" y1="8" x2="11" y2="8" />
        <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
);

const QualityIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2v7.31" />
        <path d="M14 2v7.31" />
        <path d="M8.5 2h7" />
        <path d="M14 9.31h-4" />
        <path d="M22 22H2l5-11h10l5 11z" />
    </svg>
);

const LogisticsIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
);

const teamMembers = [
    { name: "John Doe", role: "Chief Executive Officer", image: "/avatar-1.png" },
    { name: "Emmanuel Elisha", role: "Head of Logistics", image: "/avatar-2.png" },
    { name: "Grace Peace", role: "Chief Executive Officer", image: "/avatar-3.png" },
    { name: "Kelvin Adams", role: "Market Relation Officer", image: "/avatar-4.png" },
    { name: "Ma'ajo Lawsanjo", role: "Chief Technology Officer", image: "/avatar-5.png" },
];

const processSteps = [
    {
        title: "Farm Verification & Onboarding",
        description: "We rigorously vet and onboard local farms, ensuring they meet international standards for quality and ethical practices.",
        icon: <CheckShieldIcon />
    },
    {
        title: "Sourcing & Order Matching",
        description: "Our platform intelligently matches global buyer demand with the right produce from our network of verified farms.",
        icon: <SearchIcon />
    },
    {
        title: "Rigorous Quality Assurance",
        description: "Every batch undergoes strict quality control checks to guarantee freshness, safety, and compliance with standards.",
        icon: <QualityIcon />
    },
    {
        title: "Streamlined Logistics & Export",
        description: "We handle all logistics, from packaging and transport to customs clearance, ensuring a seamless delivery.",
        icon: <LogisticsIcon />
    }
];

export default function AboutPage() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(true);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const extendedTeam = [
        ...teamMembers,
        ...teamMembers.slice(0, 3)
    ];

    const totalItems = teamMembers.length;

    const resetTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }, []);

    const handleNext = useCallback(() => {
        resetTimeout();
        setIsTransitioning(true);
        setActiveIndex((prev) => prev + 1);
    }, [resetTimeout]);

    const handlePrev = useCallback(() => {
        resetTimeout();
        setIsTransitioning(true);
        setActiveIndex((prev) => prev - 1);
    }, [resetTimeout]);

    // Auto-play
    useEffect(() => {
        resetTimeout();
        timeoutRef.current = setTimeout(() => {
            handleNext();
        }, 4500);
        return () => resetTimeout();
    }, [activeIndex, handleNext, resetTimeout]);

    // Seamless loop reset
    useEffect(() => {
        if (activeIndex === totalItems) {
            const timeout = setTimeout(() => {
                setIsTransitioning(false);
                setActiveIndex(0);
            }, 600);
            return () => clearTimeout(timeout);
        }
        if (activeIndex === -1) {
            const timeout = setTimeout(() => {
                setIsTransitioning(false);
                setActiveIndex(totalItems - 1);
            }, 600);
            return () => clearTimeout(timeout);
        }
    }, [activeIndex, totalItems]);

    return (
        <main className="min-h-screen bg-white font-sans overflow-hidden">
            <Navbar />

            {/* ─── Hero Section with Ken Burns Zoom ─── */}
            <section className="relative w-full flex flex-col items-center justify-center overflow-hidden pt-40 pb-24 md:pt-48 md:pb-32">
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <div className="absolute inset-0 bg-black/55 z-10" />
                    <motion.div
                        initial={{ scale: 1.08 }}
                        animate={{ scale: 1.0 }}
                        transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-0"
                    >
                        <Image
                            src="/about/hero-bg.jpg"
                            alt="Container Ship at Sea"
                            fill
                            className="object-cover object-center"
                            priority
                        />
                    </motion.div>
                </div>

                <div className="relative z-20 text-center px-6 max-w-5xl mx-auto flex flex-col items-center">
                    <motion.span
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="inline-block px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-gray-200 text-xs font-bold tracking-wider uppercase mb-8"
                    >
                        🌍 About Agrochain
                    </motion.span>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white tracking-tight leading-[1.15] mb-6 md:mb-8"
                    >
                        Our Mission is to Make African Produce Globally Accessible
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="text-base sm:text-lg md:text-xl text-gray-200 max-w-2xl mx-auto leading-relaxed font-light mb-8 md:mb-10"
                    >
                        AgroChain connects international buyers with premium-quality agricultural goods sourced and verified by our team in Nigeria.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="mb-4"
                    >
                        <Link href="/products" className="inline-block">
                            <motion.div
                                whileHover={{ scale: 1.05, y: -2, boxShadow: "0 20px 35px -5px rgba(76, 175, 80, 0.45)" }}
                                whileTap={{ scale: 0.96 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                                <Button className="bg-[#4CAF50] hover:bg-[#43A047] px-8 py-3 text-base md:text-lg font-medium shadow-2xl rounded-full cursor-pointer">
                                    Explore Products
                                </Button>
                            </motion.div>
                        </Link>
                    </motion.div>
                </div>

                {/* Partner Logos Marquee */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-20 mt-14 w-full max-w-5xl mx-auto flex flex-col items-center px-4"
                >
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-4">Trusted by global commodity traders</p>
                    <Marquee speed={26} pauseOnHover={true} gap="gap-12 md:gap-16">
                        <Image src="/logos/CARGIL LOGO.png" alt="Cargill" width={90} height={32} className="h-7 md:h-8 w-auto object-contain brightness-0 invert opacity-50 hover:opacity-90 transition-opacity" />
                        <Image src="/logos/LDC.png" alt="Louis Dreyfus Company" width={75} height={32} className="h-7 md:h-8 w-auto object-contain brightness-0 invert opacity-50 hover:opacity-90 transition-opacity" />
                        <Image src="/logos/CARGO.png" alt="Cargo Lab" width={90} height={32} className="h-7 md:h-8 w-auto object-contain brightness-0 invert opacity-50 hover:opacity-90 transition-opacity" />
                        <Image src="/logos/VISTA.png" alt="Vista" width={80} height={32} className="h-7 md:h-8 w-auto object-contain brightness-0 invert opacity-50 hover:opacity-90 transition-opacity" />
                        <Image src="/logos/kuehne-nagel-logo.png" alt="Kuehne+Nagel" width={100} height={32} className="h-7 md:h-8 w-auto object-contain brightness-0 invert opacity-50 hover:opacity-90 transition-opacity" />
                    </Marquee>
                </motion.div>
            </section>

            {/* ─── Mission & Vision (Symmetrical Slide-ins) ─── */}
            <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
                    <MotionFade direction="right" distance={36} className="space-y-6">
                        <h2 className="text-[#343A40] text-3xl md:text-4xl font-bold">Who Are We</h2>
                        <p className="text-gray-600 leading-relaxed text-lg">
                            Agrochain is a tech-enabled export facilitator dedicated to showcasing the best of African agriculture on the global stage. We believe in creating sustainable opportunities for local farmers by bridging the gap between their potential and international market demand.
                        </p>
                    </MotionFade>
                    <MotionFade direction="left" distance={36} className="space-y-6">
                        <h2 className="text-[#343A40] text-3xl md:text-4xl font-bold">Our Vision</h2>
                        <p className="text-gray-600 leading-relaxed text-lg">
                            Our vision is to be the most trusted bridge between African agricultural excellence and the international market, ensuring fair trade and prosperity for the communities we serve. We aim to foster a global marketplace where quality and sustainability are paramount.
                        </p>
                    </MotionFade>
                </div>
            </section>

            {/* ─── 4-Step Process Section with Staggered Grid ─── */}
            <section className="py-20 px-6 max-w-7xl mx-auto text-center">
                <MotionFade direction="up" distance={20} className="mb-16">
                    <h2 className="text-[#343A40] text-3xl md:text-4xl font-bold mb-4">Our Process</h2>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                        We follow a meticulous four-step process to ensure quality, reliability and efficiency from farm to port
                    </p>
                </MotionFade>

                <MotionStagger staggerDelay={0.12} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {processSteps.map((step, index) => (
                        <MotionStaggerItem key={index} direction="up" distance={30} className="h-full">
                            <motion.div
                                whileHover={{ y: -8, boxShadow: "0 20px 30px -10px rgba(0,0,0,0.08)" }}
                                transition={{ type: "spring", stiffness: 350, damping: 20 }}
                                className="flex flex-col items-center text-center p-6 border border-gray-100 rounded-2xl bg-white h-full transition-colors hover:border-gray-200 cursor-pointer group"
                            >
                                <motion.div
                                    whileHover={{ scale: 1.15, rotate: 6 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                    className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-amber-100 transition-colors shadow-sm"
                                >
                                    {step.icon}
                                </motion.div>
                                <h3 className="text-gray-900 font-bold text-lg mb-4 h-12 flex items-center justify-center group-hover:text-[#1B4D28] transition-colors">
                                    {step.title}
                                </h3>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    {step.description}
                                </p>
                            </motion.div>
                        </MotionStaggerItem>
                    ))}
                </MotionStagger>
            </section>

            {/* ─── Team Moving Carousel Section ─── */}
            <section className="py-24 px-6 w-full text-center bg-gray-50/50 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 md:px-12 relative group">
                    <MotionFade direction="down" distance={16} className="mb-16">
                        <h2 className="text-[#343A40] text-3xl md:text-4xl font-bold mb-4">Meet the Team</h2>
                        <p className="text-gray-500 text-lg">
                            The passionate individuals dedicated to bridging continents through agriculture
                        </p>
                    </MotionFade>

                    {/* Carousel Viewport */}
                    <div className="relative flex items-center justify-center">
                        {/* Left Navigation */}
                        <motion.button
                            whileHover={{ scale: 1.2, x: -3 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            onClick={handlePrev}
                            className="hidden md:flex absolute -left-8 lg:-left-16 z-20 text-[#1B4D28] cursor-pointer opacity-0 group-hover:opacity-100 duration-300"
                            disabled={activeIndex === -1}
                            aria-label="Previous Team Member"
                        >
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
                        </motion.button>

                        <div className="w-full overflow-hidden">
                            <style jsx>{`
                                .carousel-track { --slide-pct: 100%; }
                                @media (min-width: 768px) { .carousel-track { --slide-pct: 33.333%; } }
                            `}</style>
                            <div
                                className={`flex carousel-track ${isTransitioning ? 'transition-transform duration-600 ease-[cubic-bezier(0.22,1,0.36,1)]' : ''}`}
                                style={{
                                    transform: `translateX(calc(-1 * ${activeIndex} * var(--slide-pct)))`,
                                    ['--slide-index' as any]: activeIndex
                                }}
                            >
                                {extendedTeam.map((member, index) => (
                                    <div key={index} className="w-full md:w-1/3 flex-shrink-0 px-4">
                                        <motion.div
                                            whileHover={{ y: -6 }}
                                            transition={{ type: "spring", stiffness: 350, damping: 20 }}
                                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-md transition-shadow group h-full cursor-pointer"
                                        >
                                            <div className="w-48 h-48 rounded-full overflow-hidden mb-6 relative border-4 border-white shadow-inner group-hover:border-[#4CAF50]/40 group-hover:scale-105 transition-all duration-500">
                                                <Image src={member.image} alt={member.name} fill className="object-cover" />
                                            </div>
                                            <h3 className="font-bold text-xl text-[#343A40] mb-1 group-hover:text-[#1B4D28] transition-colors">{member.name}</h3>
                                            <p className="text-[#4CAF50] font-medium text-sm">{member.role}</p>
                                        </motion.div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Navigation */}
                        <motion.button
                            whileHover={{ scale: 1.2, x: 3 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            onClick={handleNext}
                            className="hidden md:flex absolute -right-8 lg:-right-16 z-20 text-[#1B4D28] cursor-pointer opacity-0 group-hover:opacity-100 duration-300"
                            aria-label="Next Team Member"
                        >
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
                        </motion.button>
                    </div>

                    {/* Pagination Dots */}
                    <div className="flex justify-center items-center gap-2 mt-12">
                        {teamMembers.map((_, index) => {
                            const isActive = (activeIndex % totalItems) === index;
                            return (
                                <motion.button
                                    key={index}
                                    onClick={() => { setIsTransitioning(true); setActiveIndex(index); }}
                                    animate={{
                                        width: isActive ? 32 : 8,
                                        backgroundColor: isActive ? "#1B4D28" : "#D1D5DB"
                                    }}
                                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                    className="h-2 rounded-full cursor-pointer"
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            );
                        })}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
