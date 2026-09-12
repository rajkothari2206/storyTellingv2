"use client";

import { useState, useEffect, useMemo, Component } from "react";
import type { ReactNode } from "react";
import { useRouter, notFound } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useAction, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { BLOG_POSTS } from "@/lib/blog-data";
// ─── Types ────────────────────────────────────────────────────────────────────

type TabKey = "stories" | "users" | "blog" | "assets" | "voice" | "stings" | "settings" | "story-types" | "languages" | "system-prompt" | "challenge-config" | "cost";
type SettingsSubTab = "themes" | "lessons";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function formatDate(ts: number | undefined | null) {
  if (!ts) return "-";
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

const TABLE_STYLE: React.CSSProperties = {
  width: "100%",
  background: "#fff",
  border: "1.5px solid rgba(0,0,0,0.06)",
  borderRadius: "1rem",
  overflow: "hidden",
  borderCollapse: "collapse" as const,
};

const TH_STYLE: React.CSSProperties = {
  background: "#f5f5f4",
  padding: "10px 16px",
  textAlign: "left",
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 700,
  fontSize: "0.78rem",
  color: "rgba(45,45,45,0.55)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderBottom: "1.5px solid rgba(0,0,0,0.06)",
};

const TD_STYLE: React.CSSProperties = {
  padding: "11px 16px",
  fontFamily: "'Nunito', sans-serif",
  fontSize: "0.88rem",
  color: "var(--lf-dark)",
  borderBottom: "1px solid rgba(0,0,0,0.04)",
};

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    ready: { bg: "rgba(0,184,166,0.12)", color: "#0d7a6e", label: "Complete" },
    text_ready: { bg: "rgba(0,184,166,0.08)", color: "#0d7a6e", label: "Text ready" },
    images_ready: { bg: "rgba(0,184,166,0.08)", color: "#0d7a6e", label: "Images ready" },
    voice_ready: { bg: "rgba(0,184,166,0.08)", color: "#0d7a6e", label: "Voice ready" },
    generating: { bg: "rgba(249,199,0,0.15)", color: "#8a6900", label: "Generating" },
    queued: { bg: "rgba(108,155,242,0.15)", color: "#2d5dba", label: "Queued" },
    error: { bg: "rgba(220,38,38,0.12)", color: "#b91c1c", label: "Failed" },
    draft: { bg: "rgba(0,0,0,0.06)", color: "rgba(45,45,45,0.6)", label: "Draft" },
    published: { bg: "rgba(0,184,166,0.12)", color: "#0d7a6e", label: "Published" },
  };
  const s = map[status ?? ""] ?? { bg: "rgba(0,0,0,0.06)", color: "rgba(45,45,45,0.5)", label: status ?? "-" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "999px",
        background: s.bg,
        color: s.color,
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 700,
        fontSize: "0.75rem",
      }}
    >
      {s.label}
    </span>
  );
}

function ChallengeBadge({ challenge }: { challenge?: { status: string; score?: { gradableCorrect: number; gradableTotal: number } | null } | null }) {
  if (!challenge) {
    return <span style={{ color: "rgba(45,45,45,0.3)", fontSize: "0.78rem" }}>—</span>;
  }
  if (challenge.status === "completed" && challenge.score) {
    return (
      <span
        style={{
          display: "inline-block", padding: "2px 10px", borderRadius: "999px",
          background: "rgba(0,184,166,0.12)", color: "#0d7a6e",
          fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.75rem", whiteSpace: "nowrap",
        }}
      >
        ✅ {challenge.score.gradableCorrect}/{challenge.score.gradableTotal}
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-block", padding: "2px 10px", borderRadius: "999px",
        background: "rgba(249,199,0,0.15)", color: "#8a6900",
        fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.75rem", whiteSpace: "nowrap",
      }}
    >
      📝 Untaken
    </span>
  );
}

function InputStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    padding: "8px 12px",
    borderRadius: "0.6rem",
    border: "1.5px solid rgba(0,0,0,0.12)",
    fontFamily: "'Nunito', sans-serif",
    fontSize: "0.9rem",
    color: "var(--lf-dark)",
    background: "#fff",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    ...extra,
  };
}

function Spinner() {
  return (
    <div
      style={{
        width: 18,
        height: 18,
        borderRadius: "50%",
        border: "2.5px solid rgba(0,184,166,0.25)",
        borderTopColor: "var(--lf-teal)",
        animation: "spin 0.7s linear infinite",
        display: "inline-block",
      }}
    />
  );
}

// ─── Error Boundary ───────────────────────────────────────────────────────────

class TabErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message ?? "Unknown error" };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "40px 24px",
            textAlign: "center",
            background: "#fff",
            border: "1.5px solid rgba(220,38,38,0.15)",
            borderRadius: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "2rem" }}>⚠️</span>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: "#b91c1c", margin: 0 }}>
            Tab failed to load
          </p>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.82rem", color: "rgba(45,45,45,0.55)", margin: 0, maxWidth: 380 }}>
            {this.state.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, message: "" })}
            style={{
              marginTop: 4,
              padding: "7px 18px",
              borderRadius: "0.6rem",
              background: "var(--lf-teal)",
              border: "none",
              color: "#fff",
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Story Modal ──────────────────────────────────────────────────────────────

function StoryModal({ story, users, onClose, onDeleted }: { story: any; users: any[] | undefined; onClose: () => void; onDeleted?: () => void }) {
  const sceneUrls = useQuery(
    (api as any).stories.getSceneImageUrls,
    story?.sceneMetadata?.length > 0 ? { storyId: story._id } : "skip"
  ) as any[] | undefined;
  const deleteStory = useMutation((api as any).stories.adminDeleteStory);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await deleteStory({ storyId: story._id });
      onDeleted?.();
      onClose();
    } catch (err: any) {
      alert("Delete failed: " + (err?.message ?? "Unknown error"));
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  // Correlate userId → user info
  const user = users?.find((u: any) => u.id === story.userId);

  const paragraphs = (story.content ?? "").split(/\n+/).filter(Boolean);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100 }} />
      <div
        style={{
          position: "fixed", inset: "5vh 5vw",
          background: "#fffef9", borderRadius: "1.2rem",
          zIndex: 101, overflowY: "auto",
          boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ background: "var(--lf-dark)", padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderRadius: "1.2rem 1.2rem 0 0", flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.25rem", color: "#fff", margin: "0 0 6px", lineHeight: 1.3 }}>
                {story.title ?? "Untitled"}
              </p>
              <a
                href={`/story/${story._id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flexShrink: 0, marginTop: 4, fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.75rem", color: "var(--lf-teal)", background: "rgba(0,201,167,0.15)", padding: "2px 10px", borderRadius: "999px", textDecoration: "none", whiteSpace: "nowrap" }}
              >
                Open ↗
              </a>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <StatusBadge status={story.status} />
              {story.params?.theme && (
                <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.08)", padding: "2px 10px", borderRadius: "999px" }}>
                  {story.params.theme}
                </span>
              )}
              {story.params?.storyType && (
                <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.08)", padding: "2px 10px", borderRadius: "999px" }}>
                  {story.params.storyType}
                </span>
              )}
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                {formatDate(story.createdAt)}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginLeft: 16, flexShrink: 0 }}>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                background: confirmDelete ? "#dc2626" : "rgba(220,38,38,0.18)",
                border: "none",
                color: confirmDelete ? "#fff" : "#ef4444",
                borderRadius: "0.5rem",
                padding: "6px 14px",
                cursor: "pointer",
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 700,
                fontSize: "0.82rem",
                transition: "all 0.15s",
              }}
            >
              {deleting ? "Deleting…" : confirmDelete ? "Confirm delete" : "🗑 Delete"}
            </button>
            {confirmDelete && !deleting && (
              <button
                onClick={() => setConfirmDelete(false)}
                style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.6)", borderRadius: "0.5rem", padding: "6px 10px", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem" }}
              >
                Cancel
              </button>
            )}
            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.8)", borderRadius: "0.5rem", padding: "6px 14px", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* User + params */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
            <InfoCard label="Parent" value={user?.name ?? "-"} />
            <InfoCard label="Email" value={user?.email ?? story.userId} />
            <InfoCard label="Child" value={user?.profile ? `${user.profile.childName}, age ${user.profile.childAge}` : "-"} />
            <InfoCard label="Theme" value={story.params?.theme ?? "-"} />
            <InfoCard label="Lesson" value={story.params?.lesson ?? "-"} />
            <InfoCard label="Story type" value={story.params?.storyType ?? "-"} />
            <InfoCard label="Length" value={story.params?.length ?? "-"} />
            <InfoCard label="Language" value={(story.params?.language ?? "EN").toUpperCase()} />
            <InfoCard label="Audio narration" value={story.narrationFilePath ? "✓ Yes" : "✗ No"} />
            <InfoCard label="Scenes" value={String(story.sceneMetadata?.length ?? 0)} />
            <InfoCard label="Word count" value={story.content ? `~${story.content.split(/\s+/).filter(Boolean).length} words` : "-"} />
            <InfoCard label="Story ID" value={story._id?.slice(-12)} />
          </div>

          {/* Story Challenge — read-only view of the real owner's challenge,
              previously only checkable via a direct Convex CLI query. */}
          <div>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "rgba(45,45,45,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>
              Story Challenge
            </p>
            {!story.challenge ? (
              <div style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)", borderRadius: "0.75rem", padding: "14px 16px", fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "rgba(45,45,45,0.5)" }}>
                No Challenge generated for this story yet.
              </div>
            ) : (
              <div style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)", borderRadius: "0.75rem", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <ChallengeBadge challenge={story.challenge} />
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", color: "rgba(45,45,45,0.45)" }}>
                    Generated {formatDate(story.challenge.createdAt)}
                    {story.challenge.completedAt ? ` · Completed ${formatDate(story.challenge.completedAt)}` : ""}
                  </span>
                </div>
                {story.challenge.score && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {story.challenge.score.perPillar.map((p: { pillar: string; correct: number; total: number }) => (
                      <span
                        key={p.pillar}
                        style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.75rem", color: "rgba(45,45,45,0.65)", background: "rgba(0,0,0,0.04)", padding: "3px 10px", borderRadius: "999px" }}
                      >
                        {p.pillar}: {p.correct}/{p.total}
                      </span>
                    ))}
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.75rem", color: "#8a6900", background: "rgba(249,199,0,0.15)", padding: "3px 10px", borderRadius: "999px" }}>
                      ⭐ {story.challenge.score.starsEarned}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Scene images */}
          {sceneUrls && sceneUrls.length > 0 && (
            <div>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "rgba(45,45,45,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>
                Scene Images
              </p>
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                {sceneUrls.map((sc: any) => (
                  <div key={sc.sceneNumber} style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
                    {sc.url ? (
                      <img src={sc.url} alt={`Scene ${sc.sceneNumber}`} style={{ width: 120, height: 90, objectFit: "cover", borderRadius: "0.5rem", border: "1.5px solid rgba(0,0,0,0.08)" }} />
                    ) : (
                      <div style={{ width: 120, height: 90, background: "rgba(0,0,0,0.06)", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: "0.7rem", color: "rgba(45,45,45,0.4)" }}>No image</span>
                      </div>
                    )}
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.7rem", color: "rgba(45,45,45,0.5)" }}>Scene {sc.sceneNumber}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Story content */}
          {paragraphs.length > 0 && (
            <div>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "rgba(45,45,45,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>
                Story Content
              </p>
              <div
                style={{
                  background: "#fff",
                  border: "1.5px solid rgba(0,0,0,0.06)",
                  borderRadius: "1rem",
                  padding: "20px 24px",
                  maxHeight: 400,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {paragraphs.map((p: string, i: number) => (
                  <p key={i} style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.92rem", lineHeight: 1.7, color: "var(--lf-dark)", margin: 0 }}>
                    {p}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Scene descriptions */}
          {story.sceneMetadata && story.sceneMetadata.length > 0 && (
            <div>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "rgba(45,45,45,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>
                Scene Descriptions
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {story.sceneMetadata.map((sc: any) => (
                  <div key={sc.sceneNumber} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "#fff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: "0.6rem", padding: "10px 14px" }}>
                    <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "0.8rem", color: "var(--lf-teal)", flexShrink: 0, marginTop: 2 }}>S{sc.sceneNumber}</span>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "rgba(45,45,45,0.7)", lineHeight: 1.5 }}>{sc.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)", borderRadius: "0.7rem", padding: "10px 14px" }}>
      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.7rem", fontWeight: 700, color: "rgba(45,45,45,0.45)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 3px" }}>{label}</p>
      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.88rem", fontWeight: 600, color: "var(--lf-dark)", margin: 0 }}>{value}</p>
    </div>
  );
}

// ─── Tab: Stories ─────────────────────────────────────────────────────────────

function StoriesTab({ isAdmin, users }: { isAdmin: boolean; users: any[] | undefined }) {
  const router = useRouter();
  const stories = useQuery(api.stories.listAll, isAdmin ? {} : "skip") as any[] | undefined;
  const deleteStory = useMutation((api as any).stories.adminDeleteStory);
  const generateChallenge = useAction((api as any).testserver.challenge.adminGenerateChallengeForStory);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStory, setSelectedStory] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [genResult, setGenResult] = useState<Record<string, "ok" | "error">>({});

  async function handleGenerateChallenge(e: React.MouseEvent, storyId: string) {
    e.stopPropagation();
    if (generatingId) return;
    setGeneratingId(storyId);
    try {
      // Runs under the story's own owner (adminGenerateChallengeForStory), not
      // this admin session — so unlike the old generateChallenge call, there's
      // nothing this admin session can navigate to and correctly view; the
      // customer-facing challenge page resolves its data from the CURRENT
      // session's own userId, which isn't the story owner here.
      await generateChallenge({ storyId: storyId as any });
      setGenResult(prev => ({ ...prev, [storyId]: "ok" }));
    } catch {
      setGenResult(prev => ({ ...prev, [storyId]: "error" }));
    } finally {
      setGeneratingId(null);
    }
  }

  async function handleQuickDelete(e: React.MouseEvent, storyId: string) {
    e.stopPropagation();
    if (confirmId !== storyId) { setConfirmId(storyId); return; }
    setDeletingId(storyId);
    setConfirmId(null);
    try {
      await deleteStory({ storyId: storyId as any });
    } catch (err: any) {
      alert("Delete failed: " + (err?.message ?? "Unknown error"));
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = useMemo(() => {
    const list = stories ?? [];
    return list.filter((s: any) => {
      const user = users?.find((u: any) => u.id === s.userId);
      const matchSearch = !search || (
        (s.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (s.params?.childName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (user?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (user?.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (user?.profile?.childName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (s.userId ?? "").toLowerCase().includes(search.toLowerCase())
      );
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [stories, users, search, statusFilter]);

  return (
    <>
      {selectedStory && (
        <StoryModal story={selectedStory} users={users} onClose={() => setSelectedStory(null)} onDeleted={() => setSelectedStory(null)} />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input
            placeholder="Search by title, user, child…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...InputStyle(), maxWidth: 280 }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ ...InputStyle(), width: "auto" }}
          >
            <option value="all">All statuses</option>
            <option value="ready">Complete</option>
            <option value="generating">Generating</option>
            <option value="queued">Queued</option>
            <option value="text_ready">Text ready</option>
            <option value="images_ready">Images ready</option>
            <option value="voice_ready">Voice ready</option>
            <option value="error">Failed</option>
          </select>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "rgba(45,45,45,0.5)", marginLeft: "auto" }}>
            {filtered.length} stories
          </span>
        </div>

        {stories === undefined ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={TABLE_STYLE}>
              <thead>
                <tr>
                  <th style={TH_STYLE}>Title</th>
                  <th style={TH_STYLE}>User</th>
                  <th style={TH_STYLE}>Child</th>
                  <th style={TH_STYLE}>Theme · Lesson</th>
                  <th style={TH_STYLE}>Type · Length</th>
                  <th style={TH_STYLE}>Lang</th>
                  <th style={TH_STYLE}>Media</th>
                  <th style={TH_STYLE}>Status</th>
                  <th style={TH_STYLE}>Challenge</th>
                  <th style={TH_STYLE}>Date</th>
                  <th style={{ ...TH_STYLE, textAlign: "right" }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ ...TD_STYLE, textAlign: "center", color: "rgba(45,45,45,0.4)", padding: 32 }}>
                      No stories found
                    </td>
                  </tr>
                ) : (
                  filtered.map((s: any, i: number) => {
                    const user = users?.find((u: any) => u.id === s.userId);
                    const storyTypeLabel: Record<string, string> = { adventure: "🗺 Adventure", silly: "🌀 Silly", cozy: "🌙 Cozy" };
                    const lengthLabel: Record<string, string> = { short: "Short", medium: "Medium", long: "Long" };
                    const imageCount = s.sceneMetadata?.filter((sc: any) => sc.filePath)?.length ?? 0;
                    const hasAudio = !!s.narrationFilePath;
                    return (
                      <tr
                        key={s._id}
                        style={{ background: i % 2 === 0 ? "#fff" : "rgba(0,0,0,0.02)", cursor: "pointer" }}
                        onClick={() => setSelectedStory(s)}
                      >
                        <td style={{ ...TD_STYLE, fontWeight: 600, maxWidth: 200 }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ lineHeight: 1.3 }}>{s.title ?? "Untitled"}</span>
                            <a
                              href={`/story/${s._id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{ fontSize: "0.72rem", color: "var(--lf-teal)", textDecoration: "none", fontWeight: 600 }}
                            >
                              Open ↗
                            </a>
                          </div>
                        </td>
                        <td style={TD_STYLE}>
                          {user ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                              <span style={{ fontSize: "0.83rem", fontWeight: 600 }}>{user.name ?? "-"}</span>
                              <span style={{ fontSize: "0.73rem", color: "rgba(45,45,45,0.5)", wordBreak: "break-all" }}>{user.email}</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.73rem", color: "rgba(45,45,45,0.4)", fontFamily: "monospace" }}>
                              {s.userId?.slice(-8)}
                            </span>
                          )}
                        </td>
                        <td style={TD_STYLE}>
                          {user?.profile ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                              <span style={{ fontSize: "0.83rem", fontWeight: 600 }}>{user.profile.childName}</span>
                              <span style={{ fontSize: "0.73rem", color: "rgba(45,45,45,0.5)" }}>Age {user.profile.childAge} · {user.profile.childGender}</span>
                            </div>
                          ) : (
                            <span style={{ color: "rgba(45,45,45,0.3)", fontSize: "0.82rem" }}>-</span>
                          )}
                        </td>
                        <td style={TD_STYLE}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            <span style={{ fontSize: "0.83rem", fontWeight: 600 }}>{s.params?.theme ?? "-"}</span>
                            {s.params?.lesson && <span style={{ fontSize: "0.73rem", color: "rgba(45,45,45,0.5)" }}>{s.params.lesson}</span>}
                          </div>
                        </td>
                        <td style={TD_STYLE}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            <span style={{ fontSize: "0.83rem" }}>{storyTypeLabel[s.params?.storyType] ?? s.params?.storyType ?? "-"}</span>
                            {s.params?.length && <span style={{ fontSize: "0.73rem", color: "rgba(45,45,45,0.5)" }}>{lengthLabel[s.params.length] ?? s.params.length}</span>}
                          </div>
                        </td>
                        <td style={{ ...TD_STYLE, fontSize: "0.83rem" }}>{(s.params?.language ?? "EN").toUpperCase()}</td>
                        <td style={TD_STYLE}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            {imageCount > 0 && (
                              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6366f1", background: "rgba(99,102,241,0.1)", padding: "1px 7px", borderRadius: "999px", whiteSpace: "nowrap" }}>
                                🖼 {imageCount} img
                              </span>
                            )}
                            {hasAudio ? (
                              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#0d7a6e", background: "rgba(0,184,166,0.1)", padding: "1px 7px", borderRadius: "999px", whiteSpace: "nowrap" }}>
                                🔊 audio
                              </span>
                            ) : (
                              <span style={{ fontSize: "0.72rem", color: "rgba(45,45,45,0.3)", whiteSpace: "nowrap" }}>no audio</span>
                            )}
                          </div>
                        </td>
                        <td style={TD_STYLE}><StatusBadge status={s.status} /></td>
                        <td style={TD_STYLE}><ChallengeBadge challenge={s.challenge} /></td>
                        <td style={{ ...TD_STYLE, whiteSpace: "nowrap", fontSize: "0.82rem" }}>{formatDate(s.createdAt)}</td>
                        <td style={{ ...TD_STYLE, textAlign: "right" }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                            {confirmId === s._id ? (
                              <>
                                <button
                                  onClick={e => { e.stopPropagation(); handleQuickDelete(e, s._id); }}
                                  disabled={deletingId === s._id}
                                  style={{ background: "#dc2626", border: "none", color: "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.78rem", padding: "4px 10px", borderRadius: "0.5rem", cursor: "pointer", whiteSpace: "nowrap" }}
                                >
                                  {deletingId === s._id ? "…" : "Yes, delete"}
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); setConfirmId(null); }}
                                  style={{ background: "rgba(0,0,0,0.07)", border: "none", color: "rgba(45,45,45,0.6)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.78rem", padding: "4px 8px", borderRadius: "0.5rem", cursor: "pointer" }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={e => { e.stopPropagation(); handleQuickDelete(e, s._id); }}
                                disabled={deletingId === s._id}
                                style={{ background: "rgba(220,38,38,0.08)", border: "none", color: "#ef4444", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.78rem", padding: "4px 10px", borderRadius: "0.5rem", cursor: "pointer", whiteSpace: "nowrap" }}
                              >
                                🗑
                              </button>
                            )}
                            <button
                              onClick={e => { e.stopPropagation(); setSelectedStory(s); }}
                              style={{ background: "rgba(0,184,166,0.1)", border: "none", color: "var(--lf-teal)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.8rem", padding: "4px 12px", borderRadius: "0.5rem", cursor: "pointer", whiteSpace: "nowrap" }}
                            >
                              View →
                            </button>
                            <button
                              onClick={e => handleGenerateChallenge(e, s._id)}
                              disabled={generatingId === s._id}
                              style={{ background: genResult[s._id] === "error" ? "rgba(220,38,38,0.08)" : "rgba(124,77,255,0.1)", border: "none", color: genResult[s._id] === "error" ? "#ef4444" : "#7c4dff", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.8rem", padding: "4px 10px", borderRadius: "0.5rem", cursor: generatingId === s._id ? "default" : "pointer", whiteSpace: "nowrap" }}
                              title="Generate a new Story Challenge for this story"
                            >
                              {generatingId === s._id ? "…" : genResult[s._id] === "ok" ? "✓ Done" : genResult[s._id] === "error" ? "✗ Error" : "⚡ Challenge"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Tab: Users ───────────────────────────────────────────────────────────────

function SubscriptionBadge({ subscription }: { subscription: any }) {
  if (!subscription || subscription.status !== "active") {
    return (
      <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "999px", background: "rgba(0,0,0,0.06)", color: "rgba(45,45,45,0.5)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.75rem" }}>
        Free
      </span>
    );
  }
  const isYearly = subscription.interval === "yearly";
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "999px", background: isYearly ? "rgba(0,184,166,0.12)" : "rgba(249,199,0,0.18)", color: isYearly ? "#0d7a6e" : "#8a6900", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.75rem" }}>
      {isYearly ? "✦ Yearly" : "✦ Monthly"}
    </span>
  );
}

function DrawerSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)", borderRadius: "1rem", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
      <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "0.78rem", color: "rgba(45,45,45,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>{title}</p>
      {children}
    </div>
  );
}

function DrawerRow({ label, value, children }: { label: string; value?: string | number | null; children?: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
      <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "rgba(45,45,45,0.5)", flexShrink: 0 }}>{label}</span>
      {children ?? (
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.88rem", color: value != null ? "var(--lf-dark)" : "rgba(45,45,45,0.3)", fontWeight: 500, textAlign: "right" }}>
          {value ?? "-"}
        </span>
      )}
    </div>
  );
}

