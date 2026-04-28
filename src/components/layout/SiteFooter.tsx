import Link from "next/link";
import Image from "next/image";

function IconYoutube() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={17} height={17}>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
    </svg>
  );
}
function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={17} height={17}>
      <path d="M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8 0 3.2 0 3.6-.1 4.8-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.9.1-3.2 0-3.6 0-4.8-.1-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.3 2.2 12c0-3.2 0-3.6.1-4.8C2.4 3.9 4 2.3 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1 0 8.3 0 8.7 0 12c0 3.3 0 3.7.1 4.9.2 4.4 2.6 6.8 7 7C8.3 24 8.7 24 12 24c3.3 0 3.7 0 4.9-.1 4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9 0-3.3 0-3.7-.1-4.9C23.7 2.7 21.3.3 16.9.1 15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 12 5.8zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z"/>
    </svg>
  );
}
function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={17} height={17}>
      <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z"/>
    </svg>
  );
}

const socials = [
  { Icon: IconYoutube, href: "https://youtube.com/@lallifafa", label: "YouTube" },
  { Icon: IconInstagram, href: "https://instagram.com/lallifafa", label: "Instagram" },
  { Icon: IconFacebook, href: "https://facebook.com/lallifafa", label: "Facebook" },
];

const footerLinks = {
  Product: [
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Stories", href: "/stories" },
    { label: "Pricing", href: "/pricing" },
    { label: "Shop", href: "/shop" },
  ],
  Learn: [
    { label: "Blog", href: "/blog" },
    { label: "FAQ", href: "/faq" },
    { label: "About Us", href: "/about" },
    { label: "Characters", href: "/#characters" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Use", href: "/terms" },
    { label: "Refund Policy", href: "/refunds" },
  ],
};

export function SiteFooter() {
  return (
    <footer style={{ background: "var(--lf-dark)", color: "#fff" }}>
      {/* Main footer */}
      <div
        className="mx-auto px-6 py-16"
        style={{ maxWidth: 1200 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="md:col-span-2 flex flex-col gap-5">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative rounded-2xl overflow-hidden" style={{ width: 44, height: 44, background: "var(--lf-cream)" }}>
                <Image
                  src="/logoNoBg.png"
                  alt="Lalli Fafa"
                  fill
                  className="object-contain p-1"
                />
              </div>
              <span
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                Lalli <span style={{ color: "var(--lf-teal)" }}>Fafa</span>
              </span>
            </Link>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.7, maxWidth: 280 }}>
              Stories for Giggle &amp; Grow. AI-powered personalised stories in English &amp; Hindi — where your child is always the hero.
            </p>
            {/* Socials */}
            <div className="flex items-center gap-3 mt-2">
              {socials.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex items-center justify-center rounded-full transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    width: 38,
                    height: 38,
                    background: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <p
                className="mb-4"
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                {group}
              </p>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      style={{
                        color: "rgba(255,255,255,0.7)",
                        fontSize: 14,
                        fontWeight: 500,
                        textDecoration: "none",
                        transition: "color 0.15s",
                      }}
                      className="hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div
          className="mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ maxWidth: 1200 }}
        >
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
            © {new Date().getFullYear()} Lalli Fafa. All rights reserved.
          </p>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
            Made with ❤️ for curious little minds
          </p>
        </div>
      </div>
    </footer>
  );
}
