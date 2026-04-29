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

export const metadata: Metadata = {
  title: {
    default: "Lalli Fafa — Stories for Giggle & Grow",
    template: "%s | Lalli Fafa",
  },
  description:
    "AI-powered personalised stories in English & Hindi for children. Your child is the hero. Featuring Lalli & Fafa — magical characters who make every bedtime an adventure.",
  keywords: [
    "children stories",
    "kids stories hindi english",
    "ai stories for kids",
    "personalised bedtime stories",
    "lalli fafa",
    "stories for children india",
    "kids storytelling app",
  ],
  authors: [{ name: "Lalli Fafa" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://www.lallifafa.com",
    siteName: "Lalli Fafa",
    title: "Lalli Fafa — Stories for Giggle & Grow",
    description:
      "AI-powered personalised stories in English & Hindi for children. Your child is the hero!",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lalli Fafa — Stories for Giggle & Grow",
    description: "AI-powered personalised stories for children in English & Hindi.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${baloo2.variable} ${nunito.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <ConvexAuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </ConvexAuthProvider>
      </body>
    </html>
  );
}
