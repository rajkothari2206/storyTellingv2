/**
 * Core image generation logic using Gemini AI
 */
import { ActionCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { api } from "../_generated/api";
import {
  ChildInfo,
  SceneMetadata,
  ImageGenerationResult,
  AvatarGenerationResult,
  SceneGenerationResult,
} from "./types";
import { GEMINI_IMAGE_MODEL } from "./constants";
import {
  getGeminiClient,
  loadImageFromStorage,
  loadReferenceImage,
  storeImageFromBase64,
} from "./utils";
import { assemblePromptPartsWithLabels, createScenePrompt, createChildAvatarPrompt } from "./promptBuilder";

/**
 * Generates one scene image using Gemini
 */
export async function generateSceneImage(
  ctx: ActionCtx,
  scene: SceneMetadata,
  child: ChildInfo,
  characterReferenceBase64?: string,
  previousSceneBase64?: string,
  childAvatarBase64?: string
): Promise<ImageGenerationResult> {
  try {
    const textPrompt = createScenePrompt(scene, child, !!childAvatarBase64, !!previousSceneBase64);

    const promptParts = assemblePromptPartsWithLabels({
      textPrompt,
      characterRefBase64: characterReferenceBase64,
      childAvatarBase64: childAvatarBase64,
      previousSceneBase64: previousSceneBase64,
    });

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: promptParts,
    });

    for (const part of response?.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return { imageBase64: part.inlineData.data };
      }
    }
    return { error: "No image data returned" };
  } catch (err: any) {
    return { error: err?.message || "Image generation failed" };
  }
}

/**
 * Generates a child avatar image
 */
export async function generateChildAvatar(
  ctx: ActionCtx,
  child: ChildInfo,
  referenceStorageId?: string
): Promise<AvatarGenerationResult> {
  try {
    const textPrompt = createChildAvatarPrompt(child);

    // If we have a reference image (child's uploaded photo), include it
    const referenceBase64 = referenceStorageId
      ? await loadImageFromStorage(ctx, referenceStorageId)
      : undefined;

    const promptParts = assemblePromptPartsWithLabels({
      textPrompt,
      characterRefBase64: undefined,
      childAvatarBase64: referenceBase64,
      previousSceneBase64: undefined,
    });

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: promptParts,
    });

    for (const part of response?.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        const avatarStorageId = await storeImageFromBase64(ctx, part.inlineData.data);
        return { avatarStorageId };
      }
    }
    return { error: "No image data returned" };
  } catch (err: any) {
    console.error("Avatar generation failed:", err);
    return { error: err?.message || "Avatar generation failed" };
  }
}

/**
 * Processes and stores a single scene image
 */
async function processSceneImage(
  ctx: ActionCtx,
  scene: SceneMetadata,
  child: ChildInfo,
  storyId: Id<"stories">,
  characterRefBase64?: string,
  previousSceneBase64?: string,
  childAvatarBase64?: string
): Promise<SceneGenerationResult> {

  const result = await generateSceneImage(
    ctx,
    scene,
    child,
    characterRefBase64,
    previousSceneBase64,
    childAvatarBase64
  );

  if (result.error || !result.imageBase64) {
    return {
      sceneNumber: scene.sceneNumber,
      success: false,
      error: result.error,
    };
  }

  const storageId = await storeImageFromBase64(ctx, result.imageBase64);
  await ctx.runMutation(api.stories._updateSceneFilePath, {
    storyId,
    sceneNumber: scene.sceneNumber,
    filePath: storageId,
  });

  return {
    sceneNumber: scene.sceneNumber,
    success: true,
  };
}

/**
 * Generates and stores all scene images with batched approach:
 * - Scene 1 generated first
 * - Remaining scenes generated in small batches (2 at a time) to avoid memory issues
 * - All scenes use Scene 1 as reference for consistency
 * This balances speed with memory efficiency
 */
export async function generateAllSceneImages(
  ctx: ActionCtx,
  scenes: SceneMetadata[],
  child: ChildInfo,
  storyId: Id<"stories">,
  childAvatarStorageId?: string
): Promise<SceneGenerationResult[]> {
  if (!scenes.length) return [];

  // Sort scenes by sceneNumber
  const sortedScenes = [...scenes].sort((a, b) => a.sceneNumber - b.sceneNumber);

  // Load character reference image (Lalli & Fafa) once
  const characterRefBase64 = await loadReferenceImage(ctx);

  // Load child avatar if available
  const childAvatarBase64 = childAvatarStorageId
    ? await loadImageFromStorage(ctx, childAvatarStorageId)
    : undefined;

  const results: SceneGenerationResult[] = [];

  // STEP 1: Generate first scene (anchor scene)
  const firstScene = sortedScenes[0];

  const firstResult = await generateSceneImage(
    ctx,
    firstScene,
    child,
    characterRefBase64,
    undefined, // No previous scene for first one
    childAvatarBase64
  );

  let firstSceneBase64: string | undefined = undefined;

  if (firstResult.error || !firstResult.imageBase64) {
    results.push({
      sceneNumber: firstScene.sceneNumber,
      success: false,
      error: firstResult.error,
    });
  } else {
    const firstSceneStorageId = await storeImageFromBase64(ctx, firstResult.imageBase64);
    firstSceneBase64 = firstResult.imageBase64;

    await ctx.runMutation(api.stories._updateSceneFilePath, {
      storyId,
      sceneNumber: firstScene.sceneNumber,
      filePath: firstSceneStorageId,
    });

    results.push({
      sceneNumber: firstScene.sceneNumber,
      success: true,
    });
  }

  // STEP 2: Generate remaining scenes in small batches to avoid memory issues
  const remainingScenes = sortedScenes.slice(1);
  const BATCH_SIZE = 2; // Process 2 scenes at a time to avoid memory overflow

  if (remainingScenes.length > 0) {
    console.log(`[generateAllSceneImages] Processing ${remainingScenes.length} remaining scenes in batches of ${BATCH_SIZE}`);
    
    for (let i = 0; i < remainingScenes.length; i += BATCH_SIZE) {
      const batch = remainingScenes.slice(i, i + BATCH_SIZE);
      console.log(`[generateAllSceneImages] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}: scenes ${batch.map(s => s.sceneNumber).join(', ')}`);
      
      const batchPromises = batch.map((scene) =>
        processSceneImage(
          ctx,
          scene,
          child,
          storyId,
          characterRefBase64,
          firstSceneBase64,
          childAvatarBase64
        )
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      console.log(`[generateAllSceneImages] Completed batch ${Math.floor(i / BATCH_SIZE) + 1}`);
    }
  }

  const failed = results.filter((r) => !r.success);
  if (failed.length) console.warn("Failed scenes:", failed);

  return results;
}
