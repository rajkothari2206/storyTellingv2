"use client";

import { useState, useRef, useEffect } from "react";
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

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  baseOpacity: number;
  phase: number;
  speed: number;
  color: string;
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
    i.onerror = () => rej(new Error("Scene image failed to load — check browser console for CORS errors"));
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

  // Wrap toBlob in a Promise so errors surface instead of silently failing
  await new Promise<void>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) { reject(new Error("Canvas toBlob returned null — canvas may be tainted")); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, "_")}_thumbnail.jpg`;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    }, "image/jpeg", 0.93);
  });
}

// ─── Canvas / image helpers ───────────────────────────────────────────────────

/** Proxy Convex storage URLs through our server-side route to avoid CORS issues on canvas. */
function proxyConvex(url: string): string {
  if (url.includes("convex.cloud") || url.includes("convex.site")) {
    return `/api/media-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

/** Draws watermark pill (top-right corner) onto an existing canvas context. */
function drawWatermark(ctx: CanvasRenderingContext2D, logoImg: HTMLImageElement | null, W: number) {
  const pillW = 230, pillH = 52, pillX = W - pillW - 14, pillY = 12;
  ctx.fillStyle = "rgba(0,0,0,0.60)";
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 10);
  ctx.fill();
  if (logoImg) {
    const lh = 34, lw = (logoImg.width / logoImg.height) * lh;
    ctx.drawImage(logoImg, pillX + 8, pillY + (pillH - lh) / 2, lw, lh);
  }
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 15px Arial, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText("Lalli Fafa", pillX + 50, pillY + 8);
  ctx.fillStyle = "#00b8a6";
  ctx.font = "12px Arial, sans-serif";
  ctx.fillText("www.lallifafa.com", pillX + 50, pillY + 28);
}

