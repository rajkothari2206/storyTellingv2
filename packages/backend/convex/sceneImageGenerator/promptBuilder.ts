/**
 * Prompt building logic for image generation
 */
import { Part } from "@google/genai";
import { ChildInfo, SceneMetadata, PromptReferences } from "./types";
import { PROMPT_LABELS, PNG_MIME_TYPE } from "./constants";
import { getGenderLabel } from "./utils";

/**
 * Universal style lock applied to EVERY scene prompt.
 * This is the single source of truth for the visual language.
 * Gemini must obey these constraints before anything else.
 */
const STYLE_LOCK = `
STYLE LOCK — APPLY TO EVERY SCENE, NO EXCEPTIONS:
• Art style: flat 2D vector cartoon, children's picture book illustration
• Color palette: warm soft pastels (peach, lavender, mint, soft gold, sky blue) — NO neon, NO dark/gritty tones
• Linework: clean smooth outlines, consistent stroke weight throughout
• Rendering: soft cell-shading only — NO photorealism, NO 3D rendering, NO painterly textures
• Lighting: warm, diffused, even — no harsh shadows or dramatic contrast
• Proportions: slightly chibi/big-headed for characters (large expressive eyes, small noses)
• Background: simple, colorful, uncluttered — complements characters without overpowering them
• Mood: warm, cheerful, safe, joyful — suitable for children aged 2–8
`.trim();

/**
 * Assembles prompt parts with reference images and labels
 */
export function assemblePromptPartsWithLabels({
  textPrompt,
  characterRefBase64,
  childAvatarBase64,
  previousSceneBase64,
}: {
  textPrompt: string;
  characterRefBase64?: string;
  childAvatarBase64?: string;
  previousSceneBase64?: string;
}): Part[] {
  const parts: Part[] = [];

  if (characterRefBase64) {
    parts.push({ text: PROMPT_LABELS.CHARACTER_REFERENCE });
    parts.push({
      inlineData: {
        mimeType: PNG_MIME_TYPE,
        data: characterRefBase64,
      },
    });
  }

  if (childAvatarBase64) {
    parts.push({ text: PROMPT_LABELS.CHILD_REFERENCE });
    parts.push({
      inlineData: {
        mimeType: PNG_MIME_TYPE,
        data: childAvatarBase64,
      },
    });
  }

  if (previousSceneBase64) {
    parts.push({ text: PROMPT_LABELS.VISUAL_CONTINUITY });
    parts.push({
      inlineData: {
        mimeType: PNG_MIME_TYPE,
        data: previousSceneBase64,
      },
    });
  }

  // Add main text prompt last
  parts.push({ text: textPrompt });

  return parts;
}

/**
 * Creates an image generation prompt for a story scene
 */
