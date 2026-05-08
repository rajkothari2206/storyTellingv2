import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { CheckoutClient } from "./CheckoutClient";

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            background: "linear-gradient(160deg, #F3EEFF 0%, #EBF2FF 100%)",
          }}
        >
          <Loader2 size={48} className="animate-spin" style={{ color: "var(--lf-purple)" }} />
          <p style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "1.2rem", fontWeight: 700, color: "var(--lf-dark)" }}>
            Setting up your Magic Pass…
          </p>
        </div>
      }
    >
      <CheckoutClient />
    </Suspense>
  );
}
