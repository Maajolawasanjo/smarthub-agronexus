import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/ui/Hero";
import { Connectivity } from "@/components/ui/Connectivity";
import { TargetMarket } from "@/components/ui/TargetMarket";
import { TrustProtocol } from "@/components/ui/TrustProtocol";
import { Testimonials } from "@/components/ui/Testimonials";
import { DualGateway } from "@/components/ui/DualGateway";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <Hero />
      <Connectivity />
      <TargetMarket />
      <TrustProtocol />
      <Testimonials />
      <DualGateway />
      <Footer />
    </main>
  );
}

