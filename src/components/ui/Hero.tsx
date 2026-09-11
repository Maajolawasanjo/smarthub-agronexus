"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Marquee } from "@/components/motion";

export function Hero() {
    return (
        <section className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden font-sans">

            {/* Background Layer with Ken Burns slow zoom */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/80 z-10" />
                <div className="absolute inset-0 bg-black/20 z-10" />

                <motion.div
                    initial={{ scale: 1.08 }}
                    animate={{ scale: 1.0 }}
                    transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                >
                    <Image
                        src="/hero-bg.jpg"
                        alt="Agricultural drone spraying a green crop field"
                        fill
                        className="object-cover"
                        priority
                    />
                </motion.div>
            </div>

            {/* Hero Content */}
            <div className="relative z-20 flex flex-col items-center text-center px-6 max-w-5xl mx-auto mt-24 pb-28 md:pb-24">
                <motion.h1
                    initial={{ opacity: 0, y: 35 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light text-white tracking-tight leading-[1.1] mb-6 md:mb-8 drop-shadow-2xl"
                >
                    Powering the Future of{" "}
                    <span className="block mt-1 md:mt-2">Agriculture</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="text-base sm:text-lg md:text-2xl text-gray-100 max-w-3xl mb-8 md:mb-12 leading-relaxed drop-shadow-lg font-light"
                >
                    A decentralized agro-ecosystem connecting farmers, investors, and consumers with full transparency.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                    <Link href="/products" className="inline-block">
                        <motion.span
                            whileHover={{
                                scale: 1.06,
                                y: -2,
                                boxShadow: "0 20px 35px -5px rgba(76, 175, 80, 0.45)",
                            }}
                            whileTap={{ scale: 0.96 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            className="px-8 py-3 bg-[#4CAF50] hover:bg-[#43A047] text-white text-base md:text-lg font-medium rounded-full transition-colors shadow-xl shadow-green-900/30 inline-block cursor-pointer"
                        >
                            Explore Product
                        </motion.span>
                    </Link>
                </motion.div>
            </div>

            {/* Partners Marquee — continuous, seamless ticker */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute bottom-5 z-20 w-full max-w-5xl mx-auto px-4"
            >
                <Marquee speed={26} pauseOnHover={true} gap="gap-12 md:gap-16">
                    <Image src="/logos/CARGIL LOGO.png" alt="Cargill" width={90} height={32} className="h-7 md:h-8 w-auto object-contain brightness-0 invert opacity-50 hover:opacity-90 transition-opacity" />
                    <Image src="/logos/LDC.png" alt="Louis Dreyfus Company" width={75} height={32} className="h-7 md:h-8 w-auto object-contain brightness-0 invert opacity-50 hover:opacity-90 transition-opacity" />
                    <Image src="/logos/CARGO.png" alt="Cargo Lab" width={90} height={32} className="h-7 md:h-8 w-auto object-contain brightness-0 invert opacity-50 hover:opacity-90 transition-opacity" />
                    <Image src="/logos/VISTA.png" alt="Vista" width={80} height={32} className="h-7 md:h-8 w-auto object-contain brightness-0 invert opacity-50 hover:opacity-90 transition-opacity" />
                    <Image src="/logos/kuehne-nagel-logo.png" alt="Kuehne+Nagel" width={100} height={32} className="h-7 md:h-8 w-auto object-contain brightness-0 invert opacity-50 hover:opacity-90 transition-opacity" />
                </Marquee>
            </motion.div>
        </section>
    );
}
