"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { MotionFade, MotionStagger, MotionStaggerItem } from "@/components/motion";

const targetMarkets = [
    {
        title: "Bulk Produce Buyer",
        description: "Companies sourcing cocoa, sesame, ginger, and other export crops",
        image: "/target-buyer.png",
    },
    {
        title: "Importers & Distributor",
        description: "Firms looking for verified suppliers and consistent shipment quality",
        image: "/target-importer.png",
    },
    {
        title: "Food Processing Firm",
        description: "Industries needing high-grade raw materials for manufacturing.",
        image: "/target-processor.png",
    }
];

export function TargetMarket() {
    return (
        <section className="w-full py-32 relative overflow-hidden bg-[url('/target-bg.png')] bg-cover bg-center md:bg-bottom">

            <div className="max-w-7xl mx-auto px-4 md:px-8 text-center relative z-10">

                <MotionFade direction="up" distance={24}>
                    <h2 className="text-4xl md:text-5xl font-bold text-[#4a4a4a] mb-4">
                        Target Market
                    </h2>

                    <p className="text-gray-600 text-lg mb-16 max-w-3xl mx-auto">
                        We serve a wide range of business that rely on consistent agricultural supply chain
                    </p>
                </MotionFade>

                <MotionStagger staggerDelay={0.16} className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                    {targetMarkets.map((market, index) => (
                        <MotionStaggerItem key={index} direction="up" distance={36}>
                            <motion.div
                                whileHover={{ y: -8 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="flex flex-col items-center group relative h-[400px] w-full max-w-[400px] mx-auto cursor-pointer"
                            >
                                {/* Card Container - relative for positioning layers */}
                                <div className="relative w-full aspect-square flex items-center justify-center p-6">

                                    {/* Layer 1: Main Image & Overlay (Bottom) */}
                                    <div className="absolute inset-4 z-10 rounded-full overflow-hidden shadow-xl group-hover:shadow-2xl transition-shadow duration-500">
                                        <Image
                                            src={market.image}
                                            alt={market.title}
                                            fill
                                            className="object-cover scale-100 group-hover:scale-110 transition-transform duration-700 ease-out"
                                        />
                                        {/* Dark Overlay inside the circle */}
                                        <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-colors duration-500" />
                                    </div>

                                    {/* Layer 2: Brush Border (Middle) */}
                                    <div className="absolute inset-0 z-20 pointer-events-none">
                                        <Image
                                            src="/brush-border.svg"
                                            alt="Border"
                                            fill
                                            className="object-contain scale-110 group-hover:scale-115 group-hover:rotate-3 transition-transform duration-700 ease-out"
                                        />
                                    </div>

                                    {/* Layer 3: Text Content (Top) */}
                                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-12 text-center text-white pointer-events-none">
                                        <h3 className="text-2xl font-bold mb-3 drop-shadow-md group-hover:text-[#81C784] transition-colors duration-300">
                                            {market.title}
                                        </h3>
                                        <p className="text-sm md:text-base font-medium leading-relaxed drop-shadow-md opacity-90">
                                            {market.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </MotionStaggerItem>
                    ))}
                </MotionStagger>

                <MotionFade direction="up" distance={20} delay={0.3} className="mt-12">
                    <Link href="/products" className="inline-block">
                        <motion.span
                            whileHover={{ scale: 1.05, y: -2, boxShadow: "0 15px 30px -5px rgba(76, 175, 80, 0.35)" }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            className="px-8 py-3 bg-[#4CAF50] hover:bg-[#43A047] text-white text-lg font-medium rounded-full transition-colors shadow-lg shadow-green-900/20 inline-block cursor-pointer"
                        >
                            Explore Product
                        </motion.span>
                    </Link>
                </MotionFade>

            </div>
        </section>
    );
}
