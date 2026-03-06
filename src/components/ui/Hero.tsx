import Image from "next/image";
import Link from "next/link";

export function Hero() {
    return (
        <section className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden font-sans">

            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/80 z-10" />
                <div className="absolute inset-0 bg-black/20 z-10" />

                <Image
                    src="/hero-bg.jpg"
                    alt="Agriculture Background"
                    fill
                    className="object-cover"
                    priority
                />
            </div>

            {/* Hero Content — pb-28 on mobile to leave room for logos, pb-24 on desktop */}
            <div className="relative z-20 flex flex-col items-center text-center px-6 max-w-5xl mx-auto mt-24 pb-28 md:pb-24">
                <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light text-white tracking-tight leading-[1.1] mb-6 md:mb-8 drop-shadow-2xl">
                    Powering the Future of{" "}
                    <span className="block mt-1 md:mt-2">Agriculture</span>
                </h1>

                <p className="text-base sm:text-lg md:text-2xl text-gray-100 max-w-3xl mb-8 md:mb-12 leading-relaxed drop-shadow-lg font-light">
                    A decentralized agro-ecosystem connecting farmers, investors, and consumers with full transparency.
                </p>

                <Link href="/dashboard/products" className="px-8 py-3 bg-[#4CAF50] hover:bg-[#43A047] text-white text-base md:text-lg font-medium rounded-full transition-all shadow-xl shadow-green-900/30 transform hover:scale-105 inline-block">
                    Explore Product
                </Link>
            </div>

            {/* Partners — all 5 logos, wrap to 2 rows on small screens */}
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
    );
}
