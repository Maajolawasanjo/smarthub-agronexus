import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/ui/Hero";
import { Connectivity } from "@/components/ui/Connectivity";
import { TargetMarket } from "@/components/ui/TargetMarket";
import { Testimonials } from "@/components/ui/Testimonials";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <Hero />
      <Connectivity />
      <TargetMarket />
      <Testimonials />
      <Footer />
    </main>
  );
}
