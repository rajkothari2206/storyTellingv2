import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Lalli Fafa — Your child. The hero. Every story.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "50px 70px",
          background: "linear-gradient(135deg, #FFF8E7 0%, #FFF0C0 40%, #E6FAF6 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decorative blobs */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: 340,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background: "rgba(0,201,167,0.12)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "rgba(255,193,7,0.18)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -60,
            left: 300,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(255,107,53,0.07)",
          }}
        />

        {/* Left: text content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            flex: 1,
            zIndex: 1,
            paddingRight: 40,
          }}
        >
          {/* Brand name */}
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: "#0E0A1F",
              lineHeight: 1.0,
              letterSpacing: "-2px",
            }}
          >
            Lalli <span style={{ color: "#00C9A7" }}>Fafa</span>
          </div>

          {/* Primary tagline */}
          <div
            style={{
              fontSize: 34,
              fontWeight: 800,
              color: "#0E0A1F",
              lineHeight: 1.2,
            }}
          >
            Your child.{" "}
            <span style={{ color: "#F9C700" }}>The hero.</span>{" "}
            Every story.
          </div>

          {/* Sub-tagline */}
          <div
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: "rgba(14,10,31,0.55)",
              lineHeight: 1.5,
              maxWidth: 460,
            }}
          >
            Personalised bedtime stories in English & Hindi — your child's name woven in from the very first line.
          </div>

          {/* Pill badges */}
          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            {["✨ Free to start", "🎨 AI-illustrated", "🔒 Safe & ad-free", "🇮🇳 English & Hindi"].map((label) => (
              <div
                key={label}
                style={{
                  padding: "7px 18px",
                  borderRadius: 999,
                  background: "rgba(0,201,167,0.13)",
                  border: "1.5px solid rgba(0,201,167,0.35)",
                  color: "#006b57",
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* URL */}
          <div
            style={{
              fontSize: 16,
              color: "rgba(14,10,31,0.35)",
              marginTop: 8,
              letterSpacing: "0.02em",
            }}
          >
            lallifafa.com
          </div>
        </div>

        {/* Right: characters image */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            flexShrink: 0,
            width: 380,
            height: 500,
            zIndex: 1,
            marginRight: -30,
            marginBottom: -50,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://www.lallifafa.com/lf-characters.png"
            alt="Lalli and Fafa characters"
            width={380}
            height={380}
            style={{ objectFit: "contain", objectPosition: "bottom" }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
