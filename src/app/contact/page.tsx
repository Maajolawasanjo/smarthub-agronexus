"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

// --- Icons ---
const PhoneIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
);

const EmailIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
);

const ClockIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

export default function ContactPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        message: ""
    });

    const isFormValid = formData.fullName.trim() !== "" && formData.email.trim() !== "" && formData.message.trim() !== "";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;

        setIsLoading(true);
        // Simulate API
        setTimeout(() => {
            setIsLoading(false);
            toast("Message sent successfully!", "success");
            setFormData({ fullName: "", email: "", message: "" });
        }, 1500);
    };

    return (
        <main className="min-h-screen bg-[var(--background)] font-sans">
            <Navbar />

            {/* --- Hero Section (Gold Gradient) --- */}
            <section className="relative w-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#2a1a00] via-[#3d2800] to-[#1a1200] pt-40 pb-24 md:pt-48 md:pb-32">
                {/* Subtle decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/3 w-96 h-96 bg-[#c8960a]/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-[#a67c00]/8 rounded-full blur-3xl" />
                </div>

                {/* Hero Content */}
                <div className="relative z-10 text-center px-6 max-w-5xl mx-auto flex flex-col items-center">
                    <span className="inline-block px-4 py-1.5 bg-[#c8960a]/10 border border-[#c8960a]/20 rounded-full text-[#e8b84a] text-xs font-bold tracking-wider uppercase mb-8">
                        📞 Get In Touch
                    </span>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white tracking-tight leading-[1.15] mb-6 md:mb-8">
                        Buy Fresh Farm Produce <br />
                        <span className="text-[#e8b84a]">Directly from Source.</span>
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed font-light mb-8 md:mb-10">
                        Agrochain connects international buyers with premium-quality agricultural goods sourced and verified by our team in Nigeria.
                    </p>
                    <div className="mb-4">
                        <Link href="/products">
                            <Button className="bg-[#c8960a] hover:bg-[#a67c00] px-8 py-3 md:px-10 md:py-4 text-base md:text-xl font-medium shadow-2xl shadow-amber-900/30 transform hover:scale-105 transition-all">
                                Explore Products
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Partner Logos */}
                <div className="relative z-10 mt-14 w-full flex flex-col items-center px-4">
                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-4">Trusted by global commodity traders</p>
                    <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap">
                        <Image src="/logos/CARGIL LOGO.png" alt="Cargill" width={90} height={32} className="h-7 md:h-8 w-auto object-contain brightness-0 invert opacity-50 hover:opacity-80 transition-opacity" />
                        <Image src="/logos/LDC.png" alt="Louis Dreyfus Company" width={75} height={32} className="h-7 md:h-8 w-auto object-contain brightness-0 invert opacity-50 hover:opacity-80 transition-opacity" />
                        <Image src="/logos/CARGO.png" alt="Cargo Lab" width={90} height={32} className="h-7 md:h-8 w-auto object-contain brightness-0 invert opacity-50 hover:opacity-80 transition-opacity" />
                        <Image src="/logos/VISTA.png" alt="Vista" width={80} height={32} className="h-7 md:h-8 w-auto object-contain brightness-0 invert opacity-50 hover:opacity-80 transition-opacity" />
                        <Image src="/logos/kuehne-nagel-logo.png" alt="Kuehne+Nagel" width={100} height={32} className="h-7 md:h-8 w-auto object-contain brightness-0 invert opacity-50 hover:opacity-80 transition-opacity" />
                    </div>
                </div>
            </section>

            {/* --- Contact Content --- */}
            <section className="py-32 px-4 md:px-12 max-w-7xl mx-auto">
                <div className="text-center mb-24">
                    <h2 className="text-[#343A40] text-3xl md:text-4xl font-bold mb-4">Contact AgroChain</h2>
                    <p className="text-gray-500 font-light">We're here to help you reach out with any question or partnership inquires</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">

                    {/* Left: Form */}
                    <div className="space-y-8">
                        <h3 className="text-xl font-bold text-[#343A40]">Send Us A Message</h3>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[#1A1A1A] ml-1">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full px-5 py-3.5 rounded-full border border-gray-300 outline-none focus:border-[#1B4D28] transition-colors text-sm placeholder:font-light"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[#1A1A1A] ml-1">Email</label>
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-5 py-3.5 rounded-full border border-gray-300 outline-none focus:border-[#1B4D28] transition-colors text-sm placeholder:font-light"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[#1A1A1A] ml-1">Your Message</label>
                                <textarea
                                    placeholder="Type your message here"
                                    rows={5}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full px-5 py-4 rounded-3xl border border-gray-300 outline-none focus:border-[#1B4D28] transition-colors text-sm placeholder:font-light resize-none"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full py-4 rounded-xl text-base font-medium shadow-lg"
                                isLoading={isLoading}
                                disabled={!isFormValid || isLoading}
                            >
                                Send Message
                            </Button>
                        </form>
                    </div>

                    {/* Right: Info & Map */}
                    <div className="space-y-12">
                        {/* Info Items */}
                        <div className="space-y-8">
                            {/* Phone */}
                            <div className="flex gap-4 items-start">
                                <div className="bg-orange-50 p-3 rounded-lg">
                                    <PhoneIcon />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#343A40] text-lg">Phone</h4>
                                    <p className="text-gray-500 text-sm font-light">+234 800 123 4567</p>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="flex gap-4 items-start">
                                <div className="bg-orange-50 p-3 rounded-lg">
                                    <EmailIcon />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#343A40] text-lg">Email</h4>
                                    <p className="text-gray-500 text-sm font-light">@johndoe123@gmail.com</p>
                                </div>
                            </div>

                            {/* Hours */}
                            <div className="flex gap-4 items-start">
                                <div className="bg-orange-50 p-3 rounded-lg">
                                    <ClockIcon />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#343A40] text-lg">Business Hours</h4>
                                    <p className="text-gray-500 text-sm font-light">Active 24hrs</p>
                                </div>
                            </div>
                        </div>

                        {/* Map */}
                        <div className="w-full h-80 rounded-3xl overflow-hidden shadow-md border border-gray-100 relative bg-blue-50">
                            {/* Map Placeholder Image or Iframe */}
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d101408.21722940247!2d3.3792057!3d6.5244093!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b8b2ae68280c1%3A0xdc9e87a367c3d9cb!2sLagos!5e0!3m2!1sen!2sng!4v1680000000000!5m2!1sen!2sng"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen={false}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="grayscale hover:grayscale-0 transition-all duration-700"
                            ></iframe>
                        </div>
                    </div>

                </div>
            </section>

            <Footer />
        </main>
    );
}
