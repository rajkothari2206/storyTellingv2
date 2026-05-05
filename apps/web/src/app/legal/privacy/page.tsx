import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "Privacy Policy — Lalli Fafa",
  description: "Lalli Fafa Privacy Policy. How we collect, use, and protect your data.",
};

const LAST_UPDATED = "1 May 2026";

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main style={{ background: "var(--lf-cream)", paddingTop: 72 }}>
        <div className="mx-auto px-5 py-14" style={{ maxWidth: 760 }}>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 mb-8 text-sm font-semibold transition-all hover:opacity-70"
            style={{ color: "var(--lf-teal)", fontFamily: "'Nunito', sans-serif" }}
          >
            <ArrowLeft size={15} /> Back to home
          </Link>

          <h1
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2rem,4vw,2.8rem)",
              color: "var(--lf-dark)",
              lineHeight: 1.15,
            }}
          >
            Privacy Policy
          </h1>
          <p className="mt-2 mb-10" style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.88rem", color: "rgba(45,45,45,0.45)" }}>
            Last updated: {LAST_UPDATED}
          </p>

          <div className="legal-content flex flex-col gap-8">

            <Section title="1. Who We Are">
              <p>Lalli Fafa (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the storytelling platform at <strong>www.lallifafa.com</strong>. We are committed to protecting the privacy of parents, guardians, and families who use our Service.</p>
              <p>If you have any questions about this policy, please contact us at <a href="mailto:hello@lallifafa.com" style={{ color: "var(--lf-teal)" }}>hello@lallifafa.com</a>.</p>
            </Section>

            <Section title="2. Information We Collect">
              <p>We collect information in the following ways:</p>
              <p><strong>Information you provide directly:</strong></p>
              <ul>
                <li>Account information: your name, email address, and password when you register</li>
                <li>Child profile: your child&apos;s first name, nickname, age, gender, favourite colour, and favourite animal — used solely to personalise stories</li>
                <li>Payment information: processed securely by Razorpay; we do not store card or bank details</li>
              </ul>
              <p><strong>Information collected automatically:</strong></p>
              <ul>
                <li>Usage data: pages visited, stories generated, features used — to improve the Service</li>
                <li>Device and browser information: for security and compatibility purposes</li>
                <li>Log data: IP addresses, access times, error logs — stored securely and not linked to personal profiles</li>
              </ul>
            </Section>

            <Section title="3. Children's Privacy">
              <p>We do not collect personal data directly from children. All child information is entered by the parent or guardian and is used exclusively to personalise story content within the Service.</p>
              <p>We comply with applicable children&apos;s privacy laws. We do not:</p>
              <ul>
                <li>Share child profile data with third parties for marketing purposes</li>
                <li>Allow children to create their own accounts</li>
                <li>Display advertising to users based on child profile data</li>
              </ul>
              <p>Parents may request deletion of their child&apos;s profile data at any time by contacting us.</p>
            </Section>

            <Section title="4. How We Use Your Information">
              <p>We use the information we collect to:</p>
              <ul>
                <li>Provide, maintain, and improve the Service</li>
                <li>Personalise story generation using your child&apos;s profile details</li>
                <li>Process payments and manage your subscription</li>
                <li>Send transactional emails (account confirmation, password reset, receipts)</li>
                <li>Send occasional product updates (you can unsubscribe at any time)</li>
                <li>Monitor and prevent fraud or abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
              <p>We do not sell your personal data to third parties.</p>
            </Section>

            <Section title="5. AI Services and Third Parties">
              <p>Story generation involves sending limited data to AI providers. Specifically:</p>
              <ul>
                <li><strong>OpenAI</strong> — receives your child&apos;s first name, age, theme, and lesson preference to generate story text. No other personal data is sent.</li>
                <li><strong>Google (Gemini)</strong> — receives story scene descriptions to generate illustrations. No personal data is included in image prompts.</li>
                <li><strong>ElevenLabs</strong> — receives story text to produce audio narration. No personal data is included.</li>
              </ul>
              <p>All third-party providers are bound by their own privacy policies and data processing agreements. We only share the minimum data necessary for story generation.</p>
            </Section>

            <Section title="6. Data Storage and Security">
              <p>Your data is stored on <strong>Convex</strong> (our backend infrastructure) and <strong>Vercel</strong> (our hosting provider), both of which operate secure, SOC 2 compliant environments.</p>
              <p>We implement appropriate technical and organisational measures to protect your data, including:</p>
              <ul>
                <li>Encrypted connections (HTTPS/TLS) for all data in transit</li>
                <li>Secure, hashed password storage</li>
                <li>Access controls limiting who can access personal data</li>
              </ul>
              <p>No method of transmission over the internet is 100% secure. If you believe your account has been compromised, contact us immediately.</p>
            </Section>

            <Section title="7. Cookies">
              <p>We use essential cookies to maintain your session and keep you signed in. We do not use advertising or tracking cookies.</p>
              <p>You can configure your browser to refuse cookies, but this may affect the functionality of the Service.</p>
            </Section>

            <Section title="8. Your Rights">
              <p>You have the right to:</p>
              <ul>
                <li><strong>Access</strong> the personal data we hold about you</li>
                <li><strong>Correct</strong> inaccurate data via your profile settings</li>
                <li><strong>Delete</strong> your account and associated data by contacting us</li>
                <li><strong>Withdraw consent</strong> for optional communications at any time</li>
                <li><strong>Data portability</strong> — request a copy of your data in a machine-readable format</li>
              </ul>
              <p>To exercise any of these rights, email us at <a href="mailto:hello@lallifafa.com" style={{ color: "var(--lf-teal)" }}>hello@lallifafa.com</a>. We will respond within 30 days.</p>
            </Section>

            <Section title="9. Data Retention">
              <p>We retain your account data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where we are required by law to retain certain records.</p>
              <p>Generated stories and audio files are stored in your library until you choose to delete them or your account is closed.</p>
            </Section>

            <Section title="10. Changes to This Policy">
              <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by email or via an in-app notice. Your continued use of the Service after changes constitutes acceptance of the updated policy.</p>
            </Section>

            <Section title="11. Contact Us">
              <p>If you have questions, concerns, or complaints about this Privacy Policy or how we handle your data:</p>
              <p>
                <strong>Lalli Fafa</strong><br />
                Email: <a href="mailto:hello@lallifafa.com" style={{ color: "var(--lf-teal)" }}>hello@lallifafa.com</a>
              </p>
            </Section>

          </div>

          <div className="mt-12 pt-8" style={{ borderTop: "1.5px solid rgba(0,0,0,0.07)" }}>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "rgba(45,45,45,0.45)", lineHeight: 1.6 }}>
              Also see our <Link href="/legal/terms" style={{ color: "var(--lf-teal)", fontWeight: 600 }}>Terms of Service</Link>.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />

      <style>{`
        .legal-content p {
          font-family: 'Nunito', sans-serif;
          font-size: 0.95rem;
          color: rgba(45,45,45,0.75);
          line-height: 1.8;
          margin-bottom: 0.75rem;
        }
        .legal-content ul {
          margin: 0.5rem 0 0.75rem 1.5rem;
          list-style: disc;
        }
        .legal-content li {
          font-family: 'Nunito', sans-serif;
          font-size: 0.93rem;
          color: rgba(45,45,45,0.7);
          line-height: 1.75;
          margin-bottom: 0.3rem;
        }
        .legal-content strong {
          color: var(--lf-dark);
          font-weight: 700;
        }
      `}</style>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2
        style={{
          fontFamily: "'Baloo 2', sans-serif",
          fontWeight: 800,
          fontSize: "1.15rem",
          color: "var(--lf-dark)",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}
