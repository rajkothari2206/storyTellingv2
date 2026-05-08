/**
 * Scene Image Generator Module
 * 
 * This module provides functionality for generating story scene images and child avatars
 * using Google's Gemini AI with reference images for character consistency.
 */

// Export types
export type {
  ChildInfo,
  SceneMetadata,
  ImageGenerationResult,
  AvatarGenerationResult,
  SceneGenerationResult,
  PromptReferences,
} from "./types";

// Export constants
export {
  LALLI_FAFA_STORAGE_ID,
  PNG_MIME_TYPE,
  GEMINI_IMAGE_MODEL,
  PROMPT_LABELS,
} from "./constants";

// Export utilities
export {
  blobToBase64,
  base64ToBlob,
  getGeminiClient,
  loadImageFromStorage,
  loadReferenceImage,
  storeImageFromBase64,
  getGenderLabel,
} from "./utils";

// Export prompt builders
export {
  assemblePromptPartsWithLabels,
  createScenePrompt,
  createChildAvatarPrompt,
} from "./promptBuilder";

// Export main image generation functions
export {
  generateSceneImage,
  generateChildAvatar,
  generateAllSceneImages,
} from "./imageGenerator";
