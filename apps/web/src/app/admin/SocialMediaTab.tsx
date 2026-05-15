"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface YouTubeMeta {
  title: string;
  description: string;
  tags: string;
  categoryId: string;
  categoryName: string;
  thumbnailHook: string;
}

interface SrtLine {
  index: number;
  start: string;
  end: string;
  text: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function secondsToSrtTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.round((s % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function generateSrtFromContent(content: string, title: string, audioDurationSeconds: number): SrtLine[] {
  const metaIdx = content.search(/^SCENE METADATA/mi);
  const storyOnly = metaIdx !== -1 ? content.slice(0, metaIdx) : content;
  const rawLines = [title, ...storyOnly.split("\n").map(l => l.trim()).filter(Boolean)];

  // Strip ElevenLabs emotion tags like [excited] from display text
  const cleanLines = rawLines.map(l => l.replace(/\[[\w\s]+\]/g, "").replace(/\s{2,}/g, " ").trim()).filter(Boolean);

  // Estimate timing: ~127 words/min at 0.85x speed
  const wordsPerSecond = 127 / 60;
  const srtLines: SrtLine[] = [];
  let currentTime = 0;

  cleanLines.forEach((line, i) => {
    const words = line.split(/\s+/).filter(Boolean).length;
    const duration = Math.max(1.5, words / wordsPerSecond);
    srtLines.push({
      index: i + 1,
      start: secondsToSrtTime(currentTime),
      end: secondsToSrtTime(Math.min(currentTime + duration, audioDurationSeconds)),
      text: line,
    });
    currentTime += duration + 0.15; // 150ms gap between lines
  });

  return srtLines;
}

function srtLinesToText(lines: SrtLine[]): string {
  return lines.map(l => `${l.index}\n${l.start} --> ${l.end}\n${l.text}`).join("\n\n");
}

function downloadText(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Canvas thumbnail generator ───────────────────────────────────────────────

async function generateThumbnail(
  sceneImageUrl: string,
  title: string,
  hookText: string
): Promise<void> {
  const W = 1280, H = 720;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Load scene image
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = sceneImageUrl;
  });

  // Draw blurred background
  ctx.filter = "blur(20px) brightness(0.4)";
  const scale = Math.max(W / img.width, H / img.height);
  const sw = img.width * scale, sh = img.height * scale;
  ctx.drawImage(img, (W - sw) / 2, (H - sh) / 2, sw, sh);
  ctx.filter = "none";

  // Draw main image (centered, letterboxed)
  const fgScale = Math.min((W * 0.7) / img.width, (H * 0.65) / img.height);
  const fw = img.width * fgScale, fh = img.height * fgScale;
  const fx = (W - fw) / 2, fy = H * 0.05;

  // Glow ring
  ctx.shadowColor = "#00b8a6";
  ctx.shadowBlur = 30;
  ctx.strokeStyle = "#00b8a6";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(fx - 6, fy - 6, fw + 12, fh + 12, 16);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.drawImage(img, fx, fy, fw, fh);

  // Bottom gradient strip for text
  const grad = ctx.createLinearGradient(0, H * 0.68, 0, H);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.4, "rgba(0,0,0,0.82)");
  grad.addColorStop(1, "rgba(0,0,0,0.95)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, H * 0.68, W, H * 0.32);

  // Hook text (big, bold, white with teal shadow)
  ctx.shadowColor = "#00b8a6";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 56px 'Arial Black', Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const hook = hookText.toUpperCase();
  ctx.fillText(hook, W / 2, H * 0.8, W * 0.85);
  ctx.shadowBlur = 0;

  // Subtitle (story title, smaller)
  ctx.fillStyle = "#e0f7f5";
  ctx.font = `600 26px Arial, sans-serif`;
  ctx.fillText(title, W / 2, H * 0.91, W * 0.8);

  // Logo watermark (top-left)
  try {
    const logo = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = "/logoNoBg.png";
    });
    const lh = 52;
    const lw = (logo.width / logo.height) * lh;
    ctx.drawImage(logo, 24, 20, lw, lh);
  } catch {
    // logo not available
  }

