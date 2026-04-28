import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HeroSection } from "@/components/sections/HeroSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { CharactersSection } from "@/components/sections/CharactersSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { ShopSection } from "@/components/sections/ShopSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { CTASection } from "@/components/sections/CTASection";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <CharactersSection />
        <PricingSection />
        <ShopSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <SiteFooter />
    </>
  );
}
