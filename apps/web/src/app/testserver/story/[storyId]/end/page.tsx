"use client";

// TESTSERVER screen 4 — End of story (Functional Spec v1.1 §5.4).
// All three actions stay visible without scrolling at 360/768/1280px.

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { Loader2, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";

export default function EndOfStoryScreen() {
  const { storyId } = useParams<{ storyId: string }>();
  const router = useRouter();
  const sid = storyId as Id<"stories">;

  const story = useQuery(api.stories.get, { storyId: sid });
  const imageUrls = useQuery(api.stories.getSceneImageUrls, { storyId: sid });
  const stars = useQuery(api["testserver/challenge"].getStarsBalance, {});
  const generateStory = useAction(api.generateStoryV2.enqueueStoryV2);

  const [busy, setBusy] = useState<"sequel" | null>(null);

  const closingImage = imageUrls?.[imageUrls.length - 1]?.url ?? null;

  async function continueAdventure() {
    if (!story) return;
    setBusy("sequel");
    try {
      const result = await generateStory({
        params: {
          theme: story.params.theme,
          lesson: story.params.lesson,
          storyType: story.params.storyType,
          length: story.params.length ?? "medium",
          language: story.params.language ?? "English",
          childId: "1",
          sequelOfId: sid,
        },
      });
      router.push(`/testserver/generating/${result.storyId}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Couldn't start the sequel");
      setBusy(null);
    }
  }

  if (!story) {
    return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 className="animate-spin" size={28} color="var(--lf-teal)" /></div>;
  }

  return (
    <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", padding: 20, maxWidth: 460, margin: "0 auto", width: "100%", overflow: "hidden" }}>
      <span className="animate-float absolute select-none" style={{ top: 8, left: 10, fontSize: 20, opacity: 0.6, zIndex: 1 }}>✨</span>
      <span className="animate-wiggle absolute select-none" style={{ top: 10, right: 46, fontSize: 18, opacity: 0.6, zIndex: 1 }}>🎉</span>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#fff", border: "1px solid rgba(255,193,7,0.35)", borderRadius: 999, padding: "6px 14px", boxShadow: "0 3px 12px rgba(255,193,7,0.18)" }}>
          <Star size={14} color="var(--lf-sunshine)" fill="var(--lf-sunshine)" />
          <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 13, color: "var(--lf-dark)" }}>{stars ?? 0} stars</span>
        </div>
      </div>

      {closingImage && (
        <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", marginBottom: 14, boxShadow: "0 10px 30px rgba(14,10,31,0.14)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={closingImage} alt="Closing scene" style={{ width: "100%", aspectRatio: "16 / 10", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(14,10,31,0.35), transparent 45%)" }} />
          <span style={{ position: "absolute", bottom: 8, left: 10, fontSize: 22 }} className="animate-float-delay">⭐</span>
        </div>
      )}

      <p style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 17, fontWeight: 700, color: "var(--lf-dark)", textAlign: "center", margin: "0 0 20px" }}>
        {story.title || "Story complete!"} <span style={{ fontSize: 15 }}>🌙</span>
      </p>

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative", zIndex: 1 }}>
        <button
          onClick={() => router.push(`/testserver/challenge/${storyId}`)}
          className="btn-primary"
          style={{ justifyContent: "center", fontSize: 15.5, padding: "0.85rem" }}
        >
          <Sparkles size={17} /> Story challenge with Lalli and Fafa
        </button>
        <button
          onClick={continueAdventure}
          disabled={busy === "sequel"}
          className="btn-secondary"
          style={{ justifyContent: "center", fontSize: 14.5, padding: "0.75rem", opacity: busy === "sequel" ? 0.7 : 1 }}
        >
          {busy === "sequel" ? "Starting…" : "Continue the adventure"}
        </button>
        <button
          onClick={() => router.push("/generate")}
          className="btn-ghost"
          style={{ justifyContent: "center", fontSize: 14.5, padding: "0.75rem" }}
        >
          New story
        </button>
      </div>
    </div>
  );
}
