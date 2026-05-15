/**
 * Formats story inputs into a structured prompt for the AI
 */

type ChildInfo = {
  name: string;
  gender: string;
  age: number;
};

type StoryParams = {
  theme: string;
  lesson?: string;
  language?: string;
  storyType?: string | null;   // "adventure" | "silly" | "cozy"
  storyTypeName?: string;      // "Big Adventure" | "Silly & Funny" | "Cozy Bedtime"
  storyTypePromptHint?: string; // The prompt hint from DB
};

/**
 * Returns a clean language label for the prompt
 */
function getLanguageLabel(language?: string): string {
  if (!language) return "English";
  // Normalize: capitalise first letter
  return language.charAt(0).toUpperCase() + language.slice(1).toLowerCase();
}

/**
 * Formats the complete story prompt sent to GPT.
 * Returns a JSON string with structured inputs.
 */
export function formatStoryPrompt(
  childInfo: ChildInfo,
  params: StoryParams
): string {
  const genderLabel =
    childInfo.gender === "male" ? "boy" : childInfo.gender === "female" ? "girl" : "child";

  const language = getLanguageLabel(params.language);

  const storyTypeName = params.storyTypeName || mapStoryTypeCode(params.storyType);
  const storyTypeHint = params.storyTypePromptHint || getDefaultHint(params.storyType);

  const payload = {
    child: {
      name: childInfo.name,
      gender: childInfo.gender,
      genderLabel,
      age: childInfo.age,
    },
    story: {
      theme: params.theme,
      lesson: params.lesson || null,
      language,
      storyType: storyTypeName,
      storyTypeGuidance: storyTypeHint,
    },
    instructions: "BEGIN STORY NOW. MANDATORY: The story body must be exactly 255–270 words (title excluded, SCENE METADATA excluded). Count your words before finalising. Each of the 5 scenes must be approximately 51–54 words of story content. Do NOT exceed 270 words — this is a hard upper limit. Keep sentences short and punchy. Do NOT write a longer story thinking more is better — shorter is correct.",
  };

  return JSON.stringify(payload, null, 2);
}

function mapStoryTypeCode(code?: string | null): string {
  const map: Record<string, string> = {
    adventure: "Big Adventure",
    silly: "Silly & Funny",
    cozy: "Cozy Bedtime",
  };
  return code ? (map[code] ?? "Big Adventure") : "Big Adventure";
}

function getDefaultHint(code?: string | null): string {
  const map: Record<string, string> = {
    adventure: "Quest structure: problem → journey → unexpected twist → resolution. Sense of movement and discovery.",
    silly: "Twist structure: comic misunderstanding escalates → Fafa's absurd solution attempted → goes hilariously wrong → accidentally fixes everything.",
    cozy: "Cozy structure: quiet beginning → soft exploration → gentle resolution. Slow pacing, rich sensory detail, no dramatic tension.",
  };
  return code ? (map[code] ?? map.adventure) : map.adventure;
}

export type { ChildInfo, StoryParams };
