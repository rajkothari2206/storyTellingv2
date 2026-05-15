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
 * Generates and stores all scene images sequentially.
 * Each scene gets the character reference image for consistency,
 * but NOT the previous scene — this prevents composition copying
 * which causes scenes to look identical.
 */
export async function generateAllSceneImages(
  ctx: ActionCtx,
  scenes: SceneMetadata[],
  child: ChildInfo,
  storyId: Id<"stories">,
  childAvatarStorageId?: string
): Promise<SceneGenerationResult[]> {
  if (!scenes.length) return [];

  const sortedScenes = [...scenes].sort((a, b) => a.sceneNumber - b.sceneNumber);

  // Load the Lalli & Fafa character reference once — used for every scene
  const characterRefBase64 = await loadReferenceImage(ctx);

  // Load child avatar if available
  const childAvatarBase64 = childAvatarStorageId
    ? await loadImageFromStorage(ctx, childAvatarStorageId)
    : undefined;

  const results: SceneGenerationResult[] = [];

  for (const scene of sortedScenes) {
    console.log(`[generateAllSceneImages] Generating scene ${scene.sceneNumber}`);

    // Generate without previous scene — avoids composition copying that makes scenes look identical.
    // Character consistency is maintained via characterRefBase64 + STYLE_LOCK in the prompt.
    let result = await processSceneImage(
      ctx,
      scene,
      child,
      storyId,
      characterRefBase64,
      undefined, // no previousScene
      childAvatarBase64
    );

    // Retry once on failure before giving up
    if (!result.success) {
      console.warn(`[generateAllSceneImages] Scene ${scene.sceneNumber} failed (${result.error}), retrying...`);
      result = await processSceneImage(
        ctx,
        scene,
        child,
        storyId,
        characterRefBase64,
        undefined,
        childAvatarBase64
      );
    }

    results.push(result);
    console.log(`[generateAllSceneImages] Scene ${scene.sceneNumber} done (success: ${result.success})`);
  }

  const failed = results.filter((r) => !r.success);
  if (failed.length) console.warn("Failed scenes:", failed);

  return results;
}
