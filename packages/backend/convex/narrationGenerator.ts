import { ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js/Client";
import { Id } from "./_generated/dataModel";

type Gender = "male" | "female" | "other";

type VoiceMap = {
  Narrator?: string;
  Lalli?: string;
  Fafa?: string;
  GirlChild?: string;
  BoyChild?: string;
  HindiNarrator?: string;
  HindiLalli?: string;
  HindiFafa?: string;
  HindiGirlChild?: string;
  HindiBoyChild?: string;
};

async function loadVoiceMap(ctx: ActionCtx): Promise<VoiceMap> {
  const voices = await ctx.runQuery(api.migration.voice_models.list);
  const voiceMap: VoiceMap = {};
  
  for (const voice of voices) {
    voiceMap[voice.name as keyof VoiceMap] = voice.voiceId;
  }
  
  return voiceMap;
}

function resolveChildVoice(voiceMap: VoiceMap, gender: Gender, language: string): string {
  if (gender === "male") {
    return language === "Hindi" 
      ? (voiceMap.HindiBoyChild || voiceMap.BoyChild || "") 
      : (voiceMap.BoyChild || "");
  }
  if (gender === "female") {
    return language === "Hindi" 
      ? (voiceMap.HindiGirlChild || voiceMap.GirlChild || "") 
      : (voiceMap.GirlChild || "");
  }
  return language === "Hindi" 
    ? (voiceMap.HindiGirlChild || voiceMap.GirlChild || "") 
    : (voiceMap.GirlChild || "");
}

function pickVoiceForSpeaker(
  voiceMap: VoiceMap,
  speaker: string, 
  childName: string, 
  gender: Gender, 
  language: string
): string {
  const s = speaker.trim().toLowerCase();
  if (s === "narrator") {
    return language === "Hindi" 
      ? (voiceMap.HindiNarrator || voiceMap.Narrator || "") 
      : (voiceMap.Narrator || "");
  }
  if (s === "lalli") {
    return language === "Hindi" 
      ? (voiceMap.HindiLalli || voiceMap.Lalli || "") 
      : (voiceMap.Lalli || "");
  }
  if (s === "fafa") {
    return language === "Hindi" 
      ? (voiceMap.HindiFafa || voiceMap.Fafa || "") 
      : (voiceMap.Fafa || "");
  }
  if (s === "child" || s === "girl child" || s === "boy child" || s === childName.trim().toLowerCase()) {
    return resolveChildVoice(voiceMap, gender, language);
  }
  return language === "Hindi" 
    ? (voiceMap.HindiNarrator || voiceMap.Narrator || "") 
    : (voiceMap.Narrator || "");
}

function parseStoryToSpeakerLines(title: string, content: string, childName: string) {
  const lines = [title, ...content.split("\n").map(l => l.trim()).filter(Boolean)];
  const childLabel = (childName || "").trim().toLowerCase();

  const out: Array<{ order: number; speaker: string; text: string }> = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    if (lower.startsWith("lalli:")) {
      out.push({ order: i, speaker: "Lalli", text: line.replace(/^lalli:/i, "").trim() });
    } else if (lower.startsWith("fafa:")) {
      out.push({ order: i, speaker: "Fafa", text: line.replace(/^fafa:/i, "").trim() });
    } else if (childLabel && lower.startsWith(childLabel + ":")) {
      out.push({ order: i, speaker: childName, text: line.slice(childName.length + 1).trim() });
    } else if (lower.startsWith("child:") || lower.startsWith("girl child:") || lower.startsWith("boy child:")) {
      out.push({ order: i, speaker: "Child", text: line.replace(/^(child|girl child|boy child):/i, "").trim() });
    } else {
      out.push({ order: i, speaker: "Narrator", text: line });
    }
  }
  return out;
}

async function ttsArrayBuffer(voiceId: string, text: string): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVEN_LABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY missing");

  const client = new ElevenLabsClient({ apiKey });

  const resp = await client.textToSpeech.convert(voiceId, {
    text,
    modelId: "eleven_turbo_v2_5",
    outputFormat: "mp3_22050_32", 
    voiceSettings: { stability: 0.5, speed: 0.9 },
  });

  // handle web ReadableStream -> ArrayBuffer
  const reader = resp.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  // Ensure Blob receives parts backed by standard ArrayBuffer
  const safeChunks = chunks.map((c) => new Uint8Array(c));
  const blob = new Blob(safeChunks, { type: "audio/mpeg" });
  return await blob.arrayBuffer();
}

function concatMp3(buffers: ArrayBuffer[]): ArrayBuffer {
  const total = buffers.reduce((s, b) => s + b.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const buf of buffers) {
    out.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  }
  return out.buffer;
}

// concurrency limiter
async function mapWithConcurrencyLimit<T, R>(
  array: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const executing = new Set<Promise<void>>();

  for (const item of array) {
    const p = (async () => {
      const res = await fn(item);
      results.push(res);
    })();

    executing.add(p);
    p.finally(() => executing.delete(p));
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(Array.from(executing));
  return results;
}

export async function generateMergedNarration(
  ctx: ActionCtx,
  args: {
    storyId: Id<"stories">;
    title: string;
    content: string;
    childName: string;
    childGender: Gender;
    language: string;
  }
) {
  console.log("Generating voice narration for story");
  const { storyId, title, content, childName, childGender, language } = args;

  // Load voice map from database once
  const voiceMap = await loadVoiceMap(ctx);
  if (!voiceMap.Narrator) {
    throw new Error("Voice models not found in database. Please run the seed function.");
  }

  const lines = parseStoryToSpeakerLines(title, content, childName);
  console.log("Parsed Lines:", lines);

  // Limit concurrency to 3 TTS calls at a time
  const results = await mapWithConcurrencyLimit(lines, 2, async (l) => {
    const voiceId = pickVoiceForSpeaker(voiceMap, l.speaker, childName, childGender, language);
    if (!voiceId) {
      throw new Error(`Voice not found for speaker: ${l.speaker}`);
    }
    const ab = await ttsArrayBuffer(voiceId, l.text);
    return { order: l.order, ab };
  });

  // sort and merge
  results.sort((a, b) => a.order - b.order);
  const merged = concatMp3(results.map(r => r.ab));

  const mergedBlob = new Blob([merged], { type: "audio/mpeg" });
  const storageId = await ctx.storage.store(mergedBlob);

  // Calculate duration from byte size.
  // Format is mp3_22050_32 (32 kbps) → 32000 bits/s = 4000 bytes/s
  const audioDurationSeconds = Math.round(merged.byteLength / 4000);

  await ctx.runMutation(api.stories._setNarrationFilePath, {
    storyId: storyId,
    filePath: storageId,
  });

  await ctx.runMutation(api.stories._setNarrationDuration, {
    storyId: storyId,
    durationSeconds: audioDurationSeconds,
  });

  console.log("✅ Narration generated and stored:", storageId, `(${audioDurationSeconds}s)`);
  return { storageId, audioDurationSeconds };
}
