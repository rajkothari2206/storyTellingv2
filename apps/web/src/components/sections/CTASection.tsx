"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, LayoutDashboard } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function CTASection() {
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session;

  return (
    <section className="py-7 lg:py-10" style={{ background: "#fff" }}>
      <div className="mx-auto px-6" style={{ maxWidth: 900 }}>
        <div
          className="relative rounded-3xl overflow-hidden p-8 lg:p-10 text-center flex flex-col items-center gap-4"
          style={{
            background: "linear-gradient(135deg, var(--lf-dark) 0%, #1a1a3e 100%)",
          }}
        >
          {/* Decorative orbs */}
          <div
            className="absolute rounded-full blur-3xl opacity-30"
            style={{ width: 300, height: 300, background: "var(--lf-sunshine)", top: "-20%", right: "-5%" }}
          />
          <div
            className="absolute rounded-full blur-3xl opacity-20"
            style={{ width: 250, height: 250, background: "var(--lf-teal)", bottom: "-20%", left: "-5%" }}
          />

          {/* Stars */}
          <div className="relative z-10 flex flex-col items-center gap-6">
            <span className="text-5xl animate-wiggle">✨</span>

            <h2
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1.15,
              }}
            >
              Your child's next favourite story
              <br />
              <span className="text-gradient-sunshine">is one click away.</span>
            </h2>

            <p
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: "1.05rem",
                maxWidth: 480,
                lineHeight: 1.7,
              }}
            >
              Start free. No credit card. Join 10,000+ families already
              turning bedtime into the best part of the day.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="btn-primary"
                  style={{ fontSize: "1.05rem", padding: "0.9rem 2.5rem" }}
                >
                  <LayoutDashboard size={18} />
                  Create a story
                </Link>
              ) : (
                <Link
                  href="/sign-up"
                  className="btn-primary"
                  style={{ fontSize: "1.05rem", padding: "0.9rem 2.5rem" }}
                >
                  <Sparkles size={18} />
                  Start free today
                </Link>
              )}
              <Link
                href="/stories"
                className="btn-ghost"
                style={{
                  fontSize: "1.05rem",
                  padding: "0.9rem 2.5rem",
                  borderColor: "rgba(255,255,255,0.2)",
                  color: "#fff",
                }}
              >
                See a story first
                <ArrowRight size={16} />
              </Link>
            </div>

            {!isLoggedIn && (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.82rem" }}>
                250 free credits on signup · No card required · Cancel Magic Pass anytime
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
