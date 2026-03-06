import Image from "next/image";
import Link from "next/link";

export function Connectivity() {
    return (
        <section className="w-full py-32 bg-[var(--background)]">
            <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                {/* Image Collage Section */}
                <div className="relative h-[500px] w-full">
                    {/* Main Background Image - Logistics/Bananas */}
                    <div className="absolute top-0 left-0 w-[85%] h-[85%] rounded-3xl overflow-hidden shadow-2xl z-10">
                        <Image
                            src="/agrochain-logistics.png"
                            alt="Logistics and Transport"
                            fill
                            className="object-cover"
                        />
                    </div>

                    {/* Overlay Image - Farmers - Positioned bottom right */}
                    <div className="absolute bottom-0 right-0 w-[55%] h-[55%] rounded-3xl overflow-hidden shadow-[#4CAF50]/20 shadow-2xl z-20 border-8 border-white">
                        <Image
                            src="/agrochain-farmers.png"
                            alt="Happy Farmers"
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex flex-col justify-start">

                    {/* Handwriting Sub-header */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className="font-handwriting text-[#4CAF50] text-2xl md:text-3xl italic">
                            Connecting Farms to the World
                        </span>
                        <span className="text-2xl">🚜</span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-6 tracking-tight">
                        Agrochain
                    </h2>

                    <p className="text-gray-600 text-lg leading-relaxed mb-10">
                        Modern agricultural export platform built to connect African farmers directly with global buyers. We exist to remove the long chain of middlemen, reduce fraud, and give international importers a reliable way to source high-quality produce at scale.
                    </p>

                    {/* Feature List */}
                    <div className="space-y-8 mb-10">

                        {/* Feature 1 */}
                        <div className="flex gap-4 items-start">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#4CAF50] flex items-center justify-center mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[#2E6B34] mb-1">Direct Sourcing:</h3>
                                <p className="text-gray-600">We work closely with farmers, cooperatives, and processors to ensure buyers access premium-grade agricultural products sourced straight from the farm.</p>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="flex gap-4 items-start">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#4CAF50] flex items-center justify-center mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[#2E6B34] mb-1">Quality & Verification:</h3>
                                <p className="text-gray-600">Every product listed passes through our verification process, grading, documentation, and compliance checks.</p>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="flex gap-4 items-start">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#4CAF50] flex items-center justify-center mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[#2E6B34] mb-1">Secure Transactions:</h3>
                                <p className="text-gray-600">Through escrow-backed payments, buyers transact safely while farmers receive guaranteed payouts.</p>
                            </div>
                        </div>

                    </div>

                    <Link href="/dashboard/products" className="px-8 py-3 bg-[#4CAF50] hover:bg-[#43A047] text-white text-lg font-medium rounded-full transition-shadow shadow-lg shadow-green-900/20 w-fit block text-center">
                        Explore Product
                    </Link>

                </div>
            </div>
        </section>
    );
}