function UserDrawer({ user, onClose }: { user: any; onClose: () => void }) {
  const adminAddCredits = useMutation((api as any).auth.adminAddCredits);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adjustResult, setAdjustResult] = useState<{ ok: boolean; balance?: number; msg?: string } | null>(null);
  const [liveCredits, setLiveCredits] = useState<number | null>(null);

  async function handleAdjust(sign: 1 | -1) {
    const n = parseInt(amount, 10);
    if (!n || n <= 0) return;
    setSaving(true);
    setAdjustResult(null);
    try {
      const result: any = await adminAddCredits({
        userId: user.id,
        userEmail: user.email,
        credits: sign * n,
        note: note || undefined,
        sendEmail,
      });
      setAmount("");
      setNote("");
      setLiveCredits(result.newBalance);
      setAdjustResult({ ok: true, balance: result.newBalance });
      setTimeout(() => setAdjustResult(null), 5000);
    } catch (e: any) {
      setAdjustResult({ ok: false, msg: e?.message ?? "Failed" });
      setTimeout(() => setAdjustResult(null), 4000);
    } finally {
      setSaving(false);
    }
  }

  const availableCredits = liveCredits ?? user.credits?.available ?? null;

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100 }}
      />
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: "min(520px,100vw)", background: "#fffef9",
          zIndex: 101, overflowY: "auto",
          boxShadow: "-8px 0 48px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ background: "var(--lf-dark)", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
          <div>
            <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#fff", margin: 0 }}>
              {user.name ?? user.email}
            </p>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", margin: "3px 0 0" }}>
              {user.email}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.8)", borderRadius: "0.5rem", padding: "6px 14px", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.85rem" }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>

          {/* Account overview */}
          <DrawerSection title="Account">
            <DrawerRow label="Email" value={user.email} />
            <DrawerRow label="Joined" value={formatDate(user.createdAt)} />
            {(user.profile?.city || user.profile?.country) && (
              <DrawerRow label="Location" value={[user.profile.city, user.profile.country].filter(Boolean).join(", ")} />
            )}
            <DrawerRow label="Plan">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <SubscriptionBadge subscription={user.subscription} />
                {user.subscription?.createdAt && (
                  <span style={{ fontSize: "0.75rem", color: "rgba(45,45,45,0.4)" }}>
                    since {formatDate(user.subscription.createdAt)}
                  </span>
                )}
              </div>
            </DrawerRow>
          </DrawerSection>

          {/* Credits */}
          <DrawerSection title="Credits">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
              {[
                { label: "Available", val: availableCredits, accent: true },
                { label: "Total Given", val: user.credits?.total ?? "-" },
                { label: "Used", val: user.credits?.used ?? "-" },
              ].map(({ label, val, accent }) => (
                <div key={label} style={{ background: accent ? "rgba(0,184,166,0.08)" : "rgba(0,0,0,0.04)", borderRadius: "0.7rem", padding: "12px 14px" }}>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.7rem", fontWeight: 700, color: "rgba(45,45,45,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>{label}</p>
                  <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.6rem", color: accent ? "var(--lf-teal)" : "var(--lf-dark)", margin: 0, lineHeight: 1 }}>
                    {val ?? "-"}
                  </p>
                </div>
              ))}
            </div>

            {adjustResult && (
              <div style={{ padding: "10px 14px", borderRadius: "0.6rem", marginBottom: 10, background: adjustResult.ok ? "rgba(0,184,166,0.1)" : "rgba(220,38,38,0.08)", border: `1px solid ${adjustResult.ok ? "rgba(0,184,166,0.2)" : "rgba(220,38,38,0.15)"}` }}>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: adjustResult.ok ? "#0d7a6e" : "#b91c1c" }}>
                  {adjustResult.ok
                    ? `✓ Done! New balance: ${adjustResult.balance} credits`
                    : `✗ ${adjustResult.msg}`}
                </span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Number of credits"
                style={InputStyle()}
              />
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Note for user (e.g. bonus for early access)"
                style={InputStyle()}
              />
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "rgba(45,45,45,0.65)" }}>
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={e => setSendEmail(e.target.checked)}
                  style={{ width: 15, height: 15, cursor: "pointer" }}
                />
                Email user about this change
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => handleAdjust(1)}
                  disabled={saving || !amount}
                  style={{ flex: 1, padding: "10px", borderRadius: "0.7rem", border: "none", background: "rgba(0,184,166,0.12)", color: "#0d7a6e", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.88rem", cursor: saving || !amount ? "not-allowed" : "pointer", opacity: saving || !amount ? 0.5 : 1 }}
                >
                  {saving ? "…" : "+ Add Credits"}
                </button>
                <button
                  onClick={() => handleAdjust(-1)}
                  disabled={saving || !amount}
                  style={{ flex: 1, padding: "10px", borderRadius: "0.7rem", border: "none", background: "rgba(220,38,38,0.08)", color: "#b91c1c", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.88rem", cursor: saving || !amount ? "not-allowed" : "pointer", opacity: saving || !amount ? 0.5 : 1 }}
                >
                  {saving ? "…" : "− Remove Credits"}
                </button>
              </div>
            </div>
          </DrawerSection>

          {/* Story stats */}
          <DrawerSection title="Story Activity">
            <DrawerRow label="Total stories" value={user.storyCount ?? 0} />
            <DrawerRow label="Last story" value={formatDate(user.lastStoryAt)} />
            <DrawerRow label="Current streak" value={`${user.profile?.currentStreak ?? 0} days 🔥`} />
            <DrawerRow label="Longest streak" value={`${user.profile?.longestStreak ?? 0} days`} />
          </DrawerSection>

          {/* Child 1 */}
          {user.profile && (
            <DrawerSection title={user.profile.child2Name ? "Child 1" : "Child Profile"}>
              <DrawerRow label="Name" value={user.profile.childName} />
              {user.profile.childNickName && <DrawerRow label="Nickname" value={user.profile.childNickName} />}
              <DrawerRow label="Age" value={user.profile.childAge != null ? `${user.profile.childAge} yrs` : null} />
              <DrawerRow label="Gender" value={user.profile.childGender} />
              {user.profile.favoriteColor && <DrawerRow label="Fav colour" value={user.profile.favoriteColor} />}
              {user.profile.favoriteAnimal && <DrawerRow label="Fav animal" value={user.profile.favoriteAnimal} />}
            </DrawerSection>
          )}

          {/* Child 2 */}
          {user.profile?.child2Name && (
            <DrawerSection title="Child 2">
              <DrawerRow label="Name" value={user.profile.child2Name} />
              {user.profile.child2NickName && <DrawerRow label="Nickname" value={user.profile.child2NickName} />}
              <DrawerRow label="Age" value={user.profile.child2Age != null ? `${user.profile.child2Age} yrs` : null} />
              <DrawerRow label="Gender" value={user.profile.child2Gender} />
              {user.profile.child2FavoriteColor && <DrawerRow label="Fav colour" value={user.profile.child2FavoriteColor} />}
              {user.profile.child2FavoriteAnimal && <DrawerRow label="Fav animal" value={user.profile.child2FavoriteAnimal} />}
            </DrawerSection>
          )}
        </div>
      </div>
    </>
  );
}

function UsersTabInner({ isAdmin }: { isAdmin: boolean }) {
  const users = useQuery(api.auth.listAllUsers, isAdmin ? {} : "skip") as any[] | undefined;
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!users) return [];
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u: any) =>
      (u.name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      (u.profile?.childName ?? "").toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <>
      {selectedUser && (
        <UserDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input
            placeholder="Search by name, email, child…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...InputStyle(), maxWidth: 300 }}
          />
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "rgba(45,45,45,0.5)", marginLeft: "auto" }}>
            {users === undefined ? "Loading…" : `${filtered.length} users`}
          </span>
        </div>

        {users === undefined ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={TABLE_STYLE}>
              <thead>
                <tr>
                  <th style={TH_STYLE}>User</th>
                  <th style={TH_STYLE}>Child</th>
                  <th style={TH_STYLE}>Location</th>
                  <th style={TH_STYLE}>Joined</th>
                  <th style={TH_STYLE}>Credits</th>
                  <th style={TH_STYLE}>Plan</th>
                  <th style={TH_STYLE}>Stories</th>
                  <th style={TH_STYLE}>Last Story</th>
                  <th style={TH_STYLE}>Streak</th>
                  <th style={{ ...TH_STYLE, textAlign: "right" }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ ...TD_STYLE, textAlign: "center", color: "rgba(45,45,45,0.4)", padding: 32 }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  filtered.map((u: any, i: number) => (
                    <tr
                      key={u.id}
                      style={{ background: i % 2 === 0 ? "#fff" : "rgba(0,0,0,0.02)", cursor: "pointer" }}
                      onClick={() => setSelectedUser(u)}
                    >
                      <td style={TD_STYLE}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          <span style={{ fontWeight: 700 }}>{u.name ?? "-"}</span>
                          <span style={{ fontSize: "0.78rem", color: "rgba(45,45,45,0.5)" }}>{u.email}</span>
                        </div>
                      </td>
                      <td style={TD_STYLE}>
                        {u.profile ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            <span style={{ fontWeight: 600 }}>{u.profile.childName}</span>
                            <span style={{ fontSize: "0.78rem", color: "rgba(45,45,45,0.5)" }}>
                              Age {u.profile.childAge}
                              {u.profile.child2Name && ` + ${u.profile.child2Name}`}
                            </span>
                          </div>
                        ) : <span style={{ color: "rgba(45,45,45,0.3)" }}>-</span>}
                      </td>
                      <td style={{ ...TD_STYLE, fontSize: "0.83rem" }}>
                        {u.profile?.city || u.profile?.country ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            {u.profile.city && <span>{u.profile.city}</span>}
                            {u.profile.country && <span style={{ color: "rgba(45,45,45,0.5)" }}>{u.profile.country}</span>}
                          </div>
                        ) : <span style={{ color: "rgba(45,45,45,0.3)" }}>-</span>}
                      </td>
                      <td style={{ ...TD_STYLE, whiteSpace: "nowrap", fontSize: "0.83rem" }}>
                        {formatDate(u.createdAt)}
                      </td>
                      <td style={TD_STYLE}>
                        {u.credits ? (
                          <div>
                            <span style={{ fontWeight: 700, color: "var(--lf-teal)" }}>{u.credits.available}</span>
                            <span style={{ fontSize: "0.74rem", color: "rgba(45,45,45,0.4)" }}> / {u.credits.total}</span>
                          </div>
                        ) : (
                          <span style={{ color: "rgba(45,45,45,0.3)", fontSize: "0.82rem" }}>-</span>
                        )}
                      </td>
                      <td style={TD_STYLE}>
                        <SubscriptionBadge subscription={u.subscription} />
                      </td>
                      <td style={{ ...TD_STYLE, fontWeight: 700 }}>{u.storyCount ?? 0}</td>
                      <td style={{ ...TD_STYLE, whiteSpace: "nowrap", fontSize: "0.82rem" }}>
                        {formatDate(u.lastStoryAt)}
                      </td>
                      <td style={TD_STYLE}>
                        <span style={{ fontWeight: 600 }}>{u.profile?.currentStreak ?? 0}</span>
                        <span style={{ fontSize: "0.74rem", color: "rgba(45,45,45,0.4)" }}>
                          {" "}/ {u.profile?.longestStreak ?? 0}
                        </span>
                      </td>
                      <td style={{ ...TD_STYLE, textAlign: "right" }}>
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedUser(u); }}
                          style={{ background: "rgba(0,184,166,0.1)", border: "none", color: "var(--lf-teal)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.8rem", padding: "4px 12px", borderRadius: "0.5rem", cursor: "pointer", whiteSpace: "nowrap" }}
                        >
                          Details →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function UsersTab({ isAdmin }: { isAdmin: boolean }) {
  return (
    <TabErrorBoundary>
      <UsersTabInner isAdmin={isAdmin} />
    </TabErrorBoundary>
  );
}

// ─── Tab: Blog ────────────────────────────────────────────────────────────────

// Displays static blog posts (from blog-data.ts) as read-only cards
function StaticBlogList() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {BLOG_POSTS.map((post) => (
        <div
          key={post.slug}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "12px 16px",
            background: "#fff",
            border: "1.5px solid rgba(0,0,0,0.06)",
            borderRadius: "0.8rem",
          }}
        >
          <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>{post.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.92rem", color: "var(--lf-dark)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {post.title}
            </p>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", color: "rgba(45,45,45,0.5)", margin: "2px 0 0" }}>
              {post.date} · {post.readTime} · <span style={{ color: post.tagColor, fontWeight: 700 }}>{post.tag}</span>
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{ background: "rgba(0,184,166,0.1)", color: "#0d7a6e", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.72rem", padding: "2px 8px", borderRadius: "999px" }}>
              Published
            </span>
            <span style={{ background: "rgba(0,0,0,0.06)", color: "rgba(45,45,45,0.5)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.72rem", padding: "2px 8px", borderRadius: "999px" }}>
              📄 Static
            </span>
            <Link
              href={`/blog/${post.slug}`}
              target="_blank"
              style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "var(--lf-teal)", textDecoration: "none" }}
            >
              View ↗
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

type BlogFormData = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: "draft" | "published";
};

const BLANK_BLOG: BlogFormData = { title: "", slug: "", excerpt: "", content: "", status: "draft" };

function BlogTab({ isAdmin }: { isAdmin: boolean }) {
  const blogs = useQuery(api.blogs.listAll, isAdmin ? {} : "skip") as any[] | undefined;
  const createBlog = useMutation(api.blogs.create);
  const updateBlog = useMutation(api.blogs.update);
  const removeBlog = useMutation(api.blogs.remove);

  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BlogFormData>(BLANK_BLOG);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openNew() {
    setEditingId(null);
    setForm(BLANK_BLOG);
    setError(null);
    setView("form");
  }

  function openEdit(blog: any) {
    setEditingId(blog._id);
    setForm({
      title: blog.title ?? "",
      slug: blog.slug ?? "",
      excerpt: blog.excerpt ?? "",
      content: typeof blog.content === "string" ? blog.content : JSON.stringify(blog.content ?? ""),
      status: blog.status ?? "draft",
    });
    setError(null);
    setView("form");
  }

  function handleTitleChange(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug: editingId ? f.slug : slugify(title),
    }));
  }

  async function handleSave() {
    if (!form.title.trim() || !form.slug.trim()) {
      setError("Title and slug are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateBlog({
          blogId: editingId as any,
          title: form.title,
          slug: form.slug,
          excerpt: form.excerpt || undefined,
          content: form.content,
          status: form.status,
        });
      } else {
        await createBlog({
          title: form.title,
          slug: form.slug,
          excerpt: form.excerpt || undefined,
          content: form.content,
          status: form.status,
        });
      }
      setView("list");
    } catch (e: any) {
      setError(e?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    try {
      await removeBlog({ blogId: id as any });
    } catch (e: any) {
      alert(e?.message ?? "Failed to delete.");
    }
  }

  if (view === "form") {
    return (
      <div
        style={{
          background: "#fff",
          border: "1.5px solid rgba(0,0,0,0.06)",
          borderRadius: "1rem",
          padding: "28px 28px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          maxWidth: 680,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "var(--lf-dark)", margin: 0 }}>
            {editingId ? "Edit Post" : "New Post"}
          </h3>
          <button
            onClick={() => setView("list")}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: "0.9rem", color: "rgba(45,45,45,0.5)" }}
          >
            Cancel
          </button>
        </div>

        {error && (
          <div style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "0.6rem", padding: "10px 14px", fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "#b91c1c" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "rgba(45,45,45,0.6)" }}>Title *</label>
          <input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} style={InputStyle()} placeholder="Post title" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "rgba(45,45,45,0.6)" }}>Slug *</label>
          <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} style={InputStyle()} placeholder="post-url-slug" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "rgba(45,45,45,0.6)" }}>Excerpt</label>
          <textarea
            value={form.excerpt}
            onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
            rows={2}
            style={{ ...InputStyle(), resize: "vertical" }}
            placeholder="Short description…"
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "rgba(45,45,45,0.6)" }}>Content</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            rows={8}
            style={{ ...InputStyle(), resize: "vertical", fontFamily: "monospace", fontSize: "0.85rem" }}
            placeholder="Blog post content (text or JSON)…"
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "rgba(45,45,45,0.6)" }}>Status</label>
          <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "draft" | "published" }))} style={{ ...InputStyle(), width: "auto" }}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={() => setView("list")}
            style={{ padding: "9px 20px", borderRadius: "0.7rem", border: "1.5px solid rgba(0,0,0,0.12)", background: "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", color: "var(--lf-dark)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: "9px 22px", borderRadius: "0.7rem", background: "var(--lf-teal)", border: "none", color: "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.9rem", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8 }}
          >
            {saving && <Spinner />}
            {saving ? "Saving…" : editingId ? "Update" : "Create"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Static blog posts (from codebase) ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1rem", color: "var(--lf-dark)", margin: 0 }}>
              Static Posts ({BLOG_POSTS.length})
            </h3>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", color: "rgba(45,45,45,0.45)", margin: "2px 0 0" }}>
              Hardcoded in codebase: edit via <code style={{ background: "rgba(0,0,0,0.05)", padding: "1px 5px", borderRadius: "0.3rem" }}>src/lib/blog-data.ts</code>
            </p>
          </div>
        </div>
        <StaticBlogList />
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: "rgba(0,0,0,0.07)" }} />

      {/* ── CMS blog posts (from Convex) ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1rem", color: "var(--lf-dark)", margin: 0 }}>
              CMS Posts {blogs !== undefined ? `(${blogs.length})` : ""}
            </h3>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", color: "rgba(45,45,45,0.45)", margin: "2px 0 0" }}>
              Managed via Convex database: create, edit, publish here
            </p>
          </div>
          <button onClick={openNew} style={{ padding: "9px 20px", borderRadius: "0.7rem", background: "var(--lf-teal)", border: "none", color: "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>
            + New Post
          </button>
        </div>

        {blogs === undefined ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={TABLE_STYLE}>
              <thead>
                <tr>
                  <th style={TH_STYLE}>Title</th>
                  <th style={TH_STYLE}>Slug</th>
                  <th style={TH_STYLE}>Status</th>
                  <th style={TH_STYLE}>Date</th>
                  <th style={{ ...TH_STYLE, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ ...TD_STYLE, textAlign: "center", color: "rgba(45,45,45,0.4)", padding: 32 }}>
                      No CMS posts yet: create one above
                    </td>
                  </tr>
                ) : (
                  blogs.map((b: any, i: number) => (
                    <tr key={b._id} style={{ background: i % 2 === 0 ? "#fff" : "rgba(0,0,0,0.02)" }}>
                      <td style={{ ...TD_STYLE, fontWeight: 600 }}>{b.title ?? "Untitled"}</td>
                      <td style={{ ...TD_STYLE, color: "rgba(45,45,45,0.5)", fontFamily: "monospace", fontSize: "0.82rem" }}>{b.slug}</td>
                      <td style={TD_STYLE}><StatusBadge status={b.status} /></td>
                      <td style={{ ...TD_STYLE, whiteSpace: "nowrap" }}>{formatDate(b.createdAt)}</td>
                      <td style={{ ...TD_STYLE, textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          onClick={() => openEdit(b)}
                          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "var(--lf-teal)", marginRight: 12 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(b._id)}
                          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#dc2626" }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Assets ──────────────────────────────────────────────────────────────

function AssetsTab({ isAdmin }: { isAdmin: boolean }) {
  const stories = useQuery(api.stories.listAll, isAdmin ? {} : "skip") as any[] | undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.88rem", color: "rgba(45,45,45,0.5)", margin: 0 }}>
        Overview of story assets. Showing title, scene count, and audio status per story.
      </p>

      {stories === undefined ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {stories.length === 0 ? (
            <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(45,45,45,0.4)" }}>No stories found</p>
          ) : (
            stories.map((s: any) => {
              const sceneCount = s.sceneMetadata?.length ?? 0;
              const imagesCount = s.sceneMetadata?.filter((sc: any) => sc.filePath && sc.filePath !== "").length ?? 0;
              const hasAudio = !!s.narrationFilePath;

              return (
                <div
                  key={s._id}
                  style={{
                    background: "#fff",
                    border: "1.5px solid rgba(0,0,0,0.06)",
                    borderRadius: "0.9rem",
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "var(--lf-dark)", margin: 0, lineHeight: 1.3 }}>
                    {s.title ?? "Untitled"}
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", fontWeight: 600, background: "rgba(0,0,0,0.05)", color: "rgba(45,45,45,0.65)", padding: "2px 9px", borderRadius: "999px" }}>
                      {sceneCount} scenes
                    </span>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", fontWeight: 600, background: imagesCount === sceneCount && sceneCount > 0 ? "rgba(0,184,166,0.1)" : "rgba(0,0,0,0.05)", color: imagesCount === sceneCount && sceneCount > 0 ? "#0d7a6e" : "rgba(45,45,45,0.5)", padding: "2px 9px", borderRadius: "999px" }}>
                      {imagesCount}/{sceneCount} images
                    </span>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", fontWeight: 600, background: hasAudio ? "rgba(0,184,166,0.1)" : "rgba(0,0,0,0.05)", color: hasAudio ? "#0d7a6e" : "rgba(45,45,45,0.5)", padding: "2px 9px", borderRadius: "999px" }}>
                      {hasAudio ? "Audio ready" : "No audio"}
                    </span>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Voice ───────────────────────────────────────────────────────────────

function VoiceTab({ isAdmin }: { isAdmin: boolean }) {
  const voiceModels = useQuery(api["migration/voice_models"].list, isAdmin ? {} : "skip") as any[] | undefined;
  const updateVoice = useMutation(api["migration/voice_models"].update);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  function startEdit(model: any) {
    setEditingId(model._id);
    setEditValue(model.voiceId ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue("");
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      await updateVoice({ id: id as any, voiceId: editValue });
      setEditingId(null);
      setEditValue("");
    } catch (e: any) {
      alert(e?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {voiceModels === undefined ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={TABLE_STYLE}>
            <thead>
              <tr>
                <th style={TH_STYLE}>Model Name</th>
                <th style={TH_STYLE}>Voice ID</th>
                <th style={{ ...TH_STYLE, textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {voiceModels.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ ...TD_STYLE, textAlign: "center", color: "rgba(45,45,45,0.4)", padding: 32 }}>
                    No voice models found
                  </td>
                </tr>
              ) : (
                voiceModels.map((m: any, i: number) => (
                  <tr key={m._id} style={{ background: i % 2 === 0 ? "#fff" : "rgba(0,0,0,0.02)" }}>
                    <td style={{ ...TD_STYLE, fontWeight: 600 }}>{m.name}</td>
                    <td style={TD_STYLE}>
                      {editingId === m._id ? (
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          style={{ ...InputStyle(), fontFamily: "monospace", fontSize: "0.85rem" }}
                          placeholder="ElevenLabs Voice ID"
                          autoFocus
                        />
                      ) : (
                        <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "rgba(45,45,45,0.7)" }}>
                          {m.voiceId ?? "-"}
                        </span>
                      )}
                    </td>
                    <td style={{ ...TD_STYLE, textAlign: "right", whiteSpace: "nowrap" }}>
                      {editingId === m._id ? (
                        <>
                          <button
                            onClick={() => saveEdit(m._id)}
                            disabled={saving}
                            style={{ background: "var(--lf-teal)", border: "none", color: "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.83rem", padding: "5px 14px", borderRadius: "0.5rem", cursor: saving ? "not-allowed" : "pointer", marginRight: 8, opacity: saving ? 0.7 : 1 }}
                          >
                            {saving ? "…" : "Save"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            style={{ background: "none", border: "1.5px solid rgba(0,0,0,0.12)", color: "rgba(45,45,45,0.6)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.83rem", padding: "5px 12px", borderRadius: "0.5rem", cursor: "pointer" }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startEdit(m)}
                          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "var(--lf-teal)" }}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Settings: Themes ─────────────────────────────────────────────────────────

function ThemesSettings({ isAdmin }: { isAdmin: boolean }) {
  const themes = useQuery(api["migration/theme"].list, isAdmin ? {} : "skip") as any[] | undefined;
  const createTheme = useMutation(api["migration/theme"].create);
  const updateTheme = useMutation(api["migration/theme"].update);
  const removeTheme = useMutation(api["migration/theme"].remove);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await createTheme({ name: newName.trim() });
      setNewName("");
    } catch (e: any) {
      alert(e?.message ?? "Failed to add.");
    } finally {
      setAdding(false);
    }
  }

  async function handleSaveEdit(id: string) {
    if (!editValue.trim()) return;
    setSaving(true);
    try {
      await updateTheme({ id: id as any, name: editValue.trim() });
      setEditingId(null);
    } catch (e: any) {
      alert(e?.message ?? "Failed to update.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this theme? This will also remove compatibility records.")) return;
    try {
      await removeTheme({ id: id as any });
    } catch (e: any) {
      alert(e?.message ?? "Failed to delete.");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>
      <h4 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1rem", color: "var(--lf-dark)", margin: 0 }}>Themes</h4>

      {themes === undefined ? (
        <Spinner />
      ) : (
        <div
          style={{
            background: "#fff",
            border: "1.5px solid rgba(0,0,0,0.06)",
            borderRadius: "1rem",
            overflow: "hidden",
          }}
        >
          {themes.map((t: any, i: number) => (
            <div
              key={t._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                background: i % 2 === 0 ? "#fff" : "rgba(0,0,0,0.02)",
                borderBottom: i < themes.length - 1 ? "1px solid rgba(0,0,0,0.04)" : undefined,
              }}
            >
              {editingId === t._id ? (
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  style={{ ...InputStyle(), flex: 1 }}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(t._id); if (e.key === "Escape") setEditingId(null); }}
                />
              ) : (
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.9rem", color: "var(--lf-dark)", flex: 1 }}>{t.name}</span>
              )}
              {editingId === t._id ? (
                <>
                  <button onClick={() => handleSaveEdit(t._id)} disabled={saving} style={{ background: "var(--lf-teal)", border: "none", color: "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.8rem", padding: "4px 12px", borderRadius: "0.5rem", cursor: "pointer" }}>Save</button>
                  <button onClick={() => setEditingId(null)} style={{ background: "none", border: "1px solid rgba(0,0,0,0.12)", color: "rgba(45,45,45,0.5)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.8rem", padding: "4px 10px", borderRadius: "0.5rem", cursor: "pointer" }}>Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setEditingId(t._id); setEditValue(t.name); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "var(--lf-teal)" }}>Edit</button>
                  <button onClick={() => handleDelete(t._id)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#dc2626" }}>Delete</button>
                </>
              )}
            </div>
          ))}

          {/* Add new */}
          <div style={{ display: "flex", gap: 10, padding: "12px 16px", borderTop: "1.5px solid rgba(0,0,0,0.06)", background: "#fafaf9" }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New theme name…"
              style={{ ...InputStyle(), flex: 1 }}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
              style={{ padding: "8px 16px", borderRadius: "0.6rem", background: "var(--lf-teal)", border: "none", color: "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.85rem", cursor: adding || !newName.trim() ? "not-allowed" : "pointer", opacity: adding || !newName.trim() ? 0.6 : 1, whiteSpace: "nowrap" }}
            >
              {adding ? "…" : "Add"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Settings: Lessons ────────────────────────────────────────────────────────

function LessonsSettings({ isAdmin }: { isAdmin: boolean }) {
  const lessons = useQuery(api["migration/lesson"].list, isAdmin ? {} : "skip") as any[] | undefined;
  const createLesson = useMutation(api["migration/lesson"].create);
  const updateLesson = useMutation(api["migration/lesson"].update);
  const removeLesson = useMutation(api["migration/lesson"].remove);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await createLesson({ name: newName.trim() });
      setNewName("");
    } catch (e: any) {
      alert(e?.message ?? "Failed to add.");
    } finally {
      setAdding(false);
    }
  }

  async function handleSaveEdit(id: string) {
    if (!editValue.trim()) return;
    setSaving(true);
    try {
      await updateLesson({ id: id as any, name: editValue.trim() });
      setEditingId(null);
    } catch (e: any) {
      alert(e?.message ?? "Failed to update.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this lesson?")) return;
    try {
      await removeLesson({ id: id as any });
    } catch (e: any) {
      alert(e?.message ?? "Failed to delete.");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>
      <h4 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1rem", color: "var(--lf-dark)", margin: 0 }}>Lessons</h4>

      {lessons === undefined ? (
        <Spinner />
      ) : (
        <div
          style={{
            background: "#fff",
            border: "1.5px solid rgba(0,0,0,0.06)",
            borderRadius: "1rem",
            overflow: "hidden",
          }}
        >
          {lessons.map((l: any, i: number) => (
            <div
              key={l._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                background: i % 2 === 0 ? "#fff" : "rgba(0,0,0,0.02)",
                borderBottom: i < lessons.length - 1 ? "1px solid rgba(0,0,0,0.04)" : undefined,
              }}
            >
              {editingId === l._id ? (
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  style={{ ...InputStyle(), flex: 1 }}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(l._id); if (e.key === "Escape") setEditingId(null); }}
                />
              ) : (
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.9rem", color: "var(--lf-dark)", flex: 1 }}>{l.name}</span>
              )}
              {editingId === l._id ? (
                <>
                  <button onClick={() => handleSaveEdit(l._id)} disabled={saving} style={{ background: "var(--lf-teal)", border: "none", color: "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.8rem", padding: "4px 12px", borderRadius: "0.5rem", cursor: "pointer" }}>Save</button>
                  <button onClick={() => setEditingId(null)} style={{ background: "none", border: "1px solid rgba(0,0,0,0.12)", color: "rgba(45,45,45,0.5)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.8rem", padding: "4px 10px", borderRadius: "0.5rem", cursor: "pointer" }}>Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setEditingId(l._id); setEditValue(l.name); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "var(--lf-teal)" }}>Edit</button>
                  <button onClick={() => handleDelete(l._id)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#dc2626" }}>Delete</button>
                </>
              )}
            </div>
          ))}

          {/* Add new */}
          <div style={{ display: "flex", gap: 10, padding: "12px 16px", borderTop: "1.5px solid rgba(0,0,0,0.06)", background: "#fafaf9" }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New lesson name…"
              style={{ ...InputStyle(), flex: 1 }}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
              style={{ padding: "8px 16px", borderRadius: "0.6rem", background: "var(--lf-teal)", border: "none", color: "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.85rem", cursor: adding || !newName.trim() ? "not-allowed" : "pointer", opacity: adding || !newName.trim() ? 0.6 : 1, whiteSpace: "nowrap" }}
            >
              {adding ? "…" : "Add"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Settings ────────────────────────────────────────────────────────────

function SettingsTab({ isAdmin }: { isAdmin: boolean }) {
  const [subTab, setSubTab] = useState<SettingsSubTab>("themes");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 4 }}>
        {(["themes", "lessons"] as SettingsSubTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            style={{
              padding: "7px 18px",
              borderRadius: "0.6rem",
              border: "none",
              background: subTab === t ? "rgba(0,184,166,0.12)" : "transparent",
              color: subTab === t ? "var(--lf-teal)" : "rgba(45,45,45,0.55)",
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700,
              fontSize: "0.88rem",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {subTab === "themes" && <ThemesSettings isAdmin={isAdmin} />}
      {subTab === "lessons" && <LessonsSettings isAdmin={isAdmin} />}
    </div>
  );
}

// ─── Tab: Story Types ─────────────────────────────────────────────────────────

function StoryTypesTab({ isAdmin }: { isAdmin: boolean }) {
  const storyTypes = useQuery((api as any)["migration/story_types"].listAll, isAdmin ? {} : "skip") as any[] | undefined;
  const updateStoryType = useMutation((api as any)["migration/story_types"].update);
  const seedStoryTypes = useMutation((api as any)["migration/story_types"].seed);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; emoji: string; description: string; promptHint: string; isActive: boolean }>({
    name: "", emoji: "", description: "", promptHint: "", isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  function startEdit(st: any) {
    setEditingId(st._id);
    setEditForm({
      name: st.name ?? "",
      emoji: st.emoji ?? "",
      description: st.description ?? "",
      promptHint: st.promptHint ?? "",
      isActive: st.isActive ?? true,
    });
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      await updateStoryType({ id: id as any, ...editForm });
      setEditingId(null);
    } catch (e: any) {
      alert(e?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    setSeedResult(null);
    try {
      const result: any = await seedStoryTypes({});
      setSeedResult(`Seeded ${result.seeded} story type(s).`);
      setTimeout(() => setSeedResult(null), 4000);
    } catch (e: any) {
      setSeedResult(`Error: ${e?.message}`);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "var(--lf-dark)", margin: "0 0 4px" }}>Story Types</h3>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "rgba(45,45,45,0.5)", margin: 0 }}>
            Configure the 3 story types shown on the generate page.
          </p>
        </div>
        <button
          onClick={handleSeed}
          disabled={seeding}
          style={{ padding: "8px 16px", borderRadius: "0.6rem", background: "rgba(0,0,0,0.06)", border: "none", color: "rgba(45,45,45,0.7)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.85rem", cursor: seeding ? "not-allowed" : "pointer", whiteSpace: "nowrap", opacity: seeding ? 0.6 : 1 }}
        >
          {seeding ? "…" : "Seed defaults"}
        </button>
      </div>

      {seedResult && (
        <div style={{ padding: "10px 16px", background: "rgba(0,184,166,0.1)", border: "1px solid rgba(0,184,166,0.2)", borderRadius: "0.7rem" }}>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#0d7a6e" }}>{seedResult}</span>
        </div>
      )}

      {storyTypes === undefined ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
      ) : storyTypes.length === 0 ? (
        <div style={{ padding: "40px 24px", textAlign: "center", background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)", borderRadius: "1rem" }}>
          <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(45,45,45,0.4)", margin: "0 0 12px" }}>No story types found. Click &quot;Seed defaults&quot; to add them.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {storyTypes.map((st: any) => (
            <div key={st._id} style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)", borderRadius: "1rem", padding: "18px 20px" }}>
              {editingId === st._id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input value={editForm.emoji} onChange={e => setEditForm(f => ({ ...f, emoji: e.target.value }))} placeholder="Emoji" style={{ ...InputStyle(), width: 70 }} />
                    <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" style={{ ...InputStyle(), flex: 1 }} />
                    <label style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem" }}>
                      <input type="checkbox" checked={editForm.isActive} onChange={e => setEditForm(f => ({ ...f, isActive: e.target.checked }))} />
                      Active
                    </label>
                  </div>
                  <input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description for UI" style={InputStyle()} />
                  <textarea value={editForm.promptHint} onChange={e => setEditForm(f => ({ ...f, promptHint: e.target.value }))} placeholder="Prompt hint for AI…" rows={4} style={{ ...InputStyle(), resize: "vertical" as const, fontFamily: "monospace", fontSize: "0.82rem" }} />
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => saveEdit(st._id)} disabled={saving} style={{ padding: "8px 20px", borderRadius: "0.6rem", background: "var(--lf-teal)", border: "none", color: "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
                      {saving ? "…" : "Save"}
                    </button>
                    <button onClick={() => setEditingId(null)} style={{ padding: "8px 16px", borderRadius: "0.6rem", background: "none", border: "1.5px solid rgba(0,0,0,0.12)", color: "rgba(45,45,45,0.6)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <span style={{ fontSize: "1.8rem", flexShrink: 0, lineHeight: 1, marginTop: 2 }}>{st.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1rem", color: "var(--lf-dark)" }}>{st.name}</span>
                      <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.72rem", fontWeight: 700, padding: "1px 8px", borderRadius: "999px", background: st.isActive ? "rgba(0,184,166,0.1)" : "rgba(0,0,0,0.06)", color: st.isActive ? "#0d7a6e" : "rgba(45,45,45,0.5)" }}>
                        {st.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.83rem", color: "rgba(45,45,45,0.6)", margin: "0 0 6px" }}>{st.description}</p>
                    <p style={{ fontFamily: "monospace", fontSize: "0.76rem", color: "rgba(45,45,45,0.4)", margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" as const }}>{st.promptHint}</p>
                  </div>
                  <button onClick={() => startEdit(st)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "var(--lf-teal)", flexShrink: 0 }}>Edit</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Languages ───────────────────────────────────────────────────────────

function LanguagesTab({ isAdmin }: { isAdmin: boolean }) {
  const languages = useQuery((api as any)["migration/languages"].listAll, isAdmin ? {} : "skip") as any[] | undefined;
  const updateLanguage = useMutation((api as any)["migration/languages"].update);
  const toggleLanguage = useMutation((api as any)["migration/languages"].toggleActive);
  const seedLanguages = useMutation((api as any)["migration/languages"].seed);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", nativeName: "", flag: "", voiceGroup: "", isActive: true, sortOrder: 1 });
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  function startEdit(lang: any) {
    setEditingId(lang._id);
    setEditForm({ name: lang.name ?? "", nativeName: lang.nativeName ?? "", flag: lang.flag ?? "", voiceGroup: lang.voiceGroup ?? "english", isActive: lang.isActive ?? true, sortOrder: lang.sortOrder ?? 1 });
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      await updateLanguage({ id: id as any, ...editForm });
      setEditingId(null);
    } catch (e: any) {
      alert(e?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    setSeedResult(null);
    try {
      const result: any = await seedLanguages({});
      setSeedResult(`Seeded ${result.seeded} language(s).`);
      setTimeout(() => setSeedResult(null), 4000);
    } catch (e: any) {
      setSeedResult(`Error: ${e?.message}`);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "var(--lf-dark)", margin: "0 0 4px" }}>Languages</h3>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "rgba(45,45,45,0.5)", margin: 0 }}>
            Manage supported story languages. Voice group controls which TTS voices are used.
          </p>
        </div>
        <button
          onClick={handleSeed}
          disabled={seeding}
          style={{ padding: "8px 16px", borderRadius: "0.6rem", background: "rgba(0,0,0,0.06)", border: "none", color: "rgba(45,45,45,0.7)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.85rem", cursor: seeding ? "not-allowed" : "pointer", whiteSpace: "nowrap", opacity: seeding ? 0.6 : 1 }}
        >
          {seeding ? "…" : "Seed defaults"}
        </button>
      </div>

      {seedResult && (
        <div style={{ padding: "10px 16px", background: "rgba(0,184,166,0.1)", border: "1px solid rgba(0,184,166,0.2)", borderRadius: "0.7rem" }}>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#0d7a6e" }}>{seedResult}</span>
        </div>
      )}

      {languages === undefined ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={TABLE_STYLE}>
            <thead>
              <tr>
                <th style={TH_STYLE}>Flag</th>
                <th style={TH_STYLE}>Name</th>
                <th style={TH_STYLE}>Native</th>
                <th style={TH_STYLE}>Code</th>
                <th style={TH_STYLE}>Voice Group</th>
                <th style={TH_STYLE}>Order</th>
                <th style={TH_STYLE}>Status</th>
                <th style={{ ...TH_STYLE, textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {(languages ?? []).map((lang: any, i: number) => (
                <tr key={lang._id} style={{ background: i % 2 === 0 ? "#fff" : "rgba(0,0,0,0.02)" }}>
                  {editingId === lang._id ? (
                    <td colSpan={8} style={TD_STYLE}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        <input value={editForm.flag} onChange={e => setEditForm(f => ({ ...f, flag: e.target.value }))} placeholder="🏳️" style={{ ...InputStyle(), width: 60 }} />
                        <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" style={{ ...InputStyle(), width: 120 }} />
                        <input value={editForm.nativeName} onChange={e => setEditForm(f => ({ ...f, nativeName: e.target.value }))} placeholder="Native name" style={{ ...InputStyle(), width: 120 }} />
                        <select value={editForm.voiceGroup} onChange={e => setEditForm(f => ({ ...f, voiceGroup: e.target.value }))} style={{ ...InputStyle(), width: "auto" }}>
                          <option value="english">english</option>
                          <option value="hindi">hindi</option>
                        </select>
                        <input type="number" value={editForm.sortOrder} onChange={e => setEditForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 1 }))} style={{ ...InputStyle(), width: 70 }} />
                        <label style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem" }}>
                          <input type="checkbox" checked={editForm.isActive} onChange={e => setEditForm(f => ({ ...f, isActive: e.target.checked }))} /> Active
                        </label>
                        <button onClick={() => saveEdit(lang._id)} disabled={saving} style={{ padding: "6px 14px", borderRadius: "0.5rem", background: "var(--lf-teal)", border: "none", color: "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>
                          {saving ? "…" : "Save"}
                        </button>
                        <button onClick={() => setEditingId(null)} style={{ padding: "6px 12px", borderRadius: "0.5rem", background: "none", border: "1px solid rgba(0,0,0,0.12)", color: "rgba(45,45,45,0.6)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>Cancel</button>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td style={TD_STYLE}><span style={{ fontSize: "1.2rem" }}>{lang.flag}</span></td>
                      <td style={{ ...TD_STYLE, fontWeight: 600 }}>{lang.name}</td>
                      <td style={TD_STYLE}>{lang.nativeName}</td>
                      <td style={{ ...TD_STYLE, fontFamily: "monospace", fontSize: "0.82rem", color: "rgba(45,45,45,0.5)" }}>{lang.code}</td>
                      <td style={TD_STYLE}>
                        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.76rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px", background: lang.voiceGroup === "english" ? "rgba(0,0,0,0.06)" : "rgba(0,184,166,0.1)", color: lang.voiceGroup === "english" ? "rgba(45,45,45,0.6)" : "#0d7a6e" }}>
                          {lang.voiceGroup}
                        </span>
                      </td>
                      <td style={TD_STYLE}>{lang.sortOrder}</td>
                      <td style={TD_STYLE}>
                        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.76rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px", background: lang.isActive ? "rgba(0,184,166,0.1)" : "rgba(0,0,0,0.06)", color: lang.isActive ? "#0d7a6e" : "rgba(45,45,45,0.5)" }}>
                          {lang.isActive ? "Active" : "Off"}
                        </span>
                      </td>
                      <td style={{ ...TD_STYLE, textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                          <button
                            onClick={async () => {
                              setTogglingId(lang._id);
                              try { await toggleLanguage({ id: lang._id, isActive: !lang.isActive }); }
                              catch (e: any) { alert(e?.message ?? "Failed"); }
                              finally { setTogglingId(null); }
                            }}
                            disabled={togglingId === lang._id}
                            style={{ padding: "4px 12px", borderRadius: "0.5rem", background: lang.isActive ? "rgba(239,68,68,0.08)" : "rgba(0,184,166,0.1)", border: `1px solid ${lang.isActive ? "rgba(239,68,68,0.25)" : "rgba(0,184,166,0.3)"}`, color: lang.isActive ? "#dc2626" : "#0d7a6e", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", opacity: togglingId === lang._id ? 0.5 : 1 }}
                          >
                            {togglingId === lang._id ? "…" : lang.isActive ? "Disable" : "Enable"}
                          </button>
                          <button onClick={() => startEdit(lang)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "var(--lf-teal)" }}>Edit</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Tab: System Prompt ───────────────────────────────────────────────────────

function SystemPromptTab({ isAdmin }: { isAdmin: boolean }) {
  const config = useQuery((api as any).systemConfig.get, isAdmin ? { key: "system_prompt" } : "skip") as any | undefined;
  const setConfig = useMutation((api as any).systemConfig.set);

  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const currentValue = config?.value ?? "";
  const displayValue = draft !== null ? draft : currentValue;

  async function handleSave() {
    if (draft === null) return;
    setSaving(true);
    setSaveResult(null);
    try {
      await setConfig({ key: "system_prompt", value: draft });
      setDraft(null);
      setSaveResult({ ok: true, msg: "System prompt saved successfully." });
      setTimeout(() => setSaveResult(null), 5000);
    } catch (e: any) {
      setSaveResult({ ok: false, msg: e?.message ?? "Failed to save." });
    } finally {
      setSaving(false);
    }
  }

  const isDirty = draft !== null && draft !== currentValue;
  const charCount = displayValue.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 820 }}>
      <div>
        <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "var(--lf-dark)", margin: "0 0 4px" }}>System Prompt</h3>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "rgba(45,45,45,0.5)", margin: 0 }}>
          This is the master instruction set sent to GPT-4.1 for every story. Edits take effect immediately on the next generation.
          {currentValue ? "" : " (Using SYSTEM_PROMPT env var as fallback until saved here.)"}
        </p>
      </div>

      {saveResult && (
        <div style={{ padding: "10px 16px", background: saveResult.ok ? "rgba(0,184,166,0.1)" : "rgba(220,38,38,0.08)", border: `1px solid ${saveResult.ok ? "rgba(0,184,166,0.2)" : "rgba(220,38,38,0.15)"}`, borderRadius: "0.7rem" }}>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: saveResult.ok ? "#0d7a6e" : "#b91c1c" }}>{saveResult.msg}</span>
        </div>
      )}

      {config === undefined ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
      ) : (
        <>
          <textarea
            value={displayValue}
            onChange={e => setDraft(e.target.value)}
            rows={28}
            style={{
              ...InputStyle({ fontFamily: "monospace", fontSize: "0.82rem", lineHeight: "1.6", resize: "vertical" as const }),
              background: isDirty ? "#fffef5" : "#fff",
              border: isDirty ? "1.5px solid rgba(249,199,0,0.5)" : "1.5px solid rgba(0,0,0,0.12)",
            }}
            placeholder="Enter the master system prompt here…"
          />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", color: "rgba(45,45,45,0.4)" }}>
              {charCount.toLocaleString()} chars
              {isDirty && <span style={{ color: "#8a6900", fontWeight: 700, marginLeft: 8 }}>⚠ Unsaved changes</span>}
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              {isDirty && (
                <button
                  onClick={() => setDraft(null)}
                  style={{ padding: "9px 18px", borderRadius: "0.6rem", background: "none", border: "1.5px solid rgba(0,0,0,0.12)", color: "rgba(45,45,45,0.6)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer" }}
                >
                  Discard
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !isDirty}
                style={{ padding: "9px 24px", borderRadius: "0.6rem", background: isDirty ? "var(--lf-teal)" : "rgba(0,0,0,0.06)", border: "none", color: isDirty ? "#fff" : "rgba(45,45,45,0.4)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.88rem", cursor: saving || !isDirty ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Saving…" : "Save Prompt"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tab: Challenge Config ────────────────────────────────────────────────────

const DEFAULT_CHALLENGE_CONFIG_JSON = JSON.stringify({
  pillarDistribution: {
    quick: { cognitive: 3, attention: 2, listening: 2, emotional: 3 },
    big:   { cognitive: 4, attention: 2, listening: 2, emotional: 4 },
  },
  rewardTiers: [
    { minPercent: 0,  maxPercent: 24,  stars: 5  },
    { minPercent: 25, maxPercent: 49,  stars: 10 },
    { minPercent: 50, maxPercent: 79,  stars: 15 },
    { minPercent: 80, maxPercent: 100, stars: 25 },
  ],
  retryCap: 2,
  quickCheckStars: 2,
}, null, 2);

function ChallengeConfigTab({ isAdmin }: { isAdmin: boolean }) {
  const promptRow = useQuery((api as any).systemConfig.get, isAdmin ? { key: "QuestionGenPromptV1" } : "skip") as any | undefined;
  const configRow = useQuery((api as any).systemConfig.get, isAdmin ? { key: "ChallengeConfigV1" } : "skip") as any | undefined;
  const setConfig = useMutation((api as any).systemConfig.set);

  const [promptDraft, setPromptDraft] = useState<string | null>(null);
  const [configDraft, setConfigDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState<"prompt" | "config" | null>(null);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const promptValue = promptDraft !== null ? promptDraft : (promptRow?.value ?? "");
  const configValue = configDraft !== null ? configDraft : (configRow?.value ?? "");
  const promptDirty = promptDraft !== null && promptDraft !== (promptRow?.value ?? "");
  const configDirty = configDraft !== null && configDraft !== (configRow?.value ?? "");

  async function save(key: "QuestionGenPromptV1" | "ChallengeConfigV1", value: string, which: "prompt" | "config") {
    setSaving(which);
    setResult(null);
    try {
      if (which === "config") {
        JSON.parse(value); // validate JSON before saving
      }
      await setConfig({ key, value });
      if (which === "prompt") setPromptDraft(null);
      else setConfigDraft(null);
      setResult({ ok: true, msg: `${which === "prompt" ? "Generation prompt" : "Scoring config"} saved.` });
      setTimeout(() => setResult(null), 5000);
    } catch (e: any) {
      setResult({ ok: false, msg: e?.message ?? "Failed to save." });
    } finally {
      setSaving(null);
    }
  }

  function seedDefaults() {
    setPromptDraft(FALLBACK_QUESTION_GEN_PROMPT);
    setConfigDraft(DEFAULT_CHALLENGE_CONFIG_JSON);
  }

  const isLoading = promptRow === undefined || configRow === undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 860 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "var(--lf-dark)", margin: "0 0 4px" }}>
            Story Challenge: Question Engine Config
          </h3>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "rgba(45,45,45,0.5)", margin: 0 }}>
            Generation prompt (QuestionGenPromptV1) and scoring config (ChallengeConfigV1) stored in system_config.
            Edits take effect on the next Challenge generation. Click "Seed Defaults" to pre-fill both if not yet set.
          </p>
        </div>
        <button
          onClick={seedDefaults}
          style={{ padding: "8px 18px", borderRadius: "0.6rem", background: "rgba(0,0,0,0.06)", border: "1.5px solid rgba(0,0,0,0.12)", color: "rgba(45,45,45,0.7)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
        >
          Seed Defaults
        </button>
      </div>

      {result && (
        <div style={{ padding: "10px 16px", background: result.ok ? "rgba(0,184,166,0.1)" : "rgba(220,38,38,0.08)", border: `1px solid ${result.ok ? "rgba(0,184,166,0.2)" : "rgba(220,38,38,0.15)"}`, borderRadius: "0.7rem" }}>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: result.ok ? "#0d7a6e" : "#b91c1c" }}>{result.msg}</span>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
      ) : (
        <>
          {/* ── Section 1: Generation prompt ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "0.9rem", color: "var(--lf-dark)", margin: "0 0 2px" }}>
                  QuestionGenPromptV1
                </p>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", color: "rgba(45,45,45,0.45)", margin: 0 }}>
                  System instruction sent to the model for every Challenge generation. Matches §8.1 of the spec.
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {promptDirty && (
                  <button
                    onClick={() => setPromptDraft(null)}
                    style={{ padding: "7px 14px", borderRadius: "0.6rem", background: "none", border: "1.5px solid rgba(0,0,0,0.12)", color: "rgba(45,45,45,0.6)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}
                  >
                    Discard
                  </button>
                )}
                <button
                  onClick={() => save("QuestionGenPromptV1", promptValue, "prompt")}
                  disabled={saving !== null || !promptDirty}
                  style={{ padding: "7px 18px", borderRadius: "0.6rem", background: promptDirty ? "var(--lf-teal)" : "rgba(0,0,0,0.06)", border: "none", color: promptDirty ? "#fff" : "rgba(45,45,45,0.4)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", cursor: !promptDirty || saving !== null ? "not-allowed" : "pointer" }}
                >
                  {saving === "prompt" ? "Saving…" : "Save Prompt"}
                </button>
              </div>
            </div>
            <textarea
              value={promptValue}
              onChange={(e) => setPromptDraft(e.target.value)}
              rows={22}
              style={{
                ...InputStyle({ fontFamily: "monospace", fontSize: "0.78rem", lineHeight: "1.55", resize: "vertical" as const }),
                background: promptDirty ? "#fffef5" : "#fff",
                border: promptDirty ? "1.5px solid rgba(249,199,0,0.5)" : "1.5px solid rgba(0,0,0,0.12)",
              }}
              placeholder="QuestionGenPromptV1: click Seed Defaults to pre-fill from spec §8.1…"
            />
            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.75rem", color: "rgba(45,45,45,0.4)" }}>
              {promptValue.length.toLocaleString()} chars
              {promptDirty && <span style={{ color: "#8a6900", fontWeight: 700, marginLeft: 8 }}>⚠ Unsaved changes</span>}
            </span>
          </div>

          {/* ── Section 2: Scoring / generation config ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "0.9rem", color: "var(--lf-dark)", margin: "0 0 2px" }}>
                  ChallengeConfigV1
                </p>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", color: "rgba(45,45,45,0.45)", margin: 0 }}>
                  JSON config: pillarDistribution (quick/big), rewardTiers, retryCap, quickCheckStars.
                  All generation and scoring code reads these at runtime.
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {configDirty && (
                  <button
                    onClick={() => setConfigDraft(null)}
                    style={{ padding: "7px 14px", borderRadius: "0.6rem", background: "none", border: "1.5px solid rgba(0,0,0,0.12)", color: "rgba(45,45,45,0.6)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}
                  >
                    Discard
                  </button>
                )}
                <button
                  onClick={() => save("ChallengeConfigV1", configValue, "config")}
                  disabled={saving !== null || !configDirty}
                  style={{ padding: "7px 18px", borderRadius: "0.6rem", background: configDirty ? "var(--lf-teal)" : "rgba(0,0,0,0.06)", border: "none", color: configDirty ? "#fff" : "rgba(45,45,45,0.4)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", cursor: !configDirty || saving !== null ? "not-allowed" : "pointer" }}
                >
                  {saving === "config" ? "Saving…" : "Save Config"}
                </button>
              </div>
            </div>
            <textarea
              value={configValue}
              onChange={(e) => setConfigDraft(e.target.value)}
              rows={18}
              style={{
                ...InputStyle({ fontFamily: "monospace", fontSize: "0.82rem", lineHeight: "1.55", resize: "vertical" as const }),
                background: configDirty ? "#fffef5" : "#fff",
                border: configDirty ? "1.5px solid rgba(249,199,0,0.5)" : "1.5px solid rgba(0,0,0,0.12)",
              }}
              placeholder="ChallengeConfigV1 JSON: click Seed Defaults to pre-fill…"
            />
            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.75rem", color: "rgba(45,45,45,0.4)" }}>
              {configValue.length.toLocaleString()} chars
              {configDirty && <span style={{ color: "#8a6900", fontWeight: 700, marginLeft: 8 }}>⚠ Unsaved changes</span>}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// Mirrors the FALLBACK_SYSTEM_PROMPT in convex/testserver/challenge.ts exactly.
// Used to seed the admin textarea when clicking "Seed Defaults".
// When editing the prompt, update BOTH files together — they must stay identical.
// The authoritative runtime version lives in system_config once seeded.
const FALLBACK_QUESTION_GEN_PROMPT = `You are generating the Story Challenge for Lalli & Fafa -- a short set of playful questions Lalli and Fafa ask together after a story, to help a child remember, notice, feel, and think about what just happened.

OUTPUT LANGUAGE -- MANDATORY

Every word in your JSON output -- promptText, options text, revealFraming, storyGrounding, wordBank, and all other string fields -- must be written in English. This is non-negotiable regardless of the language the story is written in. The story may be in Hindi, Hinglish, or any other language; that does not change the output requirement. Do not translate story character names or story-specific proper nouns, but write everything else in English.

CORE RULE -- GROUND EVERY QUESTION IN THIS SPECIFIC STORY

Every question must reference something that actually happened in the story you were given -- a real line of dialogue, a real detail from a scene, a real moment. Never write a generic question that could apply to any story. If you cannot find real story content to ground a question in a given pillar, choose a different angle within that pillar rather than inventing a detail that isn't in the story.

THE FOUR PILLARS -- WHAT EACH ONE ACTUALLY TESTS

- Listening: the child must recall or interpret something a character SAID or that was narrated aloud -- not something they merely saw.
- Attention and focus: the child must recall a specific visual or descriptive DETAIL -- a color, a number, an object -- something noticed, not the main plot event.
- Cognitive growth: the child must reason -- word meaning, cause and effect, opposites, comparing two things, predicting what happens next.
- Emotional intelligence: the child must identify a feeling a character had, or how a feeling changed, grounded in a real story moment. There is no single "correct" feeling -- see the EQ rules below.

FORMAT RULES -- WHICH FORMAT FOR WHICH PILLAR

- Emotional intelligence questions are ALWAYS multiple choice. Never fill-in-the-blank, never match-the-column, never sequencing.
- Listening and Attention questions are multiple choice by default.
- Cognitive growth questions may use multiple choice, fill-in-the-blank, or match-the-column -- this pillar carries most of the format variety.
- Sequencing (ordering 3 story moments) may only be used for a Listening question, and only when age_group is "C".

FORMAT RULES -- WHAT'S ALLOWED BY AGE BAND (age_group is in the payload)

- age_group "A": multiple choice ONLY, every question. Keep options short, favor concrete words a pre-reader would recognize read aloud.
- age_group "B": multiple choice, fill-in-the-blank, or 3-item match-the-column.
- age_group "C": all of the above, plus 3-4 item match-the-column and sequencing.

Never use a format outside what's allowed for the given age_group, even if a pillar technically permits it.

HARD RULE -- NO FREE TEXT, EVER

Every answer must be selectable by tapping, never typed. Fill-in-the-blank means the child taps a word from a small provided word bank into the blank -- never an open text field. This applies at every age band.

EMOTIONAL INTELLIGENCE -- ACCEPTED ANSWER SETS, NOT ONE RIGID ANSWER

Feelings are genuinely more ambiguous than facts. For every EQ question, define 2 to 3 reasonably valid feeling words for that moment as the accepted set, not a single correct answer -- for example, both "nervous" and "worried" should be accepted for a child who felt scared but not frightened. The remaining wrong options should be feelings that clearly do NOT fit the scene, not near-misses.

MULTIPLE CHOICE OPTION RULES

- Use between 2 and 4 options per question -- vary this across the set.
- Vary where the correct answer sits -- do not put it in the same position across multiple questions in the same set.
- Vary option style where natural.

DO NOT REPEAT THE SAME PILLAR-FORMAT PAIRING AS RECENT STORIES

You will be given a short history of which pillar used which format in this child's last few Story Challenges. Avoid repeating an identical pairing where a different valid format exists for that pillar and age band. A child noticing "the format always tells me which pillar this is" is a pattern worth actively avoiding.

QUESTION ORDERING -- MANDATORY

You MUST output questions in this exact pillar sequence:
  1. All Cognitive growth questions (e.g. 3 in a row)
  2. All Attention and focus questions
  3. All Listening questions
  4. All Emotional intelligence questions

The array index of a question determines whether it is quick-check eligible. Outputting questions in any other order will cause the wrong questions to be treated as in-story quick checks. Do not reorder for "narrative flow" or any other reason.

QUICK-CHECK ELIGIBILITY

Exactly three questions in every set are eligible to double as in-story "quick checks" during playback. They are always:
  - Question at index 0 (the FIRST Cognitive growth question)
  - Question at index [cognitive count] (the FIRST Attention and focus question)
  - Question at index [cognitive count + attention count] (the FIRST Listening question)

The payload includes a "questionSequence" array listing the exact pillar for every index -- use it to confirm which three indices these are.

Mark those three questions with "isQuickCheckEligible": true. All other questions -- including every Emotional intelligence question and every subsequent Cognitive/Attention/Listening question -- must have "isQuickCheckEligible": false.

IMPORTANT: All three quick-check-eligible questions must use format: "mcq". Quick checks appear mid-story during audio playback and require simple tap-to-select interaction -- fill-in-the-blank, match-the-column, and sequencing are not available in that context.

TONE -- LALLI AND FAFA ARE ASKING, NOT TESTING

Every question and every reveal line should sound like Lalli and Fafa are curious and warm, not like a teacher grading an exam. Never phrase a question or a reveal as "the correct answer is" -- reveal lines should sound like a character speaking, e.g. "Close! Fafa was actually nervous here," never "Incorrect. The answer is nervous."

REVEAL FRAMING IS PART OF YOUR OUTPUT

For every question, write a one-line "revealFraming" string -- the warm line shown if a child gets two tries wrong. It should reference the correct answer naturally, in Lalli or Fafa's voice, grounded in the same story moment as the question itself.

OUTPUT FORMAT

Return ONLY valid JSON matching the schema you were given. No preamble, no explanation, no markdown code fences -- the raw JSON object only.

OUTPUT SCHEMA:
{
  "questions": [
    {
      "id": "q1",
      "pillar": "listening" | "attention" | "cognitive" | "emotional",
      "format": "mcq" | "fill_blank" | "match_column" | "sequence",
      "isQuickCheckEligible": true | false,
      "storyGrounding": "brief note on which story moment this references",
      "promptText": "the question shown to the child",
      "content": {
        // mcq: { "options": [{"id":"a","text":"..."},...], "correctOptionIds": ["b"] }
        // EQ mcq: { "options": [...], "correctOptionIds": ["b","c"] }
        // fill_blank: { "sentenceWithBlank": "Fafa felt ___ when he saw the puppy.", "wordBank": ["nervous","excited","sleepy","angry"], "correctWord": "nervous" }
        // match_column: { "leftItems": [{"id":"l1","text":"..."}], "rightItems": [{"id":"r1","text":"..."}], "correctPairs": [["l1","r1"]] }
        // sequence: { "items": [{"id":"s1","text":"..."}], "correctOrder": ["s2","s1","s3"] }
      },
      "revealFraming": "warm one-line reveal, in Lalli or Fafa voice"
    }
  ]
}`;

// ─── Tab: Stings ─────────────────────────────────────────────────────────────

const EMOTIONS = [
  "happy", "excited", "curious", "warm", "playful", "thoughtful",
  "gentle", "naughty", "surprised", "proud", "calm", "reassuring",
] as const;

const EMOTION_COLORS: Record<string, { bg: string; color: string }> = {
  happy:      { bg: "rgba(249,199,0,0.15)",   color: "#8a6900" },
  excited:    { bg: "rgba(249,115,22,0.12)",  color: "#9a3412" },
  curious:    { bg: "rgba(139,92,246,0.12)",  color: "#5b21b6" },
  warm:       { bg: "rgba(217,119,6,0.12)",   color: "#92400e" },
  playful:    { bg: "rgba(0,201,167,0.12)",   color: "#0d7a6e" },
  thoughtful: { bg: "rgba(59,130,246,0.12)",  color: "#1d4ed8" },
  gentle:     { bg: "rgba(236,72,153,0.12)",  color: "#be185d" },
  naughty:    { bg: "rgba(220,38,38,0.12)",   color: "#b91c1c" },
  surprised:  { bg: "rgba(249,115,22,0.12)",  color: "#c2410c" },
  proud:      { bg: "rgba(234,179,8,0.15)",   color: "#713f12" },
  calm:       { bg: "rgba(14,165,233,0.12)",  color: "#0369a1" },
  reassuring: { bg: "rgba(16,185,129,0.12)",  color: "#065f46" },
};

function EmotionBadge({ emotion }: { emotion: string }) {
  const c = EMOTION_COLORS[emotion] ?? { bg: "rgba(0,0,0,0.06)", color: "rgba(45,45,45,0.6)" };
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 999, background: c.bg, color: c.color, fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.75rem" }}>
      {emotion}
    </span>
  );
}

function fmtDur(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function CostTab({ isAdmin }: { isAdmin: boolean }) {
  const dashboard = useQuery((api as any).costTracking.getCostDashboard, isAdmin ? {} : "skip") as
    | {
        totalStoriesWithCostData: number;
        totalStoriesOverall: number;
        totalUSD: number;
        avgUSD: number;
        trend: { day: string; costUSD: number }[];
        recent: {
          storyId: string;
          title: string;
          length: string;
          createdAt: number;
          textInputTokens?: number;
          textOutputTokens?: number;
          imageGenerationCalls?: number;
          audioCharactersUsed?: number;
          estimatedCostUSD?: number;
        }[];
      }
    | undefined;
  const rates = useQuery((api as any).costTracking.getRates, isAdmin ? {} : "skip") as
    | { textInputPerMillion: number; textOutputPerMillion: number; imagePerCall: number; audioPerChar: number }
    | undefined;
  const setRates = useMutation((api as any).costTracking.setRates);

  const [editingRates, setEditingRates] = useState(false);
  const [rateForm, setRateForm] = useState({ textInputPerMillion: "", textOutputPerMillion: "", imagePerCall: "", audioPerChar: "" });
  const [savingRates, setSavingRates] = useState(false);

  function openRateEditor() {
    if (rates) {
      setRateForm({
        textInputPerMillion: String(rates.textInputPerMillion),
        textOutputPerMillion: String(rates.textOutputPerMillion),
        imagePerCall: String(rates.imagePerCall),
        audioPerChar: String(rates.audioPerChar),
      });
    }
    setEditingRates(true);
  }

  async function saveRates() {
    setSavingRates(true);
    try {
      await setRates({
        textInputPerMillion: parseFloat(rateForm.textInputPerMillion) || 0,
        textOutputPerMillion: parseFloat(rateForm.textOutputPerMillion) || 0,
        imagePerCall: parseFloat(rateForm.imagePerCall) || 0,
        audioPerChar: parseFloat(rateForm.audioPerChar) || 0,
      });
      setEditingRates(false);
    } finally {
      setSavingRates(false);
    }
  }

  const usdFmt = (n: number) => `$${n.toFixed(4)}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Historical-data honesty note */}
      <div style={{ background: "rgba(249,199,0,0.1)", border: "1px solid rgba(249,199,0,0.35)", borderRadius: "0.75rem", padding: "12px 16px", fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "var(--lf-dark)" }}>
        Cost tracking only covers stories generated after this shipped. No token/image/character
        usage was logged before, and none of that historical data still exists, so past stories
        can&apos;t be retroactively priced. Numbers below reflect real usage as it accumulates going forward.
      </div>

      {!dashboard ? (
        <div style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(45,45,45,0.5)" }}>Loading…</div>
      ) : (
        <>
          {/* Aggregate summary */}
          <div className="flex gap-4 flex-wrap">
            {[
              { label: "Total spend (tracked)", value: `$${dashboard.totalUSD.toFixed(2)}` },
              { label: "Avg cost / story", value: usdFmt(dashboard.avgUSD) },
              { label: "Stories with cost data", value: `${dashboard.totalStoriesWithCostData} / ${dashboard.totalStoriesOverall}` },
            ].map((s) => (
              <div key={s.label} style={{ flex: "1 1 200px", background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "0.85rem", padding: "16px 20px" }}>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.75rem", color: "rgba(45,45,45,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.6rem", color: "var(--lf-dark)" }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Rate config */}
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "0.85rem", padding: 20 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.05rem" }}>Rate config</h3>
              {!editingRates && (
                <button onClick={openRateEditor} style={{ padding: "6px 14px", borderRadius: "0.6rem", border: "1.5px solid rgba(0,0,0,0.12)", background: "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>
                  Edit rates
                </button>
              )}
            </div>
            {editingRates ? (
              <div className="flex flex-col gap-3">
                {([
                  ["textInputPerMillion", "Text input ($ / 1M tokens)"],
                  ["textOutputPerMillion", "Text output ($ / 1M tokens)"],
                  ["imagePerCall", "Image ($ / call)"],
                  ["audioPerChar", "Audio ($ / character)"],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex flex-col gap-1" style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.82rem", color: "rgba(45,45,45,0.6)" }}>
                    {label}
                    <input type="number" step="0.0001" value={rateForm[key]} onChange={(e) => setRateForm((f) => ({ ...f, [key]: e.target.value }))} style={InputStyle()} />
                  </label>
                ))}
                <div className="flex gap-2 mt-1">
                  <button onClick={saveRates} disabled={savingRates} style={{ padding: "8px 18px", borderRadius: "0.6rem", border: "none", background: "var(--lf-teal)", color: "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: 700, cursor: "pointer" }}>
                    {savingRates ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => setEditingRates(false)} style={{ padding: "8px 18px", borderRadius: "0.6rem", border: "1.5px solid rgba(0,0,0,0.12)", background: "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: 700, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : rates ? (
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.88rem", color: "var(--lf-dark)", lineHeight: 1.8 }}>
                Text: ${rates.textInputPerMillion}/1M in · ${rates.textOutputPerMillion}/1M out &nbsp;|&nbsp;
                Image: ${rates.imagePerCall}/call &nbsp;|&nbsp;
                Audio: ${rates.audioPerChar}/char
              </div>
            ) : null}
          </div>

          {/* Trend */}
          {dashboard.trend.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "0.85rem", padding: 20 }}>
              <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.05rem", marginBottom: 12 }}>Spend by day</h3>
              <div className="flex flex-col gap-1">
                {dashboard.trend.map((t) => (
                  <div key={t.day} className="flex justify-between" style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", padding: "3px 0" }}>
                    <span style={{ color: "rgba(45,45,45,0.6)" }}>{t.day}</span>
                    <span style={{ fontWeight: 700 }}>${t.costUSD.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per-story table */}
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "0.85rem", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={TH_STYLE}>Story</th>
                    <th style={TH_STYLE}>Length</th>
                    <th style={TH_STYLE}>Text tokens (in/out)</th>
                    <th style={TH_STYLE}>Image calls</th>
                    <th style={TH_STYLE}>Audio chars</th>
                    <th style={TH_STYLE}>Est. cost</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recent.length === 0 ? (
                    <tr><td style={TD_STYLE} colSpan={6}>No cost data yet: will populate as new stories are generated.</td></tr>
                  ) : (
                    dashboard.recent.map((s) => (
                      <tr key={s.storyId}>
                        <td style={TD_STYLE}>{s.title}</td>
                        <td style={TD_STYLE}>{s.length}</td>
                        <td style={TD_STYLE}>{s.textInputTokens ?? "-"} / {s.textOutputTokens ?? "-"}</td>
                        <td style={TD_STYLE}>{s.imageGenerationCalls ?? "-"}</td>
                        <td style={TD_STYLE}>{s.audioCharactersUsed ?? "-"}</td>
                        <td style={{ ...TD_STYLE, fontWeight: 700 }}>{s.estimatedCostUSD != null ? usdFmt(s.estimatedCostUSD) : "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StingsTab({ isAdmin }: { isAdmin: boolean }) {
  const stings = useQuery((api as any).stings.listWithUrls, isAdmin ? {} : "skip") as any[] | undefined;
  const generateUploadUrl = useMutation((api as any).stings.generateUploadUrl);
  const addSting          = useMutation((api as any).stings.add);
  const removeSting       = useMutation((api as any).stings.remove);
  const setActive         = useMutation((api as any).stings.setActive);
  const replaceSting      = useMutation((api as any).stings.replace);

  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState({ name: "", emotion: "happy" as string, intensity: "subtle" as string, durationSeconds: "" });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading,  setUploading]  = useState(false);
  const [formError,  setFormError]  = useState<string | null>(null);

  const [playingId,      setPlayingId]      = useState<string | null>(null);
  const [confirmDeleteId,setConfirmDeleteId] = useState<string | null>(null);
  const [replacingId,    setReplacingId]    = useState<string | null>(null);
  const [replaceFile,    setReplaceFile]    = useState<File | null>(null);
  const [replaceDur,     setReplaceDur]     = useState("");
  const [replaceUploading, setReplaceUploading] = useState(false);

  const currentAudio = useState<{ audio: HTMLAudioElement | null }>({ audio: null })[0];

  function playStingAudio(url: string, id: string) {
    if (currentAudio.audio) { currentAudio.audio.pause(); currentAudio.audio = null; }
    if (playingId === id) { setPlayingId(null); return; }
    const a = new Audio(url);
    currentAudio.audio = a;
    setPlayingId(id);
    a.play();
    a.onended = () => { currentAudio.audio = null; setPlayingId(null); };
  }

  async function handleAdd() {
    if (!form.name.trim())  { setFormError("Name is required"); return; }
    if (!uploadFile)        { setFormError("Select an audio file"); return; }
    const dur = parseFloat(form.durationSeconds);
    if (!dur || dur <= 0)   { setFormError("Enter a valid duration in seconds"); return; }
    setUploading(true);
    setFormError(null);
    try {
      const postUrl = await generateUploadUrl();
      const res = await fetch(postUrl, { method: "POST", headers: { "Content-Type": uploadFile.type }, body: uploadFile });
      const { storageId } = await res.json();
      await addSting({ name: form.name, filePath: storageId, emotion: form.emotion, durationSeconds: dur, intensity: form.intensity as any });
      setForm({ name: "", emotion: "happy", intensity: "subtle", durationSeconds: "" });
      setUploadFile(null);
      setShowForm(false);
    } catch (e: any) {
      setFormError(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleReplace(stingId: string) {
    if (!replaceFile) return;
    const dur = parseFloat(replaceDur);
    if (!dur || dur <= 0) { alert("Enter duration in seconds"); return; }
    setReplaceUploading(true);
    try {
      const postUrl = await generateUploadUrl();
      const res = await fetch(postUrl, { method: "POST", headers: { "Content-Type": replaceFile.type }, body: replaceFile });
      const { storageId } = await res.json();
      await replaceSting({ stingId, filePath: storageId, durationSeconds: dur });
      setReplacingId(null);
      setReplaceFile(null);
      setReplaceDur("");
    } catch (e: any) {
      alert(e?.message ?? "Replace failed");
    } finally {
      setReplaceUploading(false);
    }
  }

  async function handleDelete(stingId: string) {
    if (confirmDeleteId !== stingId) { setConfirmDeleteId(stingId); return; }
    setConfirmDeleteId(null);
    try { await removeSting({ stingId }); } catch (e: any) { alert(e?.message ?? "Delete failed"); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1rem", color: "var(--lf-dark)", margin: 0 }}>
            Sting Library {stings !== undefined ? `(${stings.length})` : ""}
          </h3>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", color: "rgba(45,45,45,0.45)", margin: "2px 0 0" }}>
            Short mood audio clips placed at emotional beats in stories
          </p>
        </div>
        <button
          onClick={() => { setShowForm(f => !f); setFormError(null); }}
          style={{ padding: "9px 20px", borderRadius: "0.7rem", background: showForm ? "rgba(0,0,0,0.07)" : "var(--lf-teal)", border: "none", color: showForm ? "rgba(45,45,45,0.7)" : "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", flexShrink: 0 }}
        >
          {showForm ? "Cancel" : "+ Add Sting"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background: "#fff", border: "1.5px solid rgba(0,201,167,0.25)", borderRadius: "1rem", padding: "24px 24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "0.95rem", color: "var(--lf-dark)", margin: 0 }}>New Sting</p>

          {formError && (
            <div style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "0.6rem", padding: "10px 14px", fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "#b91c1c" }}>
              {formError}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.8rem", color: "rgba(45,45,45,0.55)" }}>Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. happy-jingle-01" style={InputStyle()} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.8rem", color: "rgba(45,45,45,0.55)" }}>Duration (seconds) *</label>
              <input type="number" step="0.1" min="0.1" value={form.durationSeconds} onChange={e => setForm(f => ({ ...f, durationSeconds: e.target.value }))} placeholder="e.g. 3.5" style={InputStyle()} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.8rem", color: "rgba(45,45,45,0.55)" }}>Emotion *</label>
              <select value={form.emotion} onChange={e => setForm(f => ({ ...f, emotion: e.target.value }))} style={{ ...InputStyle(), width: "100%" }}>
                {EMOTIONS.map(em => <option key={em} value={em}>{em}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.8rem", color: "rgba(45,45,45,0.55)" }}>Intensity *</label>
              <select value={form.intensity} onChange={e => setForm(f => ({ ...f, intensity: e.target.value }))} style={{ ...InputStyle(), width: "100%" }}>
                <option value="subtle">Subtle</option>
                <option value="medium">Medium</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.8rem", color: "rgba(45,45,45,0.55)" }}>Audio file (MP3/WAV) *</label>
            <label
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", border: "1.5px dashed rgba(0,0,0,0.15)", borderRadius: "0.7rem", cursor: "pointer", background: uploadFile ? "rgba(0,201,167,0.05)" : "#fafaf9" }}
            >
              <input type="file" accept="audio/*" style={{ display: "none" }} onChange={e => setUploadFile(e.target.files?.[0] ?? null)} />
              <span style={{ fontSize: "1.3rem" }}>🎵</span>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.88rem", color: uploadFile ? "var(--lf-teal)" : "rgba(45,45,45,0.5)" }}>
                {uploadFile ? uploadFile.name : "Click to select audio file"}
              </span>
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleAdd}
              disabled={uploading}
              style={{ padding: "10px 26px", borderRadius: "0.7rem", background: "var(--lf-teal)", border: "none", color: "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.9rem", cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8 }}
            >
              {uploading && <Spinner />}
              {uploading ? "Uploading…" : "Upload & Save"}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {stings === undefined ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
      ) : stings.length === 0 ? (
        <div style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)", borderRadius: "1rem", padding: "48px 24px", textAlign: "center" }}>
          <span style={{ fontSize: "2rem" }}>🎵</span>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: "rgba(45,45,45,0.5)", margin: "8px 0 0" }}>No stings yet: add one above</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={TABLE_STYLE}>
            <thead>
              <tr>
                <th style={TH_STYLE}>Name</th>
                <th style={TH_STYLE}>Emotion</th>
                <th style={TH_STYLE}>Intensity</th>
                <th style={TH_STYLE}>Duration</th>
                <th style={TH_STYLE}>Status</th>
                <th style={TH_STYLE}>Preview</th>
                <th style={{ ...TH_STYLE, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stings.map((s: any, i: number) => (
                <>
                  <tr key={s._id} style={{ background: i % 2 === 0 ? "#fff" : "rgba(0,0,0,0.02)" }}>
                    <td style={{ ...TD_STYLE, fontWeight: 600 }}>{s.name}</td>
                    <td style={TD_STYLE}><EmotionBadge emotion={s.emotion} /></td>
                    <td style={TD_STYLE}>
                      <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", fontWeight: 700, background: s.intensity === "medium" ? "rgba(139,92,246,0.1)" : "rgba(0,0,0,0.06)", color: s.intensity === "medium" ? "#5b21b6" : "rgba(45,45,45,0.6)", padding: "2px 9px", borderRadius: 999 }}>
                        {s.intensity}
                      </span>
                    </td>
                    <td style={{ ...TD_STYLE, fontFamily: "monospace", fontSize: "0.85rem" }}>{fmtDur(s.durationSeconds)}</td>
                    <td style={TD_STYLE}>
                      <button
                        onClick={() => setActive({ stingId: s._id, isActive: !s.isActive })}
                        style={{ padding: "3px 12px", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.75rem", background: s.isActive ? "rgba(0,184,166,0.12)" : "rgba(0,0,0,0.06)", color: s.isActive ? "#0d7a6e" : "rgba(45,45,45,0.45)" }}
                      >
                        {s.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td style={TD_STYLE}>
                      {s.url ? (
                        <button
                          onClick={() => playStingAudio(s.url, s._id)}
                          style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: playingId === s._id ? "var(--lf-teal)" : "rgba(0,201,167,0.12)", color: playingId === s._id ? "#fff" : "var(--lf-teal)", cursor: "pointer", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          {playingId === s._id ? "■" : "▶"}
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "rgba(45,45,45,0.35)" }}>No file</span>
                      )}
                    </td>
                    <td style={{ ...TD_STYLE, textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                        <button
                          onClick={() => { setReplacingId(replacingId === s._id ? null : s._id); setReplaceFile(null); setReplaceDur(""); }}
                          style={{ background: "rgba(59,130,246,0.08)", border: "none", color: "#1d4ed8", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.78rem", padding: "4px 10px", borderRadius: "0.5rem", cursor: "pointer", whiteSpace: "nowrap" }}
                        >
                          Replace
                        </button>
                        {confirmDeleteId === s._id ? (
                          <>
                            <button onClick={() => handleDelete(s._id)} style={{ background: "#dc2626", border: "none", color: "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.78rem", padding: "4px 10px", borderRadius: "0.5rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                              Confirm
                            </button>
                            <button onClick={() => setConfirmDeleteId(null)} style={{ background: "rgba(0,0,0,0.07)", border: "none", color: "rgba(45,45,45,0.6)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.78rem", padding: "4px 8px", borderRadius: "0.5rem", cursor: "pointer" }}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button onClick={() => handleDelete(s._id)} style={{ background: "rgba(220,38,38,0.08)", border: "none", color: "#ef4444", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.78rem", padding: "4px 10px", borderRadius: "0.5rem", cursor: "pointer" }}>
                            🗑
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {replacingId === s._id && (
                    <tr key={`${s._id}-replace`} style={{ background: "rgba(59,130,246,0.04)" }}>
                      <td colSpan={7} style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", border: "1.5px dashed rgba(0,0,0,0.15)", borderRadius: "0.6rem", cursor: "pointer", background: replaceFile ? "rgba(0,201,167,0.06)" : "#fff", flexShrink: 0 }}>
                            <input type="file" accept="audio/*" style={{ display: "none" }} onChange={e => setReplaceFile(e.target.files?.[0] ?? null)} />
                            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: replaceFile ? "var(--lf-teal)" : "rgba(45,45,45,0.5)" }}>
                              🎵 {replaceFile ? replaceFile.name : "Pick new file"}
                            </span>
                          </label>
                          <input
                            type="number" step="0.1" min="0.1" value={replaceDur}
                            onChange={e => setReplaceDur(e.target.value)}
                            placeholder="Duration (s)"
                            style={{ ...InputStyle(), width: 130 }}
                          />
                          <button
                            onClick={() => handleReplace(s._id)}
                            disabled={replaceUploading || !replaceFile}
                            style={{ padding: "9px 18px", borderRadius: "0.6rem", background: "rgba(59,130,246,0.12)", border: "none", color: "#1d4ed8", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.85rem", cursor: replaceUploading || !replaceFile ? "not-allowed" : "pointer", opacity: replaceUploading || !replaceFile ? 0.5 : 1, whiteSpace: "nowrap" }}
                          >
                            {replaceUploading ? "Uploading…" : "Save Replace"}
                          </button>
                          <button
                            onClick={() => { setReplacingId(null); setReplaceFile(null); setReplaceDur(""); }}
                            style={{ background: "none", border: "none", color: "rgba(45,45,45,0.5)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string }[] = [
  { key: "stories", label: "Stories" },
  { key: "users", label: "Users" },
  { key: "blog", label: "Blog" },
  { key: "assets", label: "Assets" },
  { key: "voice", label: "Voice" },
  { key: "stings", label: "Stings" },
  { key: "settings", label: "Settings" },
  { key: "story-types", label: "Story Types" },
  { key: "languages", label: "Languages" },
  { key: "system-prompt", label: "System Prompt" },
  { key: "challenge-config", label: "Challenge Config" },
  { key: "cost", label: "Cost" },
];

export default function AdminPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const role = useQuery(api.auth.getUserRole, isAuthenticated ? {} : "skip") as string | null | undefined;
  const { data: session } = authClient.useSession();

  const [activeTab, setActiveTab] = useState<TabKey>("stories");

  const isAdmin = role === "admin";
  // Hoist users query so Stories tab can correlate userId → user info
  const allUsers = useQuery(api.auth.listAllUsers, isAdmin ? {} : "skip") as any[] | undefined;

  // Redirect if not authenticated (once auth is resolved)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/sign-in?redirect=/admin");
    }
  }, [isLoading, isAuthenticated, router]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading || (isAuthenticated && role === undefined)) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--lf-cream)",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "3px solid rgba(0,184,166,0.2)",
            borderTopColor: "var(--lf-teal)",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <p style={{ fontFamily: "'Nunito', sans-serif", color: "var(--lf-dark)", opacity: 0.5, margin: 0 }}>
          Loading…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Not authenticated ──────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return null; // useEffect handles redirect
  }

  // ── Access denied → 404 (hides the route from non-admins) ───────────────
  if (role !== null && role !== undefined && role !== "admin") {
    notFound();
  }

  // ── Admin dashboard ────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "var(--lf-cream)" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <header
        style={{
          background: "var(--lf-dark)",
          width: "100%",
          padding: "0 28px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.15rem", color: "var(--lf-teal)" }}>
            Lalli Fafa
          </span>
          <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.15rem", color: "#fff" }}>
            &nbsp;Admin
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {session?.user?.email && (
            <span
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: "0.83rem",
                color: "rgba(255,255,255,0.55)",
                maxWidth: 220,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {session.user.email}
            </span>
          )}
          <button
            onClick={async () => {
              await authClient.signOut();
              router.push("/");
            }}
            style={{
              padding: "6px 16px",
              borderRadius: "0.6rem",
              border: "1.5px solid rgba(255,255,255,0.15)",
              background: "transparent",
              color: "rgba(255,255,255,0.7)",
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Body */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 60px" }}>
        {/* Page title */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 800,
              fontSize: "1.8rem",
              color: "var(--lf-dark)",
              margin: 0,
            }}
          >
            Admin Panel
          </h1>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.9rem", color: "rgba(45,45,45,0.5)", margin: "4px 0 0" }}>
            Manage stories, users, blog content, assets, voice models, and settings.
          </p>
        </div>

        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 24,
            background: "#fff",
            border: "1.5px solid rgba(0,0,0,0.06)",
            borderRadius: "0.9rem",
            padding: "6px 8px",
            width: "fit-content",
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: "8px 20px",
                borderRadius: "0.65rem",
                border: "none",
                background: activeTab === t.key ? "var(--lf-teal)" : "transparent",
                color: activeTab === t.key ? "#fff" : "rgba(45,45,45,0.6)",
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "background 0.15s, color 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === "stories" && <StoriesTab isAdmin={isAdmin} users={allUsers} />}
          {activeTab === "users" && <UsersTab isAdmin={isAdmin} />}
          {activeTab === "blog" && <BlogTab isAdmin={isAdmin} />}
          {activeTab === "assets" && <AssetsTab isAdmin={isAdmin} />}
          {activeTab === "voice" && <VoiceTab isAdmin={isAdmin} />}
          {activeTab === "stings" && <TabErrorBoundary><StingsTab isAdmin={isAdmin} /></TabErrorBoundary>}
          {activeTab === "settings" && <SettingsTab isAdmin={isAdmin} />}
          {activeTab === "story-types" && <TabErrorBoundary><StoryTypesTab isAdmin={isAdmin} /></TabErrorBoundary>}
          {activeTab === "languages" && <TabErrorBoundary><LanguagesTab isAdmin={isAdmin} /></TabErrorBoundary>}
          {activeTab === "system-prompt" && <TabErrorBoundary><SystemPromptTab isAdmin={isAdmin} /></TabErrorBoundary>}
          {activeTab === "challenge-config" && <TabErrorBoundary><ChallengeConfigTab isAdmin={isAdmin} /></TabErrorBoundary>}
          {activeTab === "cost" && <TabErrorBoundary><CostTab isAdmin={isAdmin} /></TabErrorBoundary>}
        </div>
      </main>
    </div>
  );
}
