"use client";

/**
 * TEMPORARY PAGE — DELETE AFTER USE
 *
 * Visit /make-admin while logged in to grant yourself admin access.
 * After clicking the button successfully, delete this file.
 */

import { useState } from "react";
import { useMutation } from "convex/react";
import { useConvexAuth, Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function MakeAdminPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const setRole = useMutation(api.auth.setCurrentUserRole);

  async function handleMakeAdmin() {
    setStatus("loading");
    try {
      await setRole({ role: "admin" });
      setStatus("done");
      setMessage("✅ You are now admin! Go to /admin to verify, then delete this page.");
    } catch (e: unknown) {
      setStatus("error");
      setMessage(`❌ Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <>
      <AuthLoading>
        <div style={{ padding: 40, fontFamily: "sans-serif" }}>Loading…</div>
      </AuthLoading>
      <Unauthenticated>
        <div style={{ padding: 40, fontFamily: "sans-serif", color: "red" }}>
          You must be signed in to use this page.{" "}
          <a href="/sign-in">Sign in</a>
        </div>
      </Unauthenticated>
      <Authenticated>
        <div style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 480 }}>
          <h1 style={{ fontSize: 24, marginBottom: 16 }}>Grant Admin Role</h1>
          <p style={{ marginBottom: 24, color: "#555" }}>
            Click the button below to set your account role to <strong>admin</strong>.
            This uses your active session — no credentials needed.
          </p>
          <button
            onClick={handleMakeAdmin}
            disabled={status === "loading" || status === "done"}
            style={{
              padding: "12px 28px",
              fontSize: 16,
              background: status === "done" ? "#22c55e" : "#0d9488",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: status === "loading" || status === "done" ? "default" : "pointer",
            }}
          >
            {status === "loading" ? "Setting…" : status === "done" ? "Done!" : "Make me admin"}
          </button>
          {message && (
            <p style={{ marginTop: 20, color: status === "error" ? "red" : "#166534" }}>
              {message}
            </p>
          )}
          {status === "done" && (
            <p style={{ marginTop: 12 }}>
              <a href="/admin" style={{ color: "#0d9488" }}>→ Go to /admin</a>
            </p>
          )}
        </div>
      </Authenticated>
    </>
  );
}
