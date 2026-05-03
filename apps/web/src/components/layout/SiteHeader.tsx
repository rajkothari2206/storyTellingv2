"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Sparkles } from "lucide-react";

const navLinks = [
  { label: "Stories", href: "/stories" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Learn", href: "/learn" },
  { label: "Shop", href: "/shop" },
  { label: "Blog", href: "/blog" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? "rgba(255,248,231,0.95)"
          : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.08)" : "none",
      }}
    >
      <div
        className="mx-auto flex items-center justify-between px-6"
        style={{ maxWidth: 1200, height: 76 }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <div
            className="relative flex-shrink-0 overflow-hidden"
            style={{
              width: 58,
              height: 58,
              borderRadius: 14,
              background: "#131020",
              boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
            }}
          >
            <Image
              src="/lf-logo.png"
              alt="Lalli Fafa"
              fill
              className="object-contain scale-110"
              priority
            />
          </div>
          <span
            className="font-bold hidden sm:block"
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontSize: 22,
              color: "var(--lf-dark)",
              letterSpacing: "-0.01em",
              lineHeight: 1,
            }}
          >
            Lalli <span style={{ color: "var(--lf-teal)" }}>Fafa</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 hover:bg-white/70"
              style={{
                color: "var(--lf-dark)",
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/sign-in"
            style={{
              color: "var(--lf-dark)",
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="btn-primary"
            style={{ fontSize: 14, padding: "0.5rem 1.25rem" }}
          >
            <Sparkles size={14} />
            Start Free
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-full transition-colors"
          style={{ color: "var(--lf-dark)" }}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden px-6 pb-6 pt-2"
          style={{ background: "rgba(255,248,231,0.98)", backdropFilter: "blur(12px)" }}
        >
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 rounded-2xl font-semibold transition-colors"
                style={{
                  color: "var(--lf-dark)",
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 16,
                }}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 mt-4">
              <Link
                href="/sign-in"
                onClick={() => setMenuOpen(false)}
                className="btn-ghost w-full text-center"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMenuOpen(false)}
                className="btn-primary w-full text-center"
              >
                <Sparkles size={16} />
                Start Free
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
