import type { Metadata } from "next";
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

const BASE = "https://www.lallifafa.com";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE}/` },
};

/* ── JSON-LD structured data ─────────────────────────────────────
   Three schemas in one block:
   1. Organization   — who we are (GEO entity anchor)
   2. WebSite        — enables Google Sitelinks Search Box
   3. SoftwareApplication — rich result for app in search
   4. FAQPage        — powers featured snippets / AEO
   5. HowTo          — "How to create a personalised story" snippet
──────────────────────────────────────────────────────────────── */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE}/#organization`,
      name: "Lalli Fafa",
      url: BASE,
      logo: {
        "@type": "ImageObject",
        url: `${BASE}/lf-logo.png`,
        width: 512,
        height: 512,
      },
      sameAs: [
        "https://www.instagram.com/lallifafa",
        "https://www.facebook.com/lallifafa",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        email: "contact@lallifafa.com",
        contactType: "customer support",
        areaServed: "IN",
        availableLanguage: ["English", "Hindi"],
      },
      description:
        "Lalli Fafa creates AI-powered personalised children's stories in English and Hindi, where every child becomes the hero alongside beloved characters Lalli and Fafa.",
      foundingDate: "2024",
      areaServed: {
        "@type": "Country",
        name: "India",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${BASE}/#website`,
      url: BASE,
      name: "Lalli Fafa",
      publisher: { "@id": `${BASE}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${BASE}/stories?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
      inLanguage: ["en-IN", "hi-IN"],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${BASE}/#app`,
      name: "Lalli Fafa",
      url: BASE,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web, Android, iOS",
      description:
        "Personalised AI-generated children's stories with illustrated scenes and voice narration in English and Hindi. Your child is the hero of every story.",
      offers: [
        {
          "@type": "Offer",
          name: "Free Starter Plan",
          price: "0",
          priceCurrency: "INR",
          description: "250 welcome credits — approximately 4 illustrated stories.",
        },
        {
          "@type": "Offer",
          name: "Magic Pass",
          price: "199",
          priceCurrency: "INR",
          billingDuration: "P1M",
          description: "1,000 credits per month, Hindi narration, priority generation.",
        },
      ],
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "1200",
        bestRating: "5",
      },
      screenshot: `${BASE}/lf-scene-orchard.png`,
      publisher: { "@id": `${BASE}/#organization` },
      inLanguage: ["en-IN", "hi-IN"],
    },
    {
      "@type": "FAQPage",
      "@id": `${BASE}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "What is Lalli Fafa?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Lalli Fafa is an AI-powered platform that creates personalised children's stories in English and Hindi. Parents enter their child's name and choose a theme, and the platform instantly generates a unique illustrated story with voice narration where the child is the hero alongside Lalli and Fafa.",
          },
        },
        {
          "@type": "Question",
          name: "How do I create a personalised story for my child?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sign up free at lallifafa.com, enter your child's name, pick a story theme (adventure, friendship, space, Indian mythology and more), choose English or Hindi, and click Generate. Your illustrated story with narration is ready in under 60 seconds.",
          },
        },
        {
          "@type": "Question",
          name: "Are Lalli Fafa stories available in Hindi?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Lalli Fafa supports full Hindi narration with native-quality voices. Hindi is available on the Magic Pass plan (₹199/month). English stories are available on all plans including the free plan.",
          },
        },
        {
          "@type": "Question",
          name: "Is Lalli Fafa free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes — sign up for free and receive 250 credits with no credit card required. That gives you approximately 4 fully illustrated and narrated stories to try before you decide to upgrade.",
          },
        },
        {
          "@type": "Question",
          name: "Is Lalli Fafa safe for young children?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Absolutely. Lalli Fafa is completely ad-free, contains no third-party trackers, and all stories are reviewed for age-appropriateness. It is designed exclusively for children aged 2–10 with parental oversight.",
          },
        },
        {
          "@type": "Question",
          name: "What age group is Lalli Fafa designed for?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Lalli Fafa stories are designed for children aged 2 to 10 years. Shorter stories suit toddlers aged 2–4, while medium and long stories are better for children aged 5–10.",
          },
        },
        {
          "@type": "Question",
          name: "Can I share Lalli Fafa stories with family?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Every generated story can be shared via a public preview link, WhatsApp, or Facebook. Recipients can view the story preview without needing a Lalli Fafa account.",
          },
        },
      ],
    },
    {
      "@type": "HowTo",
      "@id": `${BASE}/#howto`,
      name: "How to create a personalised story on Lalli Fafa",
      description:
        "Create an AI-generated illustrated children's story with voice narration in English or Hindi in under 60 seconds.",
      totalTime: "PT1M",
      estimatedCost: { "@type": "MonetaryAmount", currency: "INR", value: "0" },
      step: [
        {
          "@type": "HowToStep",
          position: 1,
          name: "Create your free account",
          text: "Sign up at lallifafa.com with your email. No credit card required. You get 250 free credits instantly.",
          url: `${BASE}/sign-up`,
        },
        {
          "@type": "HowToStep",
          position: 2,
          name: "Choose your story theme",
          text: "Pick from 10+ themes — adventure, friendship, space, Indian mythology, kindness, bedtime and more.",
          url: `${BASE}/stories`,
        },
        {
          "@type": "HowToStep",
          position: 3,
          name: "Enter your child's name and preferences",
          text: "Add your child's name, pick English or Hindi, and select story length (short, medium, or long).",
        },
        {
          "@type": "HowToStep",
          position: 4,
          name: "Generate and enjoy",
          text: "Click Generate. In under 60 seconds your child's personalised illustrated story with voice narration is ready to read and listen.",
        },
      ],
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main>
        <HeroSection />
        <CharactersSection />
        <HowItWorksSection />
        <FeaturesSection />
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
