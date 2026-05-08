"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Sparkles, LayoutDashboard } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { UserPill } from "@/components/layout/UserPill";

const navLinks = [
  { label: "Stories", href: "/stories" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Learn", href: "/learn" },
  { label: "Shop", href: "/shop" },
  { label: "Blog", href: "/blog" },
];

const socials = [
  {
    label: "YouTube",
    href: "https://youtube.com/@lallifafa",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={17} height={17}>
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z" />
      </svg>
    ),
    color: "#FF0000",
  },
  {
    label: "Instagram",
    href: "https://instagram.com/lallifafa",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={17} height={17}>
        <path d="M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8 0 3.2 0 3.6-.1 4.8-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.9.1-3.2 0-3.6 0-4.8-.1-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.3 2.2 12c0-3.2 0-3.6.1-4.8C2.4 3.9 4 2.3 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1 0 8.3 0 8.7 0 12c0 3.3 0 3.7.1 4.9.2 4.4 2.6 6.8 7 7C8.3 24 8.7 24 12 24c3.3 0 3.7 0 4.9-.1 4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9 0-3.3 0-3.7-.1-4.9C23.7 2.7 21.3.3 16.9.1 15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 12 5.8zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z" />
      </svg>
    ),
    color: "#E1306C",
  },
  {
    label: "Facebook",
    href: "https://facebook.com/lallifafa",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={17} height={17}>
        <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z" />
      </svg>
    ),
    color: "#1877F2",
  },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const session = authClient.useSession();
  const isLoggedIn = !!session.data;

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

        {/* Social + CTA */}
        <div className="hidden md:flex items-center gap-3">
          {/* Social icons */}
          <div className="flex items-center gap-1 pr-3" style={{ borderRight: "1px solid rgba(0,0,0,0.1)" }}>
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 hover:opacity-80"
                style={{
                  width: 32,
                  height: 32,
                  color: s.color,
                }}
              >
                {s.icon}
              </a>
            ))}
          </div>

          {/* Auth + CTA */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="btn-primary"
                style={{ fontSize: 14, padding: "0.5rem 1.25rem" }}
              >
                <LayoutDashboard size={14} />
                Storyboard
              </Link>
              <UserPill variant="light" />
            </div>
          ) : (
            <>
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
            </>
          )}
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
              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="btn-primary w-full text-center"
                  >
                    <LayoutDashboard size={16} />
                    Storyboard
                  </Link>
                  <div className="flex justify-center pt-1">
                    <UserPill variant="light" />
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>

            {/* Social icons — mobile */}
            <div className="flex items-center justify-center gap-3 mt-5 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 40,
                    height: 40,
                    background: "rgba(0,0,0,0.05)",
                    color: s.color,
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
