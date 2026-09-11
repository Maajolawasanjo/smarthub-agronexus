import Link from "next/link";
import { Check, ArrowRight, Building2, Sprout } from "lucide-react";
import { Button } from "./Button";

export function DualGateway() {
    return (
        <section className="w-full py-28 md:py-36 bg-[#0d1f12] text-white font-sans relative overflow-hidden">
            {/* Background Glow Accents */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#4CAF50]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#c8960a]/10 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">

                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-[#4CAF50]/10 border border-[#4CAF50]/20 text-[#81C784] text-xs font-bold tracking-wider uppercase mb-5">
                        🌱 Two Sides of One Trusted Ecosystem
                    </span>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white tracking-tight leading-tight mb-6">
                        Ready to Transform Your{" "}
                        <span className="font-normal text-[#4CAF50]">Agricultural Trade?</span>
                    </h2>

                    <p className="text-base sm:text-lg text-gray-300 leading-relaxed font-light">
                        Whether you are an international buyer securing bulk export tonnage or a Nigerian agricultural producer seeking direct off-takers, Agrochain provides the infrastructure.
                    </p>
                </div>

                {/* Dual Gateway Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

                    {/* Card 1: For Importers & Processors */}
                    <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-md flex flex-col justify-between hover:border-[#4CAF50]/50 transition-all duration-300 group">
                        <div>
                            {/* Top Badge & Icon */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#4CAF50]/20 border border-[#4CAF50]/40 text-[#81C784] text-xs font-bold uppercase tracking-wider">
                                    <Building2 size={14} />
                                    <span>International Buyers</span>
                                </div>
                                <span className="text-xs text-gray-400 font-mono">B2B SOURCING</span>
                            </div>

                            <h3 className="text-2xl sm:text-3xl font-light text-white mb-3">
                                Source Verified <span className="font-bold text-[#4CAF50]">Commodities</span>
                            </h3>

                            <p className="text-sm text-gray-300 leading-relaxed mb-8 font-light">
                                Procure export-grade Nigerian cash crops directly from audited farm origins with full lab documentation and escrow risk protection.
                            </p>

                            {/* Value Propositions */}
                            <ul className="space-y-3.5 mb-10">
                                {[
                                    "Direct catalog of 12+ verified export commodities",
                                    "Lab-tested quality specs (Moisture, FFA, Purity certificates)",
                                    "100% escrow capital protection until port clearance",
                                    "Custom FOB Lagos & CIF destination port quotes",
                                    "Dedicated export documentation & phytosanitary clearance",
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-gray-200">
                                        <div className="w-5 h-5 rounded-full bg-[#4CAF50]/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-[#4CAF50]">
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <Link href="/products" className="block w-full">
                                <Button className="w-full bg-[#4CAF50] hover:bg-[#43A047] text-white py-3.5 text-base font-semibold shadow-xl shadow-green-900/40 rounded-full flex items-center justify-center gap-2 group-hover:scale-[1.01] transition-transform">
                                    <span>Explore Export Catalog</span>
                                    <ArrowRight size={16} />
                                </Button>
                            </Link>
                            <p className="text-center text-[11px] text-gray-400 mt-3">
                                No advance fees required • Instant catalog inspection
                            </p>
                        </div>
                    </div>

                    {/* Card 2: For Farmers & Cooperatives */}
                    <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-md flex flex-col justify-between hover:border-[#e8b84a]/50 transition-all duration-300 group">
                        <div>
                            {/* Top Badge & Icon */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#c8960a]/20 border border-[#c8960a]/40 text-[#e8b84a] text-xs font-bold uppercase tracking-wider">
                                    <Sprout size={14} />
                                    <span>Producers & Cooperatives</span>
                                </div>
                                <span className="text-xs text-gray-400 font-mono">DIRECT OFF-TAKE</span>
                            </div>

                            <h3 className="text-2xl sm:text-3xl font-light text-white mb-3">
                                Supply Your <span className="font-bold text-[#e8b84a]">Harvest</span>
                            </h3>

                            <p className="text-sm text-gray-300 leading-relaxed mb-8 font-light">
                                Bypass exploitation by speculative local middlemen. Connect directly to verified international off-takers and get paid transparent market rates.
                            </p>

                            {/* Value Propositions */}
                            <ul className="space-y-3.5 mb-10">
                                {[
                                    "Direct access to global buyers in Europe, Asia & the Americas",
                                    "Guaranteed prompt bank payments in Naira upon delivery",
                                    "Free on-site harvest inspection, grading & bagging support",
                                    "Transparent commodity pricing benchmarked to global rates",
                                    "Zero listing fees or upfront onboarding charges",
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-gray-200">
                                        <div className="w-5 h-5 rounded-full bg-[#c8960a]/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-[#e8b84a]">
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <Link href="/signup" className="block w-full">
                                <Button className="w-full bg-[#c8960a] hover:bg-[#a67c00] text-white py-3.5 text-base font-semibold shadow-xl shadow-amber-950/40 rounded-full flex items-center justify-center gap-2 group-hover:scale-[1.01] transition-transform">
                                    <span>Join as a Producer</span>
                                    <ArrowRight size={16} />
                                </Button>
                            </Link>
                            <p className="text-center text-[11px] text-gray-400 mt-3">
                                Cooperative leaders & individual commercial farms welcome
                            </p>
                        </div>
                    </div>

                </div>

            </div>
        </section>
    );
}
