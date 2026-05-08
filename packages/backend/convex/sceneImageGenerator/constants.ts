/**
 * Constants for scene image generation
 */
import { Id } from "../_generated/dataModel";

// Reference image of Lalli & Fafa in Convex Storage
export const LALLI_FAFA_STORAGE_ID = "kg266f69m4h0yy1wzhm3gk36qh7v76p5" as Id<"_storage">;

// Image/Model constants
export const PNG_MIME_TYPE = "image/png";
export const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";

// Prompt labels
export const PROMPT_LABELS = {
  CHARACTER_REFERENCE: "CRITICAL REFERENCE: This image shows Lalli and Fafa's EXACT appearance. You MUST match their facial features, hair color/style, clothing, body proportions, and overall design EXACTLY in every scene. Copy their appearance precisely - do not reinterpret or modify their looks.",
  CHILD_REFERENCE: "CRITICAL REFERENCE: This image shows the child character's EXACT appearance. You MUST match their facial features, hair color/style, clothing, body proportions, and overall design EXACTLY in every scene. Copy their appearance precisely - do not reinterpret or modify their looks.",
  VISUAL_CONTINUITY: "VISUAL CONTINUITY REFERENCE: This previous scene shows the exact art style, color palette, lighting, and character appearances. Match the visual style, character designs, and overall aesthetic EXACTLY. Maintain the same character proportions, facial features, and clothing from this reference.",
} as const;
