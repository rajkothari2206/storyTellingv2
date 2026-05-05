import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "Terms of Service — Lalli Fafa",
  description: "Lalli Fafa Terms of Service. Read our terms before using the platform.",
};

const LAST_UPDATED = "1 May 2026";

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main style={{ background: "var(--lf-cream)", paddingTop: 72 }}>
        <div className="mx-auto px-5 py-14" style={{ maxWidth: 760 }}>
          {/* Back link */}
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
            Terms of Service
          </h1>
          <p className="mt-2 mb-10" style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.88rem", color: "rgba(45,45,45,0.45)" }}>
            Last updated: {LAST_UPDATED}
          </p>

          <div className="legal-content flex flex-col gap-8">

            <Section title="1. Acceptance of Terms">
              <p>By accessing or using the Lalli Fafa platform at <strong>www.lallifafa.com</strong> (the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree, please do not use the Service.</p>
              <p>These Terms apply to all users of the Service, including parents, guardians, and any other individuals who create accounts or use the platform on behalf of children.</p>
            </Section>

            <Section title="2. Description of Service">
              <p>Lalli Fafa provides an AI-powered personalised children&apos;s storytelling platform. The Service allows registered users to:</p>
              <ul>
                <li>Generate personalised stories featuring characters Lalli and Fafa, with the user&apos;s child as the hero</li>
                <li>Listen to AI-narrated audio versions of stories in English and Hindi</li>
                <li>View AI-generated story illustrations</li>
                <li>Save and replay stories from a personal library</li>
              </ul>
            </Section>

            <Section title="3. Account Registration">
              <p>To use the Service, you must create an account. You agree to:</p>
              <ul>
                <li>Provide accurate and complete information during registration</li>
                <li>Maintain the security of your password</li>
                <li>Notify us immediately of any unauthorised access to your account</li>
                <li>Take responsibility for all activity that occurs under your account</li>
              </ul>
              <p>You must be at least 18 years old to create an account. The Service is intended for use by parents and guardians on behalf of children.</p>
            </Section>

            <Section title="4. Credits and Payments">
              <p>The Service operates on a credit-based system:</p>
              <ul>
                <li>New accounts receive <strong>250 free welcome credits</strong> upon registration</li>
                <li>Additional credits are available through paid subscription plans (Magic Pass Monthly at ₹199/month or Magic Pass Yearly at ₹1,999/year)</li>
                <li>Credits are non-transferable and non-refundable except where required by applicable law</li>
                <li>Subscription charges are processed via Razorpay and billed in Indian Rupees (INR)</li>
                <li>Subscriptions auto-renew unless cancelled before the renewal date</li>
              </ul>
            </Section>

            <Section title="5. Acceptable Use">
              <p>You agree not to use the Service to:</p>
              <ul>
                <li>Generate content that is harmful, offensive, or inappropriate for children</li>
                <li>Attempt to reverse-engineer, copy, or extract the AI models or story generation system</li>
                <li>Share account credentials with others or create multiple accounts to circumvent credit limits</li>
                <li>Use automated tools to access the Service</li>
                <li>Violate any applicable Indian or international laws</li>
              </ul>
            </Section>

            <Section title="6. Intellectual Property">
              <p>All content on the platform — including the Lalli and Fafa character designs, brand assets, website design, and story generation system — is owned by Lalli Fafa and protected by applicable intellectual property laws.</p>
              <p>Stories generated by the Service are provided for personal, non-commercial use. You may not reproduce, distribute, or sell generated stories without our prior written consent.</p>
            </Section>

            <Section title="7. Privacy and Children's Data">
              <p>We take children&apos;s privacy seriously. Please read our <Link href="/legal/privacy" style={{ color: "var(--lf-teal)", fontWeight: 600 }}>Privacy Policy</Link> for full details on how we collect, use, and protect personal data.</p>
              <p>We do not knowingly collect personal data directly from children. All account information is provided by and managed by the parent or guardian.</p>
            </Section>

            <Section title="8. Disclaimer of Warranties">
              <p>The Service is provided &ldquo;as is&rdquo; without warranties of any kind, either express or implied. We do not guarantee that:</p>
              <ul>
                <li>The Service will be uninterrupted or error-free</li>
                <li>Generated stories will meet specific educational or developmental standards</li>
                <li>AI-generated content will always be perfectly accurate or appropriate</li>
              </ul>
              <p>We review our AI prompts and safety filters regularly, but AI outputs can be unpredictable. If you encounter any inappropriate content, please contact us immediately at <a href="mailto:hello@lallifafa.com" style={{ color: "var(--lf-teal)" }}>hello@lallifafa.com</a>.</p>
            </Section>

            <Section title="9. Limitation of Liability">
              <p>To the fullest extent permitted by law, Lalli Fafa shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.</p>
              <p>Our maximum liability to you for any claim arising from these Terms or the Service shall not exceed the amount you paid us in the 3 months preceding the claim.</p>
            </Section>

            <Section title="10. Modifications to the Service or Terms">
              <p>We may modify these Terms at any time. We will notify registered users of material changes via email or an in-app notice. Continued use of the Service after changes constitutes acceptance of the updated Terms.</p>
              <p>We may also modify, suspend, or discontinue any part of the Service at any time, with or without notice.</p>
            </Section>

            <Section title="11. Governing Law">
              <p>These Terms are governed by the laws of India. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of Mumbai, Maharashtra, India.</p>
            </Section>

            <Section title="12. Contact">
              <p>If you have any questions about these Terms, please contact us at:</p>
              <p>
                <strong>Lalli Fafa</strong><br />
                Email: <a href="mailto:hello@lallifafa.com" style={{ color: "var(--lf-teal)" }}>hello@lallifafa.com</a>
              </p>
            </Section>

          </div>

          <div className="mt-12 pt-8" style={{ borderTop: "1.5px solid rgba(0,0,0,0.07)" }}>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "rgba(45,45,45,0.45)", lineHeight: 1.6 }}>
              Also see our <Link href="/legal/privacy" style={{ color: "var(--lf-teal)", fontWeight: 600 }}>Privacy Policy</Link>.
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
