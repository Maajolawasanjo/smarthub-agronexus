"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";

// --- Icons for Process Section ---
// Using generic SVGs to match the "Line/Outline" style in the mockup
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

    // Extended array logic from Testimonials
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
        }, 4000);
        return () => resetTimeout();
    }, [activeIndex, handleNext, resetTimeout]);

    // Seamless loop reset
    useEffect(() => {
        if (activeIndex === totalItems) {
            const timeout = setTimeout(() => {
                setIsTransitioning(false);
                setActiveIndex(0);
            }, 500);
            return () => clearTimeout(timeout);
        }
        if (activeIndex === -1) {
            const timeout = setTimeout(() => {
                setIsTransitioning(false);
                setActiveIndex(totalItems - 1);
            }, 500);
            return () => clearTimeout(timeout);
        }
    }, [activeIndex, totalItems]);

    return (
        <main className="min-h-screen bg-white font-sans">
            <Navbar />

            {/* ... [Hero Section - Unchanged] ... */}
            <section className="relative min-h-[96vh] w-full flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-black/50 z-10" />
                    <Image
                        src="/about/hero-bg.jpg"
                        alt="Container Ship at Sea"
                        fill
                        className="object-cover object-center"
                        priority
                    />
                </div>
                <div className="relative z-20 text-center px-6 max-w-5xl mx-auto flex flex-col items-center pt-28 pb-28 md:pb-24">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-5 md:mb-6 drop-shadow-2xl text-balance leading-tight">
                        Our Mission is to Make African Produce Globally Accessible
                    </h1>
                    <p className="text-sm sm:text-base md:text-xl text-gray-100 max-w-3xl mx-auto leading-relaxed drop-shadow-lg mb-8 md:mb-10 font-light">
                        AgroChain connects international buyers with premium-quality agricultural goods sourced and verified by our team in Nigeria.
                    </p>
                    <div className="mb-4">
                        <Button className="bg-[#4CAF50] hover:bg-[#43A047] px-8 py-3 text-base md:text-lg font-medium shadow-2xl rounded-full">
                            Explore Product
                        </Button>
                    </div>
                </div>
                {/* Partner Logos */}
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

            {/* ... [Mission & Vision - Unchanged] ... */}
            <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
                    <div className="space-y-6">
                        <h2 className="text-[#343A40] text-3xl md:text-4xl font-bold">Who Are We</h2>
                        <p className="text-gray-600 leading-relaxed text-lg">
                            Agrochain is a tech-enabled export facilitator dedicated to showcasing the best of African agriculture on the global stage. We believe in creating sustainable opportunities for local farmers by bridging the gap between their potential and international market demand.
                        </p>
                    </div>
                    <div className="space-y-6">
                        <h2 className="text-[#343A40] text-3xl md:text-4xl font-bold">Our Vision</h2>
                        <p className="text-gray-600 leading-relaxed text-lg">
                            Our vision is to be the most trusted bridge between African agricultural excellence and the international market, ensuring fair trade and prosperity for the communities we serve. We aim to foster a global marketplace where quality and sustainability are paramount.
                        </p>
                    </div>
                </div>
            </section>

            {/* ... [Process - Unchanged] ... */}
            <section className="py-20 px-6 max-w-7xl mx-auto text-center">
                <div className="mb-16">
                    <h2 className="text-[#343A40] text-3xl md:text-4xl font-bold mb-4">Our Process</h2>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                        We follow a meticulous four-step process to ensure quality, reliability and efficiency from farm to port
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {processSteps.map((step, index) => (
                        <div key={index} className="flex flex-col items-center text-center p-6 border border-gray-100 rounded-2xl hover:shadow-lg transition-shadow bg-white h-full">
                            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
                                {step.icon}
                            </div>
                            <h3 className="text-gray-900 font-bold text-lg mb-4 h-12 flex items-center justify-center">{step.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* --- Team Moving Carousel Section --- */}
            <section className="py-24 px-6 w-full text-center bg-gray-50/50 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 md:px-12 relative group">
                    <div className="mb-16">
                        <h2 className="text-[#343A40] text-3xl md:text-4xl font-bold mb-4">Meet the Team</h2>
                        <p className="text-gray-500 text-lg">
                            The passionate individuals dedicated to bring continents through agriculture
                        </p>
                    </div>

                    {/* Carousel Viewport */}
                    <div className="relative flex items-center justify-center">
                        {/* Left Navigation */}
                        <button
                            onClick={handlePrev}
                            className="hidden md:flex absolute -left-8 lg:-left-16 z-20 text-[#1B4D28] hover:scale-110 transition-transform cursor-pointer opacity-0 group-hover:opacity-100 duration-300"
                            disabled={activeIndex === -1}
                        >
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
                        </button>

                        <div className="w-full overflow-hidden">
                            <style jsx>{`
                                .carousel-track { --slide-pct: 100%; }
                                @media (min-width: 768px) { .carousel-track { --slide-pct: 33.333%; } }
                            `}</style>
                            <div
                                className={`flex carousel-track ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`}
                                style={{
                                    transform: `translateX(calc(-1 * ${activeIndex} * var(--slide-pct)))`,
                                    ['--slide-index' as any]: activeIndex
                                }}
                            >
                                {extendedTeam.map((member, index) => (
                                    <div key={index} className="w-full md:w-1/3 flex-shrink-0 px-4">
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-md transition-shadow group h-full">
                                            <div className="w-48 h-48 rounded-full overflow-hidden mb-6 relative border-4 border-white shadow-inner group-hover:scale-105 transition-transform duration-300">
                                                <Image src={member.image} alt={member.name} fill className="object-cover" />
                                            </div>
                                            <h3 className="font-bold text-xl text-[#343A40] mb-1">{member.name}</h3>
                                            <p className="text-[#4CAF50] font-medium text-sm">{member.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Navigation */}
                        <button
                            onClick={handleNext}
                            className="hidden md:flex absolute -right-8 lg:-right-16 z-20 text-[#1B4D28] hover:scale-110 transition-transform cursor-pointer opacity-0 group-hover:opacity-100 duration-300"
                        >
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
                        </button>
                    </div>

                    {/* Pagination Dots */}
                    <div className="flex justify-center gap-2 mt-12">
                        {teamMembers.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => { setIsTransitioning(true); setActiveIndex(index); }}
                                className={`rounded-full transition-all duration-300 ${(activeIndex % totalItems) === index ? "w-8 h-2 bg-[#1B4D28]" : "w-2 h-2 bg-gray-300 hover:bg-gray-400"}`}
                            />
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
