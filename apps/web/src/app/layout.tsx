import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import { Toaster } from "sonner";
import { ConvexAuthProvider } from "@/providers/ConvexAuthProvider";
import "./globals.css";

const baloo2 = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const BASE = "https://www.lallifafa.com";

export const metadata: Metadata = {
  /* ── Core ── */
  metadataBase: new URL(BASE),
  title: {
    default: "Lalli Fafa — Personalised Stories for Kids in English & Hindi",
    template: "%s | Lalli Fafa",
  },
  description:
    "AI-powered personalised children's stories where your child is the hero. Featuring Lalli & Fafa — magical characters who make every bedtime an adventure. English & Hindi narration. Safe, ad-free, loved by 10,000+ families.",
  keywords: [
    "personalised stories for kids",
    "ai children stories",
    "bedtime stories in hindi",
    "kids stories english hindi",
    "lalli fafa",
    "children storytelling app india",
    "personalised bedtime stories",
    "stories for kids india",
    "ai story generator for children",
    "hindi stories for kids",
    "bilingual children stories",
    "children audio books india",
    "stories with child as hero",
    "interactive stories for toddlers",
  ],
  authors: [{ name: "Lalli Fafa", url: BASE }],
  creator: "Lalli Fafa",
  publisher: "Lalli Fafa",
  category: "Education",

  /* ── Canonical / alternate ── */
  alternates: {
    canonical: BASE,
    languages: {
      "en-IN": BASE,
      "hi-IN": `${BASE}/hi`,
    },
  },

  /* ── Open Graph ── */
  openGraph: {
    type: "website",
    locale: "en_IN",
    alternateLocale: ["hi_IN"],
    url: BASE,
    siteName: "Lalli Fafa",
    title: "Lalli Fafa — Personalised Stories for Kids in English & Hindi",
    description:
      "AI-powered personalised children's stories where your child is the hero alongside Lalli & Fafa. English & Hindi. Safe, ad-free, loved by families across India.",
    images: [
      {
        url: `${BASE}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Lalli Fafa — Personalised children's stories in English & Hindi",
        type: "image/png",
      },
    ],
  },

  /* ── Twitter / X ── */
  twitter: {
    card: "summary_large_image",
    site: "@lallifafa",
    creator: "@lallifafa",
    title: "Lalli Fafa — Personalised Stories for Kids",
    description:
      "AI-powered personalised children's stories in English & Hindi. Your child is the hero!",
    images: [`${BASE}/opengraph-image`],
  },

  /* ── Icons & manifest ── */
  icons: {
    icon: "/lf-logo.png",
    shortcut: "/lf-logo.png",
    apple: "/lf-logo.png",
  },
  manifest: "/site.webmanifest",

  /* ── Crawlers ── */
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  /* ── Verification ── */
  // To verify: go to Google Search Console → Add property → HTML tag method
  // Then replace the empty string below with the token from the <meta> tag content value
  // verification: { google: "YOUR_TOKEN_HERE" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-IN"
      className={`${baloo2.variable} ${nunito.variable} h-full`}
    >
      <head>
        {/* Preconnect to font origin for faster load */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <ConvexAuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </ConvexAuthProvider>
      </body>
    </html>
  );
}
