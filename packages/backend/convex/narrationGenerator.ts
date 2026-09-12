import { ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

type Gender = "male" | "female" | "other";

/**
 * Returns true if the language is Hindi (uses Hindi-specific trained voice IDs).
 */
function isHindiLanguage(language: string): boolean {
  return language.toLowerCase() === "hindi";
}

/**
 * Returns true if the language needs the ElevenLabs multilingual model.
 * English uses eleven_turbo_v2_5 (English-only, faster/cheaper).
 * All other languages use eleven_multilingual_v2.
 */
function isMultilingualLanguage(language: string): boolean {
  return language.toLowerCase() !== "english";
}

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
  const useHindi = isHindiLanguage(language);
  if (gender === "male") {
    return useHindi
      ? (voiceMap.HindiBoyChild || voiceMap.BoyChild || "")
      : (voiceMap.BoyChild || "");
  }
  if (gender === "female") {
    return useHindi
      ? (voiceMap.HindiGirlChild || voiceMap.GirlChild || "")
      : (voiceMap.GirlChild || "");
  }
  return useHindi
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
  const useHindi = isHindiLanguage(language);
  if (s === "narrator") {
    return useHindi
      ? (voiceMap.HindiNarrator || voiceMap.Narrator || "")
      : (voiceMap.Narrator || "");
  }
  if (s === "lalli") {
    return useHindi
      ? (voiceMap.HindiLalli || voiceMap.Lalli || "")
      : (voiceMap.Lalli || "");
  }
  if (s === "fafa") {
    return useHindi
      ? (voiceMap.HindiFafa || voiceMap.Fafa || "")
      : (voiceMap.Fafa || "");
  }
  if (s === "child" || s === "girl child" || s === "boy child" || s === childName.trim().toLowerCase()) {
    return resolveChildVoice(voiceMap, gender, language);
  }
  return useHindi
    ? (voiceMap.HindiNarrator || voiceMap.Narrator || "")
    : (voiceMap.Narrator || "");
}

/**
 * Split a narrator paragraph into individual sentences for TTS.
 * Each sentence becomes its own TTS call, so the voice resets to its
 * neutral warm tone between sentences — preventing tonal drift from
 * carrying across an entire paragraph.
 */
function splitToSentences(text: string): string[] {
  const raw = text.match(/[^.!?।]+[.!?।]+/g);
  if (!raw) return [text];
  // Merge very short segments (like "Boing!", "Click!") into the next or previous sentence
  // to avoid choppy single-word TTS calls
  const merged: string[] = [];
  for (const s of raw) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    if (trimmed.length < 15 && merged.length > 0) {
      merged[merged.length - 1] += " " + trimmed;
    } else {
      merged.push(trimmed);
    }
  }
  return merged.filter(s => s.length > 0);
}

