"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabKey = "stories" | "users" | "blog" | "assets" | "voice" | "settings";
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
  if (!ts) return "—";
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
  const s = map[status ?? ""] ?? { bg: "rgba(0,0,0,0.06)", color: "rgba(45,45,45,0.5)", label: status ?? "—" };
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

// ─── Tab: Stories ─────────────────────────────────────────────────────────────

function StoriesTab({ isAdmin }: { isAdmin: boolean }) {
  const stories = useQuery(api.stories.listAll, isAdmin ? {} : "skip") as any[] | undefined;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const list = stories ?? [];
    return list.filter((s: any) => {
      const matchSearch = !search || (s.title ?? "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [stories, search, statusFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <input
          placeholder="Search by title…"
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
                <th style={TH_STYLE}>Theme</th>
                <th style={TH_STYLE}>Language</th>
                <th style={TH_STYLE}>Status</th>
                <th style={TH_STYLE}>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...TD_STYLE, textAlign: "center", color: "rgba(45,45,45,0.4)", padding: 32 }}>
                    No stories found
                  </td>
                </tr>
              ) : (
                filtered.map((s: any, i: number) => (
                  <tr key={s._id} style={{ background: i % 2 === 0 ? "#fff" : "rgba(0,0,0,0.02)" }}>
                    <td style={TD_STYLE}>
                      <span style={{ fontWeight: 600 }}>{s.title ?? "Untitled"}</span>
                    </td>
                    <td style={TD_STYLE}>{s.params?.theme ?? "—"}</td>
                    <td style={TD_STYLE}>{s.params?.language ?? "—"}</td>
                    <td style={TD_STYLE}><StatusBadge status={s.status} /></td>
                    <td style={{ ...TD_STYLE, whiteSpace: "nowrap" }}>{formatDate(s.createdAt)}</td>
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

// ─── Tab: Users ───────────────────────────────────────────────────────────────

function CreditAdjustRow({ userId, creditMap }: { userId: string; creditMap: Map<string, any> }) {
  const adjustCredits = useMutation((api as any).credit.adminAdjustCredits);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);

  const credit = creditMap.get(userId);
  const available = credit?.availableCredits ?? null;
  const total = credit?.totalCredits ?? null;

  async function handleAdjust(sign: 1 | -1) {
    const n = parseInt(amount, 10);
    if (!n || n <= 0) return;
    setSaving(true);
    setResult(null);
    try {
      await adjustCredits({ userId, amount: sign * n });
      setAmount("");
      setResult("success");
      setTimeout(() => setResult(null), 2000);
    } catch {
      setResult("error");
      setTimeout(() => setResult(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <td style={{ ...TD_STYLE, whiteSpace: "nowrap" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Balance display */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 700,
              fontSize: "0.88rem",
              color: available !== null ? (available < 50 ? "#dc2626" : "var(--lf-teal)") : "rgba(45,45,45,0.4)",
            }}
          >
            {available !== null ? available : "—"}
          </span>
          {total !== null && (
            <span style={{ fontSize: "0.75rem", color: "rgba(45,45,45,0.4)" }}>
              / {total} total
            </span>
          )}
          {result === "success" && (
            <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 700 }}>✓ Saved</span>
          )}
          {result === "error" && (
            <span style={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: 700 }}>✗ Failed</span>
          )}
        </div>
        {/* Adjust controls */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="amt"
            style={{
              width: 60,
              padding: "3px 6px",
              borderRadius: "0.4rem",
              border: "1.5px solid rgba(0,0,0,0.12)",
              fontFamily: "'Nunito', sans-serif",
              fontSize: "0.82rem",
              color: "var(--lf-dark)",
              background: "#fff",
              outline: "none",
            }}
          />
          <button
            onClick={() => handleAdjust(1)}
            disabled={saving || !amount}
            title="Add credits"
            style={{
              padding: "3px 8px",
              borderRadius: "0.4rem",
              border: "none",
              background: "rgba(0,184,166,0.12)",
              color: "#0d7a6e",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: saving || !amount ? "not-allowed" : "pointer",
              opacity: saving || !amount ? 0.5 : 1,
            }}
          >
            +
          </button>
          <button
            onClick={() => handleAdjust(-1)}
            disabled={saving || !amount}
            title="Remove credits"
            style={{
              padding: "3px 8px",
              borderRadius: "0.4rem",
              border: "none",
              background: "rgba(220,38,38,0.1)",
              color: "#b91c1c",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: saving || !amount ? "not-allowed" : "pointer",
              opacity: saving || !amount ? 0.5 : 1,
            }}
          >
            −
          </button>
        </div>
      </div>
    </td>
  );
}

function UsersTab({ isAdmin }: { isAdmin: boolean }) {
  const users = useQuery(api.auth.listAllUsers, isAdmin ? {} : "skip") as any[] | undefined;
  const allCredits = useQuery((api as any).credit.adminListAllCredits, isAdmin ? {} : "skip") as any[] | undefined;

  // Build a map of userId → credit record
  const creditMap = useMemo(() => {
    const map = new Map<string, any>();
    (allCredits ?? []).forEach((c: any) => map.set(c.userId, c));
    return map;
  }, [allCredits]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "rgba(45,45,45,0.5)" }}>
          {users === undefined ? "Loading…" : `${users.length} users`}
        </span>
      </div>

      {users === undefined ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={TABLE_STYLE}>
            <thead>
              <tr>
                <th style={TH_STYLE}>Parent Name</th>
                <th style={TH_STYLE}>Email</th>
                <th style={TH_STYLE}>Child Name</th>
                <th style={TH_STYLE}>Child Age</th>
                <th style={TH_STYLE}>Joined</th>
                <th style={TH_STYLE}>Credits</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...TD_STYLE, textAlign: "center", color: "rgba(45,45,45,0.4)", padding: 32 }}>
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u: any, i: number) => (
                  <tr key={u.id} style={{ background: i % 2 === 0 ? "#fff" : "rgba(0,0,0,0.02)" }}>
                    <td style={{ ...TD_STYLE, fontWeight: 600 }}>{u.name ?? "—"}</td>
                    <td style={TD_STYLE}>{u.email ?? "—"}</td>
                    <td style={TD_STYLE}>{u.profile?.childName ?? "—"}</td>
                    <td style={TD_STYLE}>{u.profile?.childAge ?? "—"}</td>
                    <td style={{ ...TD_STYLE, whiteSpace: "nowrap" }}>{formatDate(u.createdAt)}</td>
                    <CreditAdjustRow userId={u.id} creditMap={creditMap} />
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

// ─── Tab: Blog ────────────────────────────────────────────────────────────────

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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
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
                    No posts yet
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
                          {m.voiceId ?? "—"}
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

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string }[] = [
  { key: "stories", label: "Stories" },
  { key: "users", label: "Users" },
  { key: "blog", label: "Blog" },
  { key: "assets", label: "Assets" },
  { key: "voice", label: "Voice" },
  { key: "settings", label: "Settings" },
];

export default function AdminPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const role = useQuery(api.auth.getUserRole, isAuthenticated ? {} : "skip") as string | null | undefined;
  const { data: session } = authClient.useSession();

  const [activeTab, setActiveTab] = useState<TabKey>("stories");

  const isAdmin = role === "admin";

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

  // ── Access denied ─────────────────────────────────────────────────────────
  if (role !== null && role !== undefined && role !== "admin") {
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
            background: "#fff",
            border: "1.5px solid rgba(0,0,0,0.06)",
            borderRadius: "1.2rem",
            padding: "40px 48px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            maxWidth: 380,
          }}
        >
          <span style={{ fontSize: "2.5rem" }}>🔒</span>
          <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.4rem", color: "var(--lf-dark)", margin: 0 }}>
            Access Denied
          </h2>
          <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(45,45,45,0.55)", fontSize: "0.95rem", margin: 0 }}>
            You don't have admin access to this page.
          </p>
          <Link
            href="/dashboard"
            style={{
              display: "inline-block",
              marginTop: 4,
              padding: "10px 24px",
              borderRadius: "0.8rem",
              background: "var(--lf-teal)",
              color: "#fff",
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700,
              fontSize: "0.95rem",
              textDecoration: "none",
            }}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
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
          {activeTab === "stories" && <StoriesTab isAdmin={isAdmin} />}
          {activeTab === "users" && <UsersTab isAdmin={isAdmin} />}
          {activeTab === "blog" && <BlogTab isAdmin={isAdmin} />}
          {activeTab === "assets" && <AssetsTab isAdmin={isAdmin} />}
          {activeTab === "voice" && <VoiceTab isAdmin={isAdmin} />}
          {activeTab === "settings" && <SettingsTab isAdmin={isAdmin} />}
        </div>
      </main>
    </div>
  );
}
