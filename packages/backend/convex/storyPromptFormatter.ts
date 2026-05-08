/**
 * Utility function to format story elements into a structured prompt
 */

// Types for the selected elements from storyElementSelector
type SelectedElement = {
  code: string;
  description: string;
  [key: string]: any; // Allow for additional fields like exampleContext, solutions, etc.
};

type PersonalityTrait = {
  code: string;
  childRole: string;
  fafaRole: string;
  lalliRole: string;
  [key: string]: any;
};

type SelectedStoryElements = {
  structureCode: string;
  openings: SelectedElement[];
  triggers: SelectedElement[];
  obstacles: SelectedElement[];
  payoffs: SelectedElement[];
  endings: SelectedElement[];
  personalityTraits: PersonalityTrait[];
};

type StructureInfo = {
  code: string;
  name: string;
  pattern: string[];
};

type ChildInfo = {
  name: string;
  gender: string;
  age: number;
};

type StoryParams = {
  theme: string;
  lesson?: string;
  language?: string;
  length: "short" | "medium" | "long";
};

/**
 * Maps length to duration text
 */
function getDurationText(length: "short" | "medium" | "long"): string {
  const durationMap = {
    short: "short ~ 350 words",
    medium: "medium ~ 400 words",
    long: "long ~ 450 words",
  };
  return durationMap[length];
}

/**
 * Formats an array of elements as "[CODE] Description OR [CODE] Description"
 */
function formatElements(
  elements: SelectedElement[],
  formatter?: (el: SelectedElement) => string
): string {
  if (elements.length === 0) return "None";
  const formatItem = formatter || ((el) => `${el.description}`);
  return elements.map(formatItem).join(" OR ");
}

/**
 * Formats personality traits
 * Shows all character roles (Fafa, Child, Lalli) for each trait
 */
function formatPersonalityTraits(traits: PersonalityTrait[], childName: string): string {
  if (traits.length === 0) return "None";
  return traits
    .map((trait) => {
      // Show all three character roles for each trait
      return `Fafa: ${trait.fafaRole}, ${childName}: ${trait.childRole}, Lalli: ${trait.lalliRole}`;
    })
    .join(" AND ");
}

/**
 * Formats the story backbone pattern as "Step1 → Step2 → Step3"
 */
function formatPattern(pattern: string[]): string {
  return pattern.map((step) => step.toLowerCase()).join(" → ");
}

/**
 * Main function to format the complete story prompt.
 * Returns a JSON string containing structured prompt data.
 */
export function formatStoryPrompt(
  selectedElements: SelectedStoryElements,
  structureInfo: StructureInfo,
  childInfo: ChildInfo,
  params: StoryParams
): string {
  const { structureCode, openings, triggers, obstacles, payoffs, endings, personalityTraits } =
    selectedElements;

  const genderLabel =
    childInfo.gender === "male" ? "boy" : childInfo.gender === "female" ? "girl" : "child";
  const duration = getDurationText(params.length);
  const language = params.language || "English";

  const structureLine = `${structureCode} – ${structureInfo.name}`;
  const patternLine = formatPattern(structureInfo.pattern);

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
      duration,
    },
    structure: {
      code: structureCode,
      name: structureInfo.name,
      pattern: structureInfo.pattern,
      patternLine,
      display: structureLine,
    },
    creativeMenus: {
      characterDynamic: formatPersonalityTraits(personalityTraits, childInfo.name),
      opening: formatElements(openings),
      magicalTrigger: formatElements(triggers),
      obstacle: formatElements(obstacles),
      payoff: formatElements(payoffs),
      ending: formatElements(endings),
    },
    instructions: "BEGIN STORY NOW.",
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Helper function to get structure info from database
 * This can be called from within a Convex function to fetch structure details
 */
export type { SelectedStoryElements, StructureInfo, ChildInfo, StoryParams };

