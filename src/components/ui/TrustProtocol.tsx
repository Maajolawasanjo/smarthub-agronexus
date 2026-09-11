import Link from "next/link";
import { ShieldCheck, FileCheck, Lock, Ship, ArrowRight, CheckCircle2 } from "lucide-react";

const steps = [
    {
        number: "01",
        title: "Farm & Cooperative Vetting",
        description: "Every producer undergoes rigorous KYC. Farms are GPS-mapped to guarantee traceable origins, zero child labor, and ethical harvesting standards.",
        icon: ShieldCheck,
        badge: "Origin Verification",
    },
    {
        number: "02",
        title: "Independent Lab Testing",
        description: "Batches are tested on-site for moisture, FFA, aflatoxin, and purity. Digital phytosanitary and export grade certificates are published prior to loading.",
        icon: FileCheck,
        badge: "Quality Guaranteed",
    },
    {
        number: "03",
        title: "Escrow-Secured Payments",
        description: "Buyer capital stays safeguarded in verified escrow accounts. Zero counterparty risk — funds release only after confirmed port inspection and dispatch.",
        icon: Lock,
        badge: "Zero Buyer Risk",
    },
    {
        number: "04",
        title: "Port Logistics & Transit",
        description: "Direct liaison with vetted carriers at Lagos ports. Importers receive live container milestone tracking from warehouse dispatch to vessel departure.",
        icon: Ship,
        badge: "FOB & CIF Ready",
    },
];

const metrics = [
    { value: "99.2%", label: "Average Commodity Purity", highlight: "Export Grade" },
    { value: "100%", label: "Escrow-Protected Capital", highlight: "Zero Advance Risk" },
    { value: "14 Days", label: "Average Farm-to-Port Lead Time", highlight: "Rapid Logistics" },
    { value: "50+", label: "Vetted Farming Cooperatives", highlight: "Direct Off-Take" },
];

export function TrustProtocol() {
    return (
        <section className="w-full py-28 md:py-36 bg-gradient-to-b from-[#EEF2EE] via-white to-[#EEF2EE] font-sans">
            <div className="max-w-7xl mx-auto px-4 md:px-8">

                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1B4D28]/10 border border-[#1B4D28]/20 text-[#1B4D28] text-xs font-bold tracking-wider uppercase mb-5">
                        <ShieldCheck size={16} className="text-[#4CAF50]" />
                        <span>The Agrochain Quality Standard</span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-[#1a1a1a] tracking-tight leading-tight mb-6">
                        From Nigerian Soil to Global Ports,{" "}
                        <span className="font-semibold text-[#1B4D28]">Protected Every Step.</span>
                    </h2>

                    <p className="text-base sm:text-lg text-gray-600 leading-relaxed font-light">
                        We eliminate the ambiguity of cross-border agricultural trade. Every metric ton is audited, certified, and financially safeguarded before it leaves Nigerian shores.
                    </p>
                </div>

                {/* 4-Step Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-16">
                    {steps.map((step) => {
                        const Icon = step.icon;
                        return (
                            <div
                                key={step.number}
                                className="relative bg-white rounded-3xl p-7 border border-gray-200/70 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                            >
                                <div>
                                    {/* Card Header: Step number & Icon */}
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="text-3xl font-extrabold text-[#1B4D28]/20 group-hover:text-[#4CAF50] transition-colors">
                                            {step.number}
                                        </span>
                                        <div className="w-12 h-12 rounded-2xl bg-[#EEF2EE] text-[#1B4D28] flex items-center justify-center group-hover:bg-[#1B4D28] group-hover:text-white transition-colors shadow-sm">
                                            <Icon size={22} />
                                        </div>
                                    </div>

                                    {/* Badge */}
                                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#4CAF50] bg-[#4CAF50]/10 px-2.5 py-1 rounded-full mb-3">
                                        {step.badge}
                                    </span>

                                    {/* Title */}
                                    <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-[#1B4D28] transition-colors">
                                        {step.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-light">
                                        {step.description}
                                    </p>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center text-xs font-semibold text-[#1B4D28] gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span>Learn protocol</span>
                                    <ArrowRight size={13} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Trust Metrics Bar */}
                <div className="bg-[#0a1f0f] rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#4CAF50]/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 text-center">
                        {metrics.map((m, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#e8b84a] tracking-tight mb-2">
                                    {m.value}
                                </span>
                                <span className="text-xs sm:text-sm text-gray-200 font-medium mb-1">
                                    {m.label}
                                </span>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-[#81C784]">
                                    {m.highlight}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="relative z-10 mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-300">
                            <CheckCircle2 size={16} className="text-[#4CAF50] flex-shrink-0" />
                            <span>Compliant with NEPC, SGS inspection criteria, and Incoterms 2020 rules.</span>
                        </div>
                        <Link
                            href="/how-it-works"
                            className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-[#e8b84a] hover:text-white transition-colors"
                        >
                            <span>Explore our full supply loop</span>
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>

            </div>
        </section>
    );
}