function parseStoryToSpeakerLines(title: string, content: string, childName: string) {
  const metadataIdx = content.search(/^SCENE METADATA/mi);
  const storyOnly = metadataIdx !== -1 ? content.slice(0, metadataIdx) : content;

  const titleLines = title ? [title] : [];
  const lines = [...titleLines, ...storyOnly.split("\n").map(l => l.trim()).filter(Boolean)];
  const childLabel = (childName || "").trim().toLowerCase();

  // pauseAfter marks a genuine paragraph/scene boundary worth a breath: the
  // last sentence of a narrator paragraph. Dialogue lines and mid-paragraph
  // sentences never get it — a forced pause after every single sentence and
  // every quick back-and-forth dialogue line is what made narration feel
  // like it stalled every few seconds (see story p7t50h8ddqm8 audit: 59
  // segments, every one padded with a breath, regardless of whether a pause
  // made sense there).
  const out: Array<{ order: number; speaker: string; text: string; pauseAfter: boolean }> = [];
  let orderIdx = 0;
  for (const line of lines) {
    const lower = line.toLowerCase();

    if (lower.startsWith("lalli:")) {
      out.push({ order: orderIdx++, speaker: "Lalli", text: line.replace(/^lalli:/i, "").trim(), pauseAfter: false });
    } else if (lower.startsWith("fafa:")) {
      out.push({ order: orderIdx++, speaker: "Fafa", text: line.replace(/^fafa:/i, "").trim(), pauseAfter: false });
    } else if (childLabel && lower.startsWith(childLabel + ":")) {
      out.push({ order: orderIdx++, speaker: childName, text: line.slice(childName.length + 1).trim(), pauseAfter: false });
    } else if (lower.startsWith("child:") || lower.startsWith("girl child:") || lower.startsWith("boy child:")) {
      out.push({ order: orderIdx++, speaker: "Child", text: line.replace(/^(child|girl child|boy child):/i, "").trim(), pauseAfter: false });
    } else if (lower.startsWith("narrator:") || lower.startsWith("narration:")) {
      // Strip the "Narrator:"/"Narration:" label before TTS — otherwise ElevenLabs
      // reads it aloud. The model occasionally echoes "Narration:" (from the
      // OUTPUT FORMAT prompt's own section heading) as a literal line prefix
      // even though it was never asked to label narration lines.
      const stripped = line.replace(/^narrator:\s*/i, "").replace(/^narration:\s*/i, "").trim();
      const sentences = splitToSentences(stripped);
      sentences.forEach((sentence, i) => {
        out.push({ order: orderIdx++, speaker: "Narrator", text: sentence, pauseAfter: i === sentences.length - 1 });
      });
    } else {
      // Narrator: split long paragraphs into individual sentences.
      // Each sentence gets its own TTS call so the voice resets between them.
      // Only the paragraph's last sentence is a pause boundary.
      const sentences = splitToSentences(line);
      sentences.forEach((sentence, i) => {
        out.push({ order: orderIdx++, speaker: "Narrator", text: sentence, pauseAfter: i === sentences.length - 1 });
      });
    }
  }
  return out;
}

/**
 * ElevenLabs reads the spelling "Lalli" with a short first vowel ("La-li"),
 * but the character's name is pronounced with a long first vowel ("Laa-li").
 * For narration only (never the stored story text/subtitles, which must keep
 * the "Lalli" spelling), respell every occurrence as "Laalli" so the TTS
 * voice says it correctly. Preserves the original capitalisation.
 */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function applyPronunciationFixes(text: string, childName?: string, childPhoneticName?: string): string {
  // Strip sound-effect stage directions (*Click!*, *Whoosh!*, etc.) — reader cues, not spoken words.
  let result = text.replace(/\*[^*\n]+\*/g, "").replace(/\s{2,}/g, " ").trim();
  result = result.replace(/\bLalli\b/gi, (match) => {
    if (match === match.toUpperCase()) return "LAALI";
    if (match[0] === match[0].toUpperCase()) return "Laali";
    return "laali";
  });
  result = result.replace(/\bFafa\b/gi, (match) => {
    if (match === match.toUpperCase()) return "FAAFA";
    if (match[0] === match[0].toUpperCase()) return "Faafa";
    return "faafa";
  });
  // Apply per-child phonetic override — TTS audio only, never stored text.
  if (childName && childPhoneticName && childPhoneticName !== childName) {
    result = result.replace(
      new RegExp(`\\b${escapeRegExp(childName)}\\b`, "gi"),
      (match) => {
        if (match === match.toUpperCase()) return childPhoneticName.toUpperCase();
        if (match[0] === match[0].toUpperCase()) return capitalize(childPhoneticName);
        return childPhoneticName.toLowerCase();
      }
    );
  }
  return result;
}