export function createScenePrompt(
  scene: SceneMetadata,
  child: ChildInfo,
  hasChildAvatar: boolean,
  hasPreviousScene: boolean
): string {
  const genderLabel = getGenderLabel(child.gender);

  // When no child photo is provided, give Gemini a concrete physical anchor
  // so it doesn't freely reinvent the character each scene
  const childFallbackDescription =
    child.gender === "female"
      ? `${child.name} is a ${child.age}-year-old Indian girl with warm brown skin, long dark black hair (tied in two pigtails or loose), large expressive dark brown eyes, a small round nose, and a bright friendly smile. She wears a colourful outfit (use the same outfit throughout all scenes — pick one at scene 1 and lock it in).`
      : child.gender === "male"
        ? `${child.name} is a ${child.age}-year-old Indian boy with warm brown skin, short neat dark black hair, large expressive dark brown eyes, a small round nose, and a wide friendly smile. He wears a colourful outfit (use the same outfit throughout all scenes — pick one at scene 1 and lock it in).`
        : `${child.name} is a ${child.age}-year-old Indian child with warm brown skin, dark black hair, large expressive dark brown eyes, and a friendly smile. Maintain the exact same appearance and outfit in every scene.`;

  const childPrompt = hasChildAvatar
    ? `Copy the EXACT appearance from the child reference image — match facial features, skin tone, hair colour/style, clothing colours and patterns, body proportions precisely. Do NOT change their look.`
    : `${childFallbackDescription} Keep ${child.name}'s appearance IDENTICAL across all scenes.`;

  const continuityPrompt = hasPreviousScene
    ? `\nVISUAL CONTINUITY: The previous scene image is provided as a reference. Match the art style, colour palette, character designs, proportions, and overall aesthetic EXACTLY from that image. Characters must look identical to how they appeared in the previous scene.`
    : "";

  return `
${STYLE_LOCK}

---

SCENE ${scene.sceneNumber} — ILLUSTRATION BRIEF:
${scene.description}

---

CHARACTER CONSISTENCY (CRITICAL — DO NOT DEVIATE):

LALLI (girl):
• Indian girl, warm brown skin, rosy cheeks, large dark expressive eyes, wide warm smile
• Hair: dark brown, always in TWO HIGH PIGTAILS with orange hair ties — never loose, never in a bun
• Outfit: yellow short-sleeve dress with orange star print — ALWAYS this exact dress, never a different colour
• Accessories: small teal/turquoise crossbody shoulder bag
• Shoes: white ankle socks, orange Mary Jane shoes
• She is always cheerful, often waving or gesturing

FAFA (boy):
• Indian boy, warm brown skin, rosy cheeks, large dark expressive eyes, wide open happy smile
• Hair: short dark brown, slightly spiky/tousled — never long
• Outfit: yellow short-sleeve t-shirt UNDER teal/turquoise bib overalls (dungarees) — ALWAYS this exact outfit
• Signature prop: ALWAYS holding or carrying a light blue bunny plush toy
• Shoes: yellow socks, orange rounded shoes
• He is always curious and joyful

These descriptions are ABSOLUTE — do not change Lalli's or Fafa's outfit, hair, or colours under any circumstances.
Also use the character reference image provided to match their faces and proportions exactly.

${child.name.toUpperCase()} (THE CHILD CHARACTER):
${childPrompt}

---

COMPOSITION GUIDELINES:
• Format: landscape orientation (wider than tall) — compose accordingly
• Character placement: position characters in the UPPER 60–70% of the frame; leave the lower 30% for ground, grass, floor, or simple background elements — never place faces or important details at the very bottom
• Engaging, clear focal point — characters well-framed and fully visible
• Child-friendly, warm lighting — no harsh shadows
• Colourful, simple background that tells the scene's story without cluttering
• All characters visible and on-model
${continuityPrompt}

FINAL CHECK: The style must be flat 2D cartoon, pastel palette, soft cell-shading — matching the character reference image exactly. Any photorealism, 3D rendering, or style drift is unacceptable.
`.trim();
}

/**
 * Creates a prompt for generating a child avatar
 */
export function createChildAvatarPrompt(child: ChildInfo): string {
  const genderLabel = getGenderLabel(child.gender);

  return `
${STYLE_LOCK}

---

Create a children's storybook CHARACTER PORTRAIT for the following child.
This portrait will be used as the REFERENCE IMAGE for all story scene illustrations,
so it must clearly establish the character's fixed, consistent appearance.

CHARACTER DETAILS:
- Name: ${child.name}
- Age: ${child.age} years old
- Gender: ${genderLabel}

ETHNICITY & APPEARANCE (lock these in — they must not change across scenes):
- Indian/South Asian ethnicity
- Warm brown/tan skin tone (natural Indian complexion)
- Dark brown or black hair — clean, styled, age-appropriate
- Friendly, expressive large dark brown eyes (slightly chibi proportions)
- Natural Indian facial features — round face, small nose, warm smile
- Colourful, age-appropriate clothing — one specific outfit that will be used throughout the story

PORTRAIT REQUIREMENTS:
- Full character visible from waist up, or full body if space allows
- Centred composition, neutral or simple colourful background
- Friendly, welcoming expression — approachable and joyful
- The character must be recognisably Indian, suitable for a ${child.age}-year-old ${genderLabel}

If a child reference photo is provided: copy the facial features, hair, and clothing precisely.
`.trim();
}