/** Draws the branded end card onto an existing canvas context. */
function drawEndCard(
  ctx: CanvasRenderingContext2D,
  endCardImg: HTMLImageElement | null,
  logoImg: HTMLImageElement | null,
  W: number,
  H: number
) {
  if (endCardImg) {
    const scale = Math.max(W / endCardImg.width, H / endCardImg.height);
    ctx.drawImage(
      endCardImg,
      (W - endCardImg.width * scale) / 2,
      (H - endCardImg.height * scale) / 2,
      endCardImg.width * scale,
      endCardImg.height * scale
    );
    return;
  }

  // Auto-generated branded end card
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0d2235");
  grad.addColorStop(1, "#003d2e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Stars (deterministic LCG so they don't flicker between frames)
  const rng = { v: 42 };
  const nr = () => { rng.v = (rng.v * 1664525 + 1013904223) & 0x7fffffff; return rng.v / 0x7fffffff; };
  for (let s = 0; s < 90; s++) {
    ctx.fillStyle = `rgba(255,255,255,${nr() * 0.5 + 0.15})`;
    ctx.beginPath();
    ctx.arc(nr() * W, nr() * H * 0.55, nr() * 2 + 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 200);
  glow.addColorStop(0, "rgba(0,184,166,0.22)");
  glow.addColorStop(1, "rgba(0,184,166,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 200, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (logoImg) {
    const lh = 60, lw = (logoImg.width / logoImg.height) * lh;
    ctx.drawImage(logoImg, W / 2 - lw / 2, H * 0.12, lw, lh);
  }
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 60px Arial, sans-serif";
  ctx.fillText("✨ The End ✨", W / 2, H * 0.38);
  ctx.fillStyle = "#00b8a6";
  ctx.font = "bold 38px Arial, sans-serif";
  ctx.fillText("Create Your Child's Story!", W / 2, H * 0.54);
  ctx.fillStyle = "#e0f7f5";
  ctx.font = "28px Arial, sans-serif";
  ctx.fillText("www.lallifafa.com", W / 2, H * 0.65);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "20px Arial, sans-serif";
  ctx.fillText("Personalized stories where YOUR child is the hero 🌟", W / 2, H * 0.75);
}

// ─── Particle system (sparkles) ───────────────────────────────────────────────

function initParticles(W: number, H: number, count = 80): Particle[] {
  const colors = ["#00e5d0", "#ffffff", "#ffd700", "#ffe066", "#a8f0dc", "#ffb3de", "#80dfff", "#ff9ff3"];
  return Array.from({ length: count }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 1.0,
    vy: -(Math.random() * 0.9 + 0.25),
    radius: Math.random() * 4.5 + 1.5,           // 1.5–6.0 px (was 0.7–3.3)
    baseOpacity: Math.random() * 0.65 + 0.35,    // 0.35–1.0 (was 0.18–0.73)
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 2.5 + 1.0,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
}

function tickAndDrawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  elapsed: number,
  W: number,
  H: number,
) {
  ctx.save();
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.y < -15) { p.y = H + 15; p.x = Math.random() * W; }
    if (p.x < -15) p.x = W + 15;
    if (p.x > W + 15) p.x = -15;

    const opacity = p.baseOpacity * (0.5 + 0.5 * Math.sin(elapsed * p.speed * 3 + p.phase));

    // Glow halo behind particle
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 12;
    ctx.globalAlpha = opacity * 0.7;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Bright core
    ctx.shadowBlur = 4;
    ctx.globalAlpha = opacity;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Coloured outer ring
    ctx.globalAlpha = opacity * 0.9;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Star cross for larger sparkles
    if (p.radius > 3.5) {
      ctx.globalAlpha = opacity * 0.75;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.2;
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + Math.cos(a) * (p.radius + 7), p.y + Math.sin(a) * (p.radius + 7));
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

// Ken Burns directions: each scene gets a unique start→end pan + zoom direction
const KB_DIRS = [
  { sx: -0.06, sy: -0.04, ex: 0.06, ey: 0.04, sz: 1.0,  ez: 1.18 }, // pan →↓  zoom in
  { sx:  0.06, sy:  0.04, ex: -0.06, ey: -0.04, sz: 1.18, ez: 1.0  }, // pan ←↑  zoom out
  { sx: -0.06, sy:  0.04, ex: 0.06, ey: -0.04, sz: 1.0,  ez: 1.18 }, // pan →↑  zoom in
  { sx:  0.06, sy: -0.04, ex: -0.06, ey: 0.04, sz: 1.18, ez: 1.0  }, // pan ←↓  zoom out
  { sx:  0.0,  sy: -0.05, ex: 0.0,  ey: 0.05, sz: 1.0,  ez: 1.18 }, // pan ↓   zoom in
] as const;

/** Cover-fill with dramatic Ken Burns: 18% zoom + 12% pan, alternating direction per scene. */
function drawSceneKenBurns(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  W: number,
  H: number,
  sceneElapsed: number,
  sceneDuration: number,
  sceneIndex: number,
) {
  const t = Math.min(sceneElapsed / Math.max(sceneDuration, 0.001), 1);
  const d = KB_DIRS[sceneIndex % KB_DIRS.length];
  const zoom  = d.sz + (d.ez - d.sz) * t;
  const panX  = d.sx + (d.ex - d.sx) * t;
  const panY  = d.sy + (d.ey - d.sy) * t;
  const baseS = Math.max(W / img.width, H / img.height) * zoom;
  const dw = img.width * baseS, dh = img.height * baseS;
  const dx = (W - dw) / 2 + panX * W;
  const dy = (H - dh) / 2 + panY * H;
  ctx.drawImage(img, dx, dy, dw, dh);
}

// ─── MediaRecorder video assembler ───────────────────────────────────────────
// Uses the browser's native MediaRecorder API — no WASM, no memory limits, no CORS.
// Output: WebM (VP8/VP9 + Opus) — YouTube accepts this natively.

async function generateAndDownloadVideo(
  sceneUrls: string[],
  audioUrl: string,
  endCardUrl: string | null,
  bgMusicUrl: string | null,
  audioDurationSeconds: number,
  title: string,
  onProgress: (pct: number, label: string) => void
): Promise<void> {
  const W = 1280, H = 720;
  const FADE = 1.2;           // crossfade duration between scenes (seconds)
  const END_CARD_SECS = 6;    // end card duration
  const totalDuration = audioDurationSeconds + END_CARD_SECS;

  onProgress(3, "Loading images…");

  // Logo
  let logoImg: HTMLImageElement | null = null;
  try { logoImg = await loadImg("/logoNoBg.png"); } catch { /* optional */ }

  // Scene images via CORS proxy
  const sceneImages: (HTMLImageElement | null)[] = [];
  for (let i = 0; i < sceneUrls.length; i++) {
    onProgress(3 + i * 6, `Loading scene ${i + 1} of ${sceneUrls.length}…`);
    try { sceneImages.push(await loadImg(proxyConvex(sceneUrls[i]))); }
    catch { sceneImages.push(null); }
  }

  // End card image
  let endCardImg: HTMLImageElement | null = null;
  if (endCardUrl) {
    onProgress(33, "Loading end card…");
    try { endCardImg = await loadImg(proxyConvex(endCardUrl)); } catch { /* auto-generated fallback */ }
  }

  onProgress(36, "Loading narration…");
  const audioRes = await fetch(proxyConvex(audioUrl));
  if (!audioRes.ok) throw new Error(`Audio fetch failed: ${audioRes.status}`);
  const narrationBuffer = await audioRes.arrayBuffer();

  // Background music (optional)
  let bgBuffer: ArrayBuffer | null = null;
  if (bgMusicUrl) {
    onProgress(40, "Loading background music…");
    try {
      const bgRes = await fetch(proxyConvex(bgMusicUrl));
      if (bgRes.ok) bgBuffer = await bgRes.arrayBuffer();
    } catch { /* bg music is optional */ }
  }

  onProgress(44, "Setting up recording…");

  // Canvas
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // AudioContext — all sources mixed into a single MediaStream destination
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioCtx();
  const audioDest = audioCtx.createMediaStreamDestination();

  // Narration at full volume
  const narrationBuf = await audioCtx.decodeAudioData(narrationBuffer.slice(0));
  const narrationSrc = audioCtx.createBufferSource();
  narrationSrc.buffer = narrationBuf;
  const narrationGain = audioCtx.createGain();
  narrationGain.gain.value = 1.0;
  narrationSrc.connect(narrationGain);
  narrationGain.connect(audioDest);

  // Background music looped at low volume (22%)
  let bgSrc: AudioBufferSourceNode | null = null;
  if (bgBuffer) {
    try {
      const bgBuf = await audioCtx.decodeAudioData(bgBuffer.slice(0));
      bgSrc = audioCtx.createBufferSource();
      bgSrc.buffer = bgBuf;
      bgSrc.loop = true;
      const bgGain = audioCtx.createGain();
      bgGain.gain.value = 0.22;
      bgSrc.connect(bgGain);
      bgGain.connect(audioDest);
    } catch { /* ignore decode errors */ }
  }

  // Combined video + audio stream
  const canvasStream = canvas.captureStream(24);
  const combined = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioDest.stream.getAudioTracks(),
  ]);

  // Prefer MP4/H.264 (natively supported by Windows Media Player & most players).
  // Fall back to VP8 WebM (more compatible than VP9), then generic WebM.
  const mimeType = (
    [
      "video/mp4;codecs=avc1.42001E,mp4a.40.2",
      "video/mp4;codecs=avc1,mp4a",
      "video/mp4",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=vp9,opus",
      "video/webm",
    ].find(m => MediaRecorder.isTypeSupported(m))
  ) ?? "video/webm";

  const isMP4 = mimeType.startsWith("video/mp4");
  const recorder = new MediaRecorder(combined, { mimeType, videoBitsPerSecond: 3_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

  const sceneDuration = audioDurationSeconds / Math.max(sceneImages.length, 1);

  // Sparkle particle system
  const particles = initParticles(W, H, 80);

  let rafId = 0, recordingStart = 0;

  function drawFrame(ts: number) {
    if (!recordingStart) recordingStart = ts;
    const elapsed = (ts - recordingStart) / 1000;

    // Reset state each frame
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#050a10";
    ctx.fillRect(0, 0, W, H);

    if (elapsed >= audioDurationSeconds) {
      // ── End card ──────────────────────────────────────────────────────
      drawEndCard(ctx, endCardImg, logoImg, W, H);
    } else {
      // ── Story scenes with Ken Burns + crossfade ───────────────────────
      const idx = Math.min(Math.floor(elapsed / sceneDuration), sceneImages.length - 1);
      const sceneElapsed = elapsed - idx * sceneDuration;
      const timeUntilSceneEnd = sceneDuration - sceneElapsed;
      const nextIdx = idx + 1;
      const hasNext = nextIdx < sceneImages.length;
      const currentImg = sceneImages[idx];
      const nextImg = hasNext ? sceneImages[nextIdx] : null;

      if (currentImg) {
        if (hasNext && nextImg && timeUntilSceneEnd < FADE) {
          // Crossfade: current fades out, next fades in
          const t = 1 - timeUntilSceneEnd / FADE; // 0→1
          ctx.save(); ctx.globalAlpha = 1 - t;
          drawSceneKenBurns(ctx, currentImg, W, H, sceneElapsed, sceneDuration, idx);
          ctx.restore();
          ctx.save(); ctx.globalAlpha = t;
          drawSceneKenBurns(ctx, nextImg, W, H, 0, sceneDuration, nextIdx);
          ctx.restore();
        } else {
          drawSceneKenBurns(ctx, currentImg, W, H, sceneElapsed, sceneDuration, idx);
        }
      }

      // Sparkle particles
      tickAndDrawParticles(ctx, particles, elapsed, W, H);
      ctx.globalAlpha = 1;
      drawWatermark(ctx, logoImg, W);
    }

    const pct = Math.min(96, 44 + Math.round((elapsed / totalDuration) * 52));
    const remaining = Math.max(0, Math.round(totalDuration - elapsed));
    onProgress(pct, `Recording… ${remaining}s remaining`);

    if (elapsed < totalDuration) {
      rafId = requestAnimationFrame(drawFrame);
    }
  }

  // Fire everything simultaneously
  recorder.start(500);
  narrationSrc.start();
  if (bgSrc) bgSrc.start();
  rafId = requestAnimationFrame(drawFrame);

  await new Promise<void>(resolve => {
    setTimeout(() => {
      cancelAnimationFrame(rafId);
      recorder.stop();
      audioCtx.close();
    }, totalDuration * 1000 + 800);
    recorder.addEventListener("stop", () => resolve(), { once: true });
  });

  onProgress(98, "Saving file…");

  let finalBlob = new Blob(chunks, { type: mimeType });

  // Fix WebM duration metadata so media players show a proper seekbar.
  // MP4 files from MediaRecorder don't need this fix.
  if (!isMP4) {
    try {
      const { default: fixWebmDuration } = await import("fix-webm-duration");
      finalBlob = await fixWebmDuration(finalBlob, totalDuration * 1000, { logger: false });
    } catch {
      /* non-fatal — continue with raw blob */
    }
  }

  const ext = isMP4 ? "mp4" : "webm";
  const blobUrl = URL.createObjectURL(finalBlob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = `${title.replace(/[^a-z0-9]/gi, "_")}.${ext}`;
  a.click();
  URL.revokeObjectURL(blobUrl);
  onProgress(100, `Done! ✅ (${ext.toUpperCase()})`);
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

  // getSceneImageUrls returns objects { sceneNumber, description, filePath, url }
  const sceneImageData = useQuery(
    api.stories.getSceneImageUrls,
    selectedStoryId ? { storyId: selectedStoryId as Id<"stories"> } : "skip"
  ) as { sceneNumber: number; description: string; filePath: string; url: string | null }[] | undefined;
  // Derive a plain string[] of resolved URLs (filter out nulls)
  const sceneImageUrls: string[] | undefined = sceneImageData
    ? (sceneImageData.map(s => s.url).filter(Boolean) as string[])
    : undefined;

  // getNarrationFileUrl returns { url } not a bare string
  const narrationData = useQuery(
    api.stories.getNarrationFileUrl,
    selectedStoryId ? { storyId: selectedStoryId as Id<"stories"> } : "skip"
  ) as { url: string | null } | null | undefined;
  const narrationUrl: string | null | undefined = narrationData?.url;

  // End card — storage ID (for "uploaded" badge) + resolved URL from backend
  const endCardStorageId = useQuery(api.socialMedia.getEndCard) as string | null | undefined;
  const endCardUrlFromQuery = useQuery(api.socialMedia.getEndCardUrl) as string | null | undefined;
  const saveEndCard = useMutation(api.socialMedia.setEndCard);
  const generateUploadUrl = useMutation(api.socialMedia.generateUploadUrl);
  const [endCardLocalUrl, setEndCardLocalUrl] = useState<string | null>(null); // blob URL this session
  const [endCardUploading, setEndCardUploading] = useState(false);
  const endCardInputRef = useRef<HTMLInputElement>(null);

  // Background music
  const bgMusicUrlFromQuery = useQuery(api.socialMedia.getBgMusicUrl) as string | null | undefined;
  const saveBgMusic = useMutation(api.socialMedia.setBgMusic);
  const [bgMusicLocalUrl, setBgMusicLocalUrl] = useState<string | null>(null);
  const [bgMusicUploading, setBgMusicUploading] = useState(false);
  const bgMusicInputRef = useRef<HTMLInputElement>(null);

  // YouTube metadata
  const generateContent = useAction(api.socialMedia.generateYouTubeContent);
  const [meta, setMeta] = useState<YouTubeMeta | null>(null);
  const [generatingMeta, setGeneratingMeta] = useState(false);
  const [metaError, setMetaError] = useState("");

  // Persist YouTube metadata in localStorage keyed by story ID (survives refresh)
  useEffect(() => {
    if (selectedStoryId) {
      const cached = localStorage.getItem(`yt_meta_${selectedStoryId}`);
      setMeta(cached ? (JSON.parse(cached) as YouTubeMeta) : null);
    } else {
      setMeta(null);
    }
  }, [selectedStoryId]);

  useEffect(() => {
    if (meta && selectedStoryId) {
      localStorage.setItem(`yt_meta_${selectedStoryId}`, JSON.stringify(meta));
    }
  }, [meta, selectedStoryId]);

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
      await saveEndCard({ storageId });
      setEndCardLocalUrl(URL.createObjectURL(file));
    } catch (err: any) {
      alert("End card upload failed: " + err.message);
    } finally {
      setEndCardUploading(false);
    }
  }

  // Upload background music
  async function handleBgMusicUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBgMusicUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, { method: "POST", body: file, headers: { "Content-Type": file.type } });
      const { storageId } = await res.json();
      await saveBgMusic({ storageId });
      setBgMusicLocalUrl(URL.createObjectURL(file));
    } catch (err: any) {
      alert("Background music upload failed: " + err.message);
    } finally {
      setBgMusicUploading(false);
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
      // Prefer local blob URL (same session), fall back to Convex-resolved URL
      const endCardUrl = endCardLocalUrl || endCardUrlFromQuery || null;
      const bgMusicUrl = bgMusicLocalUrl || bgMusicUrlFromQuery || null;
      await generateAndDownloadVideo(
        sceneImageUrls,
        narrationUrl,
        endCardUrl,
        bgMusicUrl,
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
        proxyConvex(firstScene),
        story?.title || "Lalli Fafa Story",
        meta?.thumbnailHook || "AN AMAZING ADVENTURE! ✨"
      );
    } catch (err: any) {
      alert("Thumbnail generation failed: " + (err?.message || err?.toString() || "Image could not be loaded — check browser console"));
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
          onChange={e => { setSelectedStoryId(e.target.value); }}
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "var(--lf-dark)", margin: "0 0 2px" }}>
                  End Card Image <span style={{ fontWeight: 400, color: "rgba(45,45,45,0.45)", fontSize: "0.82rem" }}>(optional — 1280×720)</span>
                </p>
                <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "0.82rem", color: "rgba(45,45,45,0.45)", margin: 0 }}>
                  {endCardStorageId ? "✅ Uploaded — shown at end of every video" : "No end card — auto-generated branded card will be used"}
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

            {/* Background music upload */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "var(--lf-dark)", margin: "0 0 2px" }}>
                  Background Music <span style={{ fontWeight: 400, color: "rgba(45,45,45,0.45)", fontSize: "0.82rem" }}>(optional — MP3/AAC, loops automatically)</span>
                </p>
                <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "0.82rem", color: "rgba(45,45,45,0.45)", margin: 0 }}>
                  {bgMusicUrlFromQuery || bgMusicLocalUrl ? "✅ Background music set — mixed at 22% volume under narration" : "No background music — video will have narration audio only"}
                </p>
              </div>
              <button
                onClick={() => bgMusicInputRef.current?.click()}
                disabled={bgMusicUploading}
                style={{ padding: "8px 16px", borderRadius: "0.65rem", border: "1.5px solid rgba(0,0,0,0.1)", background: "#fff", color: "var(--lf-dark)", fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.85rem", cursor: bgMusicUploading ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
              >
                {bgMusicUploading ? "Uploading…" : bgMusicUrlFromQuery || bgMusicLocalUrl ? "🔄 Replace" : "🎵 Upload"}
              </button>
              <input ref={bgMusicInputRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={handleBgMusicUpload} />
            </div>

            {/* Output spec */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Pill color="#7c3aed">1280×720 WebM</Pill>
              <Pill color="#7c3aed">VP9 + Opus · 3 Mbps</Pill>
              <Pill color="#7c3aed">Ken Burns + crossfade</Pill>
              <Pill color="#7c3aed">✨ Sparkle particles</Pill>
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
                  ⏱️ Recording in real-time — keep this tab open. A 2.5-min story takes ~2.5 min to record.
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