  // URL watermark (top-right)
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "bold 20px Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("www.lallifafa.com", W - 20, 36);

  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_")}_thumbnail.jpg`;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/jpeg", 0.93);
}

// ─── FFmpeg video assembler ───────────────────────────────────────────────────

async function generateAndDownloadVideo(
  sceneUrls: string[],
  audioUrl: string,
  endCardUrl: string | null,
  audioDurationSeconds: number,
  title: string,
  onProgress: (pct: number, label: string) => void
): Promise<void> {
  onProgress(2, "Loading video engine…");

  // Dynamic import so FFmpeg only loads when needed
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { toBlobURL, fetchFile } = await import("@ffmpeg/util");

  const ffmpeg = new FFmpeg();

  ffmpeg.on("progress", ({ progress }) => {
    onProgress(10 + Math.round(progress * 75), `Rendering… ${Math.round(progress * 100)}%`);
  });

  onProgress(4, "Loading FFmpeg WebAssembly…");
  await ffmpeg.load({
    coreURL: await toBlobURL(
      "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js",
      "text/javascript"
    ),
    wasmURL: await toBlobURL(
      "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm",
      "application/wasm"
    ),
  });

  onProgress(10, "Fetching story assets…");

  // Write scene images
  for (let i = 0; i < sceneUrls.length; i++) {
    const data = await fetchFile(sceneUrls[i]);
    await ffmpeg.writeFile(`scene${i}.jpg`, data);
    onProgress(10 + i * 3, `Loading scene ${i + 1}…`);
  }

  // Write audio
  const audioData = await fetchFile(audioUrl);
  await ffmpeg.writeFile("audio.mp3", audioData);
  onProgress(26, "Loading audio…");

  // Create watermark PNG using canvas (logo + URL)
  const wmCanvas = document.createElement("canvas");
  wmCanvas.width = 320;
  wmCanvas.height = 70;
  const wmCtx = wmCanvas.getContext("2d")!;

  // Background pill
  wmCtx.fillStyle = "rgba(0,0,0,0.55)";
  wmCtx.beginPath();
  wmCtx.roundRect(0, 0, 320, 70, 10);
  wmCtx.fill();

  // Try loading logo
  try {
    const logo = await new Promise<HTMLImageElement>((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = "/logoNoBg.png";
    });
    wmCtx.drawImage(logo, 8, 8, 54, 54);
  } catch { /* skip */ }

  wmCtx.fillStyle = "#ffffff";
  wmCtx.font = "bold 22px Arial, sans-serif";
  wmCtx.textBaseline = "top";
  wmCtx.fillText("Lalli Fafa", 70, 8);
  wmCtx.fillStyle = "#00b8a6";
  wmCtx.font = "15px Arial, sans-serif";
  wmCtx.fillText("www.lallifafa.com", 70, 36);

  const wmBlob = await new Promise<Blob>(res => wmCanvas.toBlob(b => res(b!), "image/png"));
  await ffmpeg.writeFile("watermark.png", new Uint8Array(await wmBlob.arrayBuffer()));
  onProgress(30, "Building watermark…");

  // Write end card (or generate a simple one)
  let hasEndCard = false;
  if (endCardUrl) {
    try {
      await ffmpeg.writeFile("endcard.jpg", await fetchFile(endCardUrl));
      hasEndCard = true;
    } catch { /* skip */ }
  }

  if (!hasEndCard) {
    // Generate a simple branded end card with canvas
    const ecCanvas = document.createElement("canvas");
    ecCanvas.width = 1280;
    ecCanvas.height = 720;
    const ecCtx = ecCanvas.getContext("2d")!;
    const ecGrad = ecCtx.createLinearGradient(0, 0, 1280, 720);
    ecGrad.addColorStop(0, "#0d2235");
    ecGrad.addColorStop(1, "#003d2e");
    ecCtx.fillStyle = ecGrad;
    ecCtx.fillRect(0, 0, 1280, 720);

    // Stars
    for (let s = 0; s < 80; s++) {
      ecCtx.fillStyle = `rgba(255,255,255,${Math.random() * 0.6 + 0.2})`;
      ecCtx.beginPath();
      ecCtx.arc(Math.random() * 1280, Math.random() * 400, Math.random() * 2 + 0.5, 0, Math.PI * 2);
      ecCtx.fill();
    }

    // Glow circle
    const glow = ecCtx.createRadialGradient(640, 360, 0, 640, 360, 220);
    glow.addColorStop(0, "rgba(0,184,166,0.18)");
    glow.addColorStop(1, "rgba(0,184,166,0)");
    ecCtx.fillStyle = glow;
    ecCtx.beginPath();
    ecCtx.arc(640, 360, 220, 0, Math.PI * 2);
    ecCtx.fill();

    ecCtx.fillStyle = "#ffffff";
    ecCtx.font = "bold 72px Arial, sans-serif";
    ecCtx.textAlign = "center";
    ecCtx.textBaseline = "middle";
    ecCtx.fillText("✨ The End ✨", 640, 240);

    ecCtx.fillStyle = "#00b8a6";
    ecCtx.font = "bold 44px Arial, sans-serif";
    ecCtx.fillText("Create Your Child's Story!", 640, 360);

    ecCtx.fillStyle = "#e0f7f5";
    ecCtx.font = "32px Arial, sans-serif";
    ecCtx.fillText("www.lallifafa.com", 640, 440);

    ecCtx.fillStyle = "rgba(255,255,255,0.65)";
    ecCtx.font = "24px Arial, sans-serif";
    ecCtx.fillText("Personalized stories where YOUR child is the hero 🌟", 640, 510);

    const ecBlob = await new Promise<Blob>(res => ecCanvas.toBlob(b => res(b!), "image/jpeg", 0.92));
    await ffmpeg.writeFile("endcard.jpg", new Uint8Array(await ecBlob.arrayBuffer()));
  }
  onProgress(35, "Preparing end card…");

  // Build FFmpeg command
  const numScenes = sceneUrls.length;
  const sceneDuration = audioDurationSeconds / numScenes;
  const totalDuration = audioDurationSeconds + 6; // 6s end card

  const inputs: string[] = [];
  for (let i = 0; i < numScenes; i++) {
    inputs.push("-loop", "1", "-t", String(sceneDuration.toFixed(3)), "-i", `scene${i}.jpg`);
  }
  inputs.push("-loop", "1", "-t", "6", "-i", "endcard.jpg");
  inputs.push("-i", "audio.mp3");
  inputs.push("-i", "watermark.png");

  // Filter: scale each scene → 1280x720, concat, overlay watermark
  const scaleFilters = Array.from({ length: numScenes }, (_, i) =>
    `[${i}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=#0d1117[v${i}]`
  );
  scaleFilters.push(
    `[${numScenes}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=#0d1117[vend]`
  );
  const concatInputs = Array.from({ length: numScenes }, (_, i) => `[v${i}]`).join("") + "[vend]";
  const audioIdx = numScenes + 1;
  const wmIdx = numScenes + 2;

  const filterComplex = [
    ...scaleFilters,
    `${concatInputs}concat=n=${numScenes + 1}:v=1:a=0[slides]`,
    `[${wmIdx}:v]scale=240:-1[wm]`,
    `[slides][wm]overlay=W-w-16:16[out]`,
  ].join(";");

  onProgress(37, "Starting render…");

  await ffmpeg.exec([
    ...inputs,
    "-filter_complex", filterComplex,
    "-map", "[out]",
    "-map", `${audioIdx}:a:0`,
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-crf", "23",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "128k",
    "-af", `apad=pad_dur=6`,
    "-t", String(totalDuration.toFixed(3)),
    "output.mp4",
  ]);

  onProgress(88, "Finalising…");

  const rawData = await ffmpeg.readFile("output.mp4");
  // Normalise to a plain Uint8Array backed by a standard ArrayBuffer
  const safeData: Uint8Array<ArrayBuffer> = rawData instanceof Uint8Array
    ? new Uint8Array(rawData)
    : new Uint8Array(rawData as unknown as ArrayBuffer);
  const blob = new Blob([safeData], { type: "video/mp4" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, "_")}.mp4`;
  a.click();
  URL.revokeObjectURL(url);

  onProgress(100, "Done!");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
  label, value, onChange, multiline = false, charLimit,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  charLimit?: number;
}) {
  const over = charLimit ? value.length > charLimit : false;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <label style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "rgba(45,45,45,0.65)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
        {charLimit && (
          <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: over ? "#e53e3e" : "rgba(45,45,45,0.4)" }}>
            {value.length}/{charLimit}
          </span>
        )}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={8}
          style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${over ? "#e53e3e" : "rgba(0,0,0,0.1)"}`, borderRadius: "0.65rem", fontFamily: "'Nunito',sans-serif", fontSize: "0.88rem", lineHeight: 1.55, resize: "vertical", outline: "none", boxSizing: "border-box", color: "var(--lf-dark)" }}
        />
      ) : (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${over ? "#e53e3e" : "rgba(0,0,0,0.1)"}`, borderRadius: "0.65rem", fontFamily: "'Nunito',sans-serif", fontSize: "0.88rem", outline: "none", boxSizing: "border-box", color: "var(--lf-dark)" }}
        />
      )}
    </div>
  );
}

function Pill({ children, color = "#00b8a6" }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 999, background: `${color}18`, color, fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.78rem" }}>
      {children}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SocialMediaTab({ isAdmin }: { isAdmin: boolean }) {
  // Story data
  const allStories = useQuery(api.stories.listAll, isAdmin ? {} : "skip") as any[] | undefined;
  const [selectedStoryId, setSelectedStoryId] = useState<string>("");

  // Selected story details
  const story = useQuery(
    api.stories.get,
    selectedStoryId ? { storyId: selectedStoryId as Id<"stories"> } : "skip"
  ) as any | null | undefined;

  const sceneImageUrls = useQuery(
    api.stories.getSceneImageUrls,
    selectedStoryId ? { storyId: selectedStoryId as Id<"stories"> } : "skip"
  ) as string[] | undefined;

  const narrationUrl = useQuery(
    api.stories.getNarrationFileUrl,
    selectedStoryId ? { storyId: selectedStoryId as Id<"stories"> } : "skip"
  ) as string | null | undefined;

  // End card
  const endCardStorageId = useQuery(api.socialMedia.getEndCard) as string | null | undefined;
  const setEndCard = useMutation(api.socialMedia.setEndCard);
  const generateUploadUrl = useMutation(api.socialMedia.generateUploadUrl);

  // End card resolved URL via storage
  const [endCardResolvedUrl, setEndCardResolvedUrl] = useState<string | null>(null);
  const [endCardUploading, setEndCardUploading] = useState(false);
  const endCardInputRef = useRef<HTMLInputElement>(null);

  // YouTube metadata
  const generateContent = useAction(api.socialMedia.generateYouTubeContent);
  const [meta, setMeta] = useState<YouTubeMeta | null>(null);
  const [generatingMeta, setGeneratingMeta] = useState(false);
  const [metaError, setMetaError] = useState("");

  // Video generation
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoStatus, setVideoStatus] = useState("");
  const [generatingVideo, setGeneratingVideo] = useState(false);

  // Ready stories only
  const readyStories = allStories?.filter(s => s.status === "ready") ?? [];

  // Upload end card
  async function handleEndCardUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEndCardUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, { method: "POST", body: file, headers: { "Content-Type": file.type } });
      const { storageId } = await res.json();
      await setEndCard({ storageId });
      setEndCardResolvedUrl(URL.createObjectURL(file));
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setEndCardUploading(false);
    }
  }

  // Generate YouTube metadata
  async function handleGenerateMeta() {
    if (!story) return;
    setGeneratingMeta(true);
    setMetaError("");
    try {
      const result = await generateContent({
        title: story.title,
        content: story.content || "",
        theme: story.params?.theme || "",
        childName: story.params?.childName,
        language: story.params?.language,
      });
      setMeta(result as YouTubeMeta);
    } catch (err: any) {
      setMetaError(err.message || "Failed to generate metadata");
    } finally {
      setGeneratingMeta(false);
    }
  }

  // Generate + download SRT
  function handleDownloadSrt() {
    if (!story?.content) return;
    const lines = generateSrtFromContent(story.content, story.title, story.audioDurationSeconds || 150);
    downloadText(`${story.title.replace(/[^a-z0-9]/gi, "_")}.srt`, srtLinesToText(lines));
  }

  // Generate + download video
  async function handleDownloadVideo() {
    if (!sceneImageUrls?.length || !narrationUrl) {
      alert("Story must have all scene images and narration audio before downloading video.");
      return;
    }
    setGeneratingVideo(true);
    setVideoProgress(0);
    setVideoStatus("Starting…");
    try {
      await generateAndDownloadVideo(
        sceneImageUrls,
        narrationUrl,
        endCardResolvedUrl || (endCardStorageId ? `https://glorious-gnat-469.convex.cloud/api/storage/${endCardStorageId}` : null),
        story?.audioDurationSeconds || 150,
        story?.title || "story",
        (pct, label) => {
          setVideoProgress(pct);
          setVideoStatus(label);
        }
      );
    } catch (err: any) {
      alert("Video generation failed: " + (err.message || String(err)));
    } finally {
      setGeneratingVideo(false);
      setVideoProgress(0);
      setVideoStatus("");
    }
  }

  // Generate + download thumbnail
  async function handleDownloadThumbnail() {
    const firstScene = sceneImageUrls?.[0];
    if (!firstScene) {
      alert("No scene images available for this story.");
      return;
    }
    try {
      await generateThumbnail(
        firstScene,
        story?.title || "Lalli Fafa Story",
        meta?.thumbnailHook || "AN AMAZING ADVENTURE! ✨"
      );
    } catch (err: any) {
      alert("Thumbnail generation failed: " + err.message);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, paddingBottom: 60 }}>

      {/* Header */}
      <div>
        <h2 style={{ fontFamily: "'Baloo 2',sans-serif", fontWeight: 800, fontSize: "1.5rem", color: "var(--lf-dark)", margin: "0 0 4px" }}>
          🎬 Social Media
        </h2>
        <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "0.9rem", color: "rgba(45,45,45,0.5)", margin: 0 }}>
          Export stories as branded videos, generate YouTube metadata, thumbnails, and SRT subtitles.
        </p>
      </div>

      {/* Story selector */}
      <div style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.07)", borderRadius: "1rem", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "rgba(45,45,45,0.6)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Select Story
        </label>
        <select
          value={selectedStoryId}
          onChange={e => { setSelectedStoryId(e.target.value); setMeta(null); }}
          style={{ padding: "10px 14px", border: "1.5px solid rgba(0,0,0,0.1)", borderRadius: "0.7rem", fontFamily: "'Nunito',sans-serif", fontSize: "0.95rem", color: "var(--lf-dark)", background: "#fff", outline: "none", cursor: "pointer" }}
        >
          <option value="">— choose a story —</option>
          {readyStories.map(s => (
            <option key={s._id} value={s._id}>
              {s.title || "(untitled)"} · {s.params?.childName || "?"} · {s.params?.language || "English"}
            </option>
          ))}
        </select>

        {story && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            <Pill>{story.params?.theme}</Pill>
            {story.params?.storyType && <Pill color="#7c3aed">{story.params.storyType}</Pill>}
            {story.params?.language && <Pill color="#d97706">{story.params.language}</Pill>}
            <Pill color={story.audioDurationSeconds ? "#059669" : "#6b7280"}>
              {story.audioDurationSeconds ? `${Math.round(story.audioDurationSeconds)}s audio` : "no audio"}
            </Pill>
            <Pill color={sceneImageUrls?.length === 5 ? "#059669" : "#6b7280"}>
              {sceneImageUrls?.length ?? 0}/5 scenes
            </Pill>
          </div>
        )}
      </div>

      {story && (
        <>
          {/* ── YouTube Content ─────────────────────────────────────────── */}
          <div style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.07)", borderRadius: "1rem", padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontFamily: "'Baloo 2',sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "var(--lf-dark)", margin: 0 }}>
                📺 YouTube Content
              </h3>
              <button
                onClick={handleGenerateMeta}
                disabled={generatingMeta}
                style={{ padding: "9px 20px", borderRadius: "0.65rem", border: "none", background: generatingMeta ? "rgba(0,0,0,0.08)" : "var(--lf-teal)", color: generatingMeta ? "rgba(45,45,45,0.4)" : "#fff", fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.9rem", cursor: generatingMeta ? "not-allowed" : "pointer" }}
              >
                {generatingMeta ? "Generating…" : "✨ Generate with AI"}
              </button>
            </div>

            {metaError && (
              <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "0.88rem", color: "#e53e3e", margin: 0, padding: "10px 14px", background: "#fef2f2", borderRadius: "0.6rem" }}>
                {metaError}
              </p>
            )}

            {meta ? (
              <>
                <Field label="Video Title" value={meta.title} onChange={v => setMeta(m => m && ({ ...m, title: v }))} charLimit={70} />
                <Field label="Description" value={meta.description} onChange={v => setMeta(m => m && ({ ...m, description: v }))} multiline charLimit={5000} />
                <Field label="Tags (500 char limit)" value={meta.tags} onChange={v => setMeta(m => m && ({ ...m, tags: v }))} charLimit={500} />
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <span style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "rgba(45,45,45,0.6)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Category</span>
                    <p style={{ margin: "4px 0 0", fontFamily: "'Nunito',sans-serif", fontSize: "0.95rem", color: "var(--lf-dark)" }}>
                      {meta.categoryName} <span style={{ color: "rgba(45,45,45,0.4)" }}>(ID: {meta.categoryId})</span>
                    </p>
                  </div>
                  {meta.thumbnailHook && (
                    <div>
                      <span style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "rgba(45,45,45,0.6)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Thumbnail Hook</span>
                      <p style={{ margin: "4px 0 0", fontFamily: "'Nunito',sans-serif", fontSize: "0.95rem", color: "var(--lf-dark)" }}>{meta.thumbnailHook}</p>
                    </div>
                  )}
                </div>

                {/* Copy buttons */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 4 }}>
                  {[
                    { label: "Copy Title", text: meta.title },
                    { label: "Copy Description", text: meta.description },
                    { label: "Copy Tags", text: meta.tags },
                  ].map(({ label, text }) => (
                    <button
                      key={label}
                      onClick={() => navigator.clipboard.writeText(text)}
                      style={{ padding: "7px 14px", borderRadius: "0.6rem", border: "1.5px solid rgba(0,0,0,0.1)", background: "#fff", color: "var(--lf-dark)", fontFamily: "'Nunito',sans-serif", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}
                    >
                      📋 {label}
                    </button>
                  ))}
                  <button
                    onClick={handleDownloadSrt}
                    style={{ padding: "7px 14px", borderRadius: "0.6rem", border: "1.5px solid rgba(0,184,166,0.3)", background: "rgba(0,184,166,0.06)", color: "var(--lf-teal)", fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}
                  >
                    📄 Download SRT Subtitles
                  </button>
                </div>
              </>
            ) : (
              <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "0.9rem", color: "rgba(45,45,45,0.4)", textAlign: "center", padding: "20px 0", margin: 0 }}>
                Click "Generate with AI" to create title, description, tags, category, and thumbnail hook.
              </p>
            )}
          </div>

          {/* ── Video Export ────────────────────────────────────────────── */}
          <div style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.07)", borderRadius: "1rem", padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>
            <h3 style={{ fontFamily: "'Baloo 2',sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "var(--lf-dark)", margin: 0 }}>
              🎞️ Video Export
            </h3>

            {/* End card upload */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "var(--lf-dark)", margin: "0 0 2px" }}>
                    End Card Image <span style={{ fontWeight: 400, color: "rgba(45,45,45,0.45)", fontSize: "0.82rem" }}>(optional — 1280×720 or 9:16)</span>
                  </p>
                  <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "0.82rem", color: "rgba(45,45,45,0.45)", margin: 0 }}>
                    {endCardStorageId ? "✅ End card uploaded — shown at end of every video" : "No end card set — an auto-generated branded card will be used"}
                  </p>
                </div>
                <button
                  onClick={() => endCardInputRef.current?.click()}
                  disabled={endCardUploading}
                  style={{ padding: "8px 16px", borderRadius: "0.65rem", border: "1.5px solid rgba(0,0,0,0.1)", background: "#fff", color: "var(--lf-dark)", fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.85rem", cursor: endCardUploading ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
                >
                  {endCardUploading ? "Uploading…" : endCardStorageId ? "🔄 Replace" : "⬆️ Upload"}
                </button>
                <input ref={endCardInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleEndCardUpload} />
              </div>
            </div>

            {/* Output spec */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Pill color="#7c3aed">1280×720 MP4</Pill>
              <Pill color="#7c3aed">H.264 + AAC</Pill>
              <Pill color="#7c3aed">mp3_44100_64 audio</Pill>
              <Pill color="#7c3aed">Lalli Fafa watermark</Pill>
              <Pill color="#7c3aed">6s end card</Pill>
            </div>

            {/* Progress bar */}
            {generatingVideo && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: "0.88rem", color: "var(--lf-dark)", fontWeight: 600 }}>{videoStatus}</span>
                  <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "rgba(45,45,45,0.5)" }}>{videoProgress}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 999, background: "var(--lf-teal)", width: `${videoProgress}%`, transition: "width 0.3s ease" }} />
                </div>
                <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "0.8rem", color: "rgba(45,45,45,0.4)", margin: 0 }}>
                  ⚠️ FFmpeg runs in your browser. Keep this tab open. Large stories may take 2–5 minutes.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={handleDownloadVideo}
                disabled={generatingVideo || !sceneImageUrls?.length || !narrationUrl}
                style={{
                  padding: "11px 22px", borderRadius: "0.7rem", border: "none",
                  background: generatingVideo || !sceneImageUrls?.length || !narrationUrl ? "rgba(0,0,0,0.07)" : "var(--lf-dark)",
                  color: generatingVideo || !sceneImageUrls?.length || !narrationUrl ? "rgba(45,45,45,0.35)" : "#fff",
                  fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.95rem",
                  cursor: generatingVideo || !sceneImageUrls?.length || !narrationUrl ? "not-allowed" : "pointer",
                }}
              >
                {generatingVideo ? `⏳ Rendering… ${videoProgress}%` : "⬇️ Download Video (MP4)"}
              </button>

              <button
                onClick={handleDownloadThumbnail}
                disabled={!sceneImageUrls?.length}
                style={{
                  padding: "11px 22px", borderRadius: "0.7rem",
                  border: "1.5px solid rgba(0,0,0,0.1)", background: "#fff",
                  color: !sceneImageUrls?.length ? "rgba(45,45,45,0.35)" : "var(--lf-dark)",
                  fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.95rem",
                  cursor: !sceneImageUrls?.length ? "not-allowed" : "pointer",
                }}
              >
                🖼️ Download Thumbnail
              </button>

              {!meta && (
                <button
                  onClick={handleDownloadSrt}
                  style={{ padding: "11px 22px", borderRadius: "0.7rem", border: "1.5px solid rgba(0,184,166,0.3)", background: "rgba(0,184,166,0.06)", color: "var(--lf-teal)", fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}
                >
                  📄 Download SRT
                </button>
              )}
            </div>

            {(!sceneImageUrls?.length || !narrationUrl) && (
              <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "0.82rem", color: "#d97706", margin: 0 }}>
                ⚠️ This story is missing {!sceneImageUrls?.length ? "scene images" : "narration audio"}. Video download requires both.
              </p>
            )}
          </div>

          {/* ── Phase 2 teaser ────────────────────────────────────────── */}
          <div style={{ background: "rgba(0,184,166,0.05)", border: "1.5px dashed rgba(0,184,166,0.25)", borderRadius: "1rem", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "1.4rem" }}>🚀</span>
            <div>
              <p style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "var(--lf-teal)", margin: 0 }}>
                YouTube Auto-Publish — Coming in Phase 2
              </p>
              <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "0.82rem", color: "rgba(45,45,45,0.5)", margin: "2px 0 0" }}>
                One-click upload directly to your YouTube channel using OAuth. Approve content → published automatically.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
