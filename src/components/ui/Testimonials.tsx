"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { MotionFade } from "@/components/motion";

const testimonials = [
    {
        name: "Rebecca L.",
        location: "USA",
        text: "Sourcing from Africa used to be complicated, but Agrochain changed that. Every supplier is verified, payments are secure, and logistics are handled smoothly.",
        rating: 5,
        image: "/avatar-1.png"
    },
    {
        name: "Michael C.",
        location: "UK",
        text: "The transparency Agrochain provides is unmatched. We can track our cocoa shipments from the farm to our warehouse with complete confidence.",
        rating: 5,
        image: "/avatar-2.png"
    },
    {
        name: "Elena R.",
        location: "Spain",
        text: "Reliable partners were hard to find until we started using this platform. The quality verification process saves us so much time and risk.",
        rating: 5,
        image: "/avatar-3.png"
    },
    {
        name: "David K.",
        location: "Germany",
        text: "As a processor, consistency is key. Smarthub Agrochain delivers valid contracts and high-grade produce every single season.",
        rating: 5,
        image: "/avatar-4.png"
    },
    {
        name: "Kenji M.",
        location: "Japan",
        text: "Efficient, secure, and easy to use. The escrow payment system gives us peace of mind when dealing with new suppliers.",
        rating: 5,
        image: "/avatar-5.png"
    }
];

export function Testimonials() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(true);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Extended array logic for seamless infinite buffer
    const extendedTestimonials = [
        ...testimonials,
        ...testimonials.slice(0, 3)
    ];

    const totalItems = testimonials.length;

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

    // Handle seamless loop reset
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
        <section className="w-full py-32 bg-[var(--background)] overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 md:px-12 relative group">

                {/* Handwritten Header */}
                <MotionFade direction="down" distance={16}>
                    <h2 className="text-center text-3xl md:text-4xl text-gray-500 font-[family-name:var(--font-caveat)] mb-16 opacity-90">
                        Trusted by Buyers Across the World
                    </h2>
                </MotionFade>

                {/* Main Content Area with Navigation */}
                <div className="relative flex items-center justify-center">

                    {/* Left Navigation Button */}
                    <motion.button
                        whileHover={{ scale: 1.2, x: -3 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        onClick={handlePrev}
                        className="hidden md:flex absolute -left-8 lg:-left-16 z-20 text-[#1B4D28] cursor-pointer opacity-0 group-hover:opacity-100 duration-300"
                        disabled={activeIndex === -1}
                        aria-label="Previous Testimonial"
                    >
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C13.1 2 14 2.9 14 4C14 2.9 14.9 2 16 2C18.2 2 20 3.8 20 6C20 7.7 18.9 9.1 17.5 9.7C17.8 10.2 18 10.8 18 11.5C18 13.4 16.4 15 14.5 15C14.1 15 13.7 14.9 13.4 14.8C13.8 15.6 14 16.5 14 17.5C14 20 12 22 12 22C12 22 10 20 10 17.5C10 16.5 10.2 15.6 10.6 14.8C10.3 14.9 9.9 15 9.5 15C7.6 15 6 13.4 6 11.5C6 10.8 6.2 10.2 6.5 9.7C5.1 9.1 4 7.7 4 6C4 3.8 5.8 2 8 2C9.1 2 10 2.9 10 4C10 2.9 10.9 2 12 2Z" />
                        </svg>
                    </motion.button>

                    {/* Carousel Viewport */}
                    <div className="w-full overflow-hidden">
                        <style jsx>{`
                            .carousel-track {
                                --slide-pct: 100%;
                            }
                            @media (min-width: 768px) {
                                .carousel-track {
                                    --slide-pct: 33.333%;
                                }
                            }
                        `}</style>

                        <div
                            className={`flex carousel-track ${isTransitioning ? 'transition-transform duration-600 ease-[cubic-bezier(0.22,1,0.36,1)]' : ''}`}
                            style={{
                                transform: `translateX(calc(-1 * ${activeIndex} * var(--slide-pct)))`,
                                ['--slide-index' as any]: activeIndex
                            }}
                        >
                            {extendedTestimonials.map((testimonial, index) => (
                                <div
                                    key={index}
                                    className="w-full md:w-1/3 flex-shrink-0 px-4"
                                >
                                    <motion.div
                                        whileHover={{ y: -6, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.08)" }}
                                        transition={{ type: "spring", stiffness: 350, damping: 20 }}
                                        className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100/70 hover:border-gray-200 transition-colors h-full flex flex-col justify-between"
                                    >
                                        <div>
                                            {/* Stars */}
                                            <div className="flex gap-1 mb-6">
                                                {[...Array(testimonial.rating)].map((_, i) => (
                                                    <svg key={i} className="w-5 h-5 text-[#FFB400]" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                            </div>

                                            {/* Text */}
                                            <p className="text-gray-600 text-[16px] leading-relaxed mb-8">
                                                "{testimonial.text}"
                                            </p>
                                        </div>

                                        {/* Author */}
                                        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border border-[#1B4D28]/10">
                                                <Image
                                                    src={testimonial.image}
                                                    alt={testimonial.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-800">{testimonial.name}</span>
                                                <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">{testimonial.location}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Navigation Button */}
                    <motion.button
                        whileHover={{ scale: 1.2, x: 3 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        onClick={handleNext}
                        className="hidden md:flex absolute -right-8 lg:-right-16 z-20 text-[#1B4D28] transform scale-x-[-1] cursor-pointer opacity-0 group-hover:opacity-100 duration-300"
                        aria-label="Next Testimonial"
                    >
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C13.1 2 14 2.9 14 4C14 2.9 14.9 2 16 2C18.2 2 20 3.8 20 6C20 7.7 18.9 9.1 17.5 9.7C17.8 10.2 18 10.8 18 11.5C18 13.4 16.4 15 14.5 15C14.1 15 13.7 14.9 13.4 14.8C13.8 15.6 14 16.5 14 17.5C14 20 12 22 12 22C12 22 10 20 10 17.5C10 16.5 10.2 15.6 10.6 14.8C10.3 14.9 9.9 15 9.5 15C7.6 15 6 13.4 6 11.5C6 10.8 6.2 10.2 6.5 9.7C5.1 9.1 4 7.7 4 6C4 3.8 5.8 2 8 2C9.1 2 10 2.9 10 4C10 2.9 10.9 2 12 2Z" />
                        </svg>
                    </motion.button>

                </div>

                {/* Pagination Dots */}
                <div className="flex justify-center items-center gap-2 mt-12">
                    {testimonials.map((_, index) => {
                        const isActive = (activeIndex % totalItems) === index;
                        return (
                            <motion.button
                                key={index}
                                onClick={() => {
                                    setIsTransitioning(true);
                                    setActiveIndex(index);
                                }}
                                suppressHydrationWarning={true}
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
    );
}
