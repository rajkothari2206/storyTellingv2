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
 * Processes and stores a single scene image.
 * Returns imageBase64 so the caller can chain it as the next scene's continuity reference.
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
    imageBase64: result.imageBase64, // returned for chaining
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

  // STEP 2: Generate remaining scenes sequentially for visual chaining
  // Each scene receives the previous scene's image as a continuity reference,
  // with Scene 1 always available as the style anchor via characterRefBase64.
  const remainingScenes = sortedScenes.slice(1);

  if (remainingScenes.length > 0) {
    console.log(`[generateAllSceneImages] Processing ${remainingScenes.length} remaining scenes sequentially with chaining`);

    let previousSceneBase64: string | undefined = firstSceneBase64;

    for (const scene of remainingScenes) {
      console.log(`[generateAllSceneImages] Generating scene ${scene.sceneNumber} (previousScene: ${previousSceneBase64 ? "yes" : "none"})`);

      const result = await processSceneImage(
        ctx,
        scene,
        child,
        storyId,
        characterRefBase64,
        previousSceneBase64,
        childAvatarBase64
      );

      // Chain: use this scene's image as the next scene's continuity reference
      if (result.imageBase64) {
        previousSceneBase64 = result.imageBase64;
      }

      results.push(result);
      console.log(`[generateAllSceneImages] Scene ${scene.sceneNumber} done (success: ${result.success})`);
    }
  }

  const failed = results.filter((r) => !r.success);
  if (failed.length) console.warn("Failed scenes:", failed);

  return results;
}