async function ttsArrayBuffer(
  voiceId: string,
  text: string,
  language: string,
  context?: { previousText?: string; nextText?: string }
): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVEN_LABS_API_KEY;
  if (!apiKey) throw new Error("ELEVEN_LABS_API_KEY env var is not set in Convex dashboard");

  const isMultilingual = isMultilingualLanguage(language);
  const modelId = isMultilingual ? "eleven_multilingual_v2" : "eleven_turbo_v2_5";

  const body: Record<string, unknown> = {
    text,
    model_id: modelId,
    output_format: "mp3_44100_64",
    voice_settings: {
      stability: 0.78,
      similarity_boost: 0.80,
      style: 0.10,
      use_speaker_boost: true,
      // 0.85, not the default 1.0 — deliberately slower for children's
      // storytelling pacing (tuning history: 0.9 → 0.85 → 0.82). Reverted
      // the last 0.85 → 0.82 step here: that step's own commit documented
      // it as a minor pronunciation-clarity tweak expected to add only
      // ~10-15s per story, not a tempo problem on its own — but stacked on
      // top of a forced pause after every one of 59 segments (see
      // parseStoryToSpeakerLines), the extra 3% slowdown compounded the
      // "everything drags" feeling. Keeping the original deliberate 0.85
      // slow-down, dropping only the undocumented-impact second step.
      speed: 0.85,
    },
    // Request-stitching context: without this, every one of ~30-60 TTS
    // calls per story is synthesized as a fully isolated utterance, each
    // with its own independent lead-in/lead-out silence baked in by the
    // model — on top of whatever pause text is actually present. Passing
    // the adjacent segments' text smooths prosody/pacing across the cut,
    // most valuable when previous/next is the same voice (consecutive
    // narrator sentences), harmless otherwise.
    ...(context?.previousText ? { previous_text: context.previousText } : {}),
    ...(context?.nextText ? { next_text: context.nextText } : {}),
  };
  // Do NOT set language_code for eleven_multilingual_v2 — the model auto-detects language.
  // Setting it (e.g. "hi" for Hindi) forces phonetic rules onto all text including English
  // words/names embedded in Hinglish, causing mispronunciation of names and loanwords.

  const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "(no body)");
    throw new Error(`ElevenLabs API error ${resp.status} for voice ${voiceId}: ${errText}`);
  }

  return resp.arrayBuffer();
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

