import Image from "next/image";
import Link from "next/link";

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

            {/* Subtitle/Bottom Background Wave Effect - Simulated with gradient/mask or just clean white for now as per image top part */}

            <div className="max-w-7xl mx-auto px-4 md:px-8 text-center relative z-10">

                <h2 className="text-4xl md:text-5xl font-bold text-[#4a4a4a] mb-4">
                    Target Market
                </h2>

                <p className="text-gray-600 text-lg mb-16 max-w-3xl mx-auto">
                    We serve a wide range of business that rely on consistent agricultural supply chain
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                    {targetMarkets.map((market, index) => (
                        <div key={index} className="flex flex-col items-center group relative h-[400px] w-full max-w-[400px] mx-auto">

                            {/* Card Container - relative for positioning layers */}
                            <div className="relative w-full aspect-square flex items-center justify-center p-6">

                                {/* Layer 1: Main Image & Overlay (Bottom) */}
                                <div className="absolute inset-4 z-10 rounded-full overflow-hidden">
                                    <Image
                                        src={market.image}
                                        alt={market.title}
                                        fill
                                        className="object-cover"
                                    />
                                    {/* Dark Overlay inside the circle */}
                                    <div className="absolute inset-0 bg-black/60" />
                                </div>

                                {/* Layer 2: Brush Border (Middle) */}
                                <div className="absolute inset-0 z-20 pointer-events-none">
                                    <Image
                                        src="/brush-border.svg"
                                        alt="Border"
                                        fill
                                        className="object-contain scale-110"
                                    />
                                </div>

                                {/* Layer 3: Text Content (Top) */}
                                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-12 text-center text-white pointer-events-none">
                                    <h3 className="text-2xl font-bold mb-3 drop-shadow-md">
                                        {market.title}
                                    </h3>
                                    <p className="text-sm md:text-base font-medium leading-relaxed drop-shadow-md opacity-90">
                                        {market.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12">
                    <Link href="/dashboard/products" className="px-8 py-3 bg-[#4CAF50] hover:bg-[#43A047] text-white text-lg font-medium rounded-full transition-shadow shadow-lg shadow-green-900/20 inline-block">
                        Explore Product
                    </Link>
                </div>

            </div>
        </section>
    );
}