// concurrency limiter — errors are logged and that line is skipped (not swallowed silently)
async function mapWithConcurrencyLimit<T, R>(
  array: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<(R | null)[]> {
  const results: (R | null)[] = new Array(array.length).fill(null);
  let activeCount = 0;
  let nextIndex = 0;

  await new Promise<void>((resolve, reject) => {
    function startNext() {
      while (activeCount < limit && nextIndex < array.length) {
        const idx = nextIndex++;
        activeCount++;
        fn(array[idx], idx)
          .then(res => {
            results[idx] = res;
          })
          .catch(err => {
            console.error(`[TTS] Line ${idx} failed:`, err?.message ?? err);
            results[idx] = null; // skip this line rather than crashing everything
          })
          .finally(() => {
            activeCount--;
            if (nextIndex < array.length) {
              startNext();
            } else if (activeCount === 0) {
              resolve();
            }
          });
      }
      if (nextIndex >= array.length && activeCount === 0) resolve();
    }
    startNext();
  });

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
    childPhoneticName?: string;
  }
) {
  console.log("Generating voice narration for story");
  const { storyId, title, content, childName, childGender, language, childPhoneticName } = args;

  // Load voice map from database once
  const voiceMap = await loadVoiceMap(ctx);
  if (!voiceMap.Narrator) {
    throw new Error("Voice models not found in database. Please run the seed function.");
  }

  const lines = parseStoryToSpeakerLines(title, content, childName);
  console.log(`[Narration] ${lines.length} lines to TTS. Language: ${language}. First 3:`, lines.slice(0, 3).map(l => `${l.speaker}: ${l.text.slice(0, 40)}`));

  // Precompute final per-segment text up front (pronunciation fixes + pause
  // suffix only at genuine paragraph boundaries) so adjacent segments' final
  // text is available as previous_text/next_text context for every call,
  // regardless of concurrency-limited completion order.
  const isEnglish = !isMultilingualLanguage(language);
  const pauseSuffix = isEnglish ? " ..." : " ।";
  const prepared = lines.map((l) => {
    const fixedText = applyPronunciationFixes(l.text, childName, childPhoneticName);
    return { ...l, fullText: l.pauseAfter ? fixedText + pauseSuffix : fixedText };
  });

  // ElevenLabs Starter plan allows 3 concurrent streams. Upgrading beyond 3 requires
  // a plan change first — do not increase this number without confirming the active plan tier.
  const results = await mapWithConcurrencyLimit(prepared, 3, async (l, idx) => {
    const voiceId = pickVoiceForSpeaker(voiceMap, l.speaker, childName, childGender, language);
    if (!voiceId) {
      console.error(`[TTS] No voice ID for speaker: ${l.speaker}`);
      return null;
    }
    const ab = await ttsArrayBuffer(voiceId, l.fullText, language, {
      previousText: prepared[idx - 1]?.fullText,
      nextText: prepared[idx + 1]?.fullText,
    });
    return { order: l.order, ab, chars: l.fullText.length };
  });

  // Filter out failed lines and merge in order
  const successful = results.filter((r): r is { order: number; ab: ArrayBuffer; chars: number } => r !== null);
  console.log(`[Narration] ${successful.length}/${lines.length} lines succeeded.`);
  // Cost tracking (Task C): characters actually sent to ElevenLabs for the
  // lines that succeeded (failed calls don't produce billable audio).
  const audioCharactersUsed = successful.reduce((sum, r) => sum + r.chars, 0);

  // If many segments failed, block storage — a truncated story stored as "ready" can never
  // be fixed by the user and is worse than a clean error they can re-generate.
  if (successful.length > 0 && successful.length < lines.length * 0.8) {
    throw new Error(
      `[Narration] Only ${successful.length}/${lines.length} TTS segments succeeded ` +
      `(${Math.round((successful.length / lines.length) * 100)}%). ` +
      `Likely cause: ElevenLabs account issue (low credits?). ` +
      `Story NOT stored — re-generate once the ElevenLabs account issue is resolved.`
    );
  }

  // If every single TTS call failed, throw so the story is properly marked as error
  // instead of silently storing an empty audio file that plays as silence.
  if (successful.length === 0) {
    throw new Error(`[Narration] All ${lines.length} TTS calls failed — check ELEVEN_LABS_API_KEY and voice model IDs in Convex dashboard`);
  }

  successful.sort((a, b) => a.order - b.order);
  const merged = concatMp3(successful.map(r => r.ab));

  const mergedBlob = new Blob([merged], { type: "audio/mpeg" });
  const storageId = await ctx.storage.store(mergedBlob);

  // Calculate real duration by parsing the merged MP3 rather than assuming a
  // fixed bitrate. The byte-size/64kbps estimate this replaced was wrong:
  // measured real output came back at ~128kbps, not the requested
  // mp3_44100_64, so the old estimate was ~2x too long for every story.
  // numberOfSamples/sampleRate is used (not format.duration) because that
  // field reads unreliably on this concatenated multi-segment file — verified
  // against real generated narration during the Task 4 duration audit.
  let audioDurationSeconds: number;
  try {
    const { parseBuffer } = await import("music-metadata");
    const meta = await parseBuffer(new Uint8Array(merged), "audio/mpeg");
    if (meta.format.numberOfSamples && meta.format.sampleRate) {
      audioDurationSeconds = Math.round(meta.format.numberOfSamples / meta.format.sampleRate);
    } else {
      throw new Error("music-metadata returned no sample count");
    }
  } catch (err) {
    console.error("Failed to parse narration duration, falling back to byte estimate:", err);
    audioDurationSeconds = Math.round(merged.byteLength / 16000); // fallback: assume 128kbps
  }

  await ctx.runMutation(api.stories._setNarrationFilePath, {
    storyId: storyId,
    filePath: storageId,
  });

  await ctx.runMutation(api.stories._setNarrationDuration, {
    storyId: storyId,
    durationSeconds: audioDurationSeconds,
  });

  await ctx.runMutation(api.stories._setAudioUsage, {
    storyId: storyId,
    audioCharactersUsed,
  });

  console.log("✅ Narration generated and stored:", storageId, `(${audioDurationSeconds}s)`);
  return { storageId, audioDurationSeconds };
}
