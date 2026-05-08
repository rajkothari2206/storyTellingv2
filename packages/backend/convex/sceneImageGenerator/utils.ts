/**
 * Utility functions for image processing and storage
 */
import { GoogleGenAI } from "@google/genai";
import { ActionCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { LALLI_FAFA_STORAGE_ID, PNG_MIME_TYPE } from "./constants";

/**
 * Converts a Blob to a base64 string
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts a base64 string to a Blob
 */
export function base64ToBlob(base64: string): Blob {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return new Blob([bytes.buffer], { type: PNG_MIME_TYPE });
}

/**
 * Creates and returns a Gemini AI client
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key not found");
  return new GoogleGenAI({ apiKey });
}

/**
 * Loads an image from Convex storage by its ID and returns it as a base64 string
 */
export async function loadImageFromStorage(
  ctx: ActionCtx,
  storageId: string
): Promise<string | undefined> {
  try {
    const blob = await ctx.storage.get(storageId as Id<"_storage">);
    if (!blob) throw new Error("Could not read image from storage");
    return await blobToBase64(blob);
  } catch (err) {
    console.warn("Failed to load image from storage:", err);
    return undefined;
  }
}

/**
 * Loads the Lalli & Fafa reference image as base64 from Convex storage
 */
export async function loadReferenceImage(ctx: ActionCtx): Promise<string | undefined> {
  return loadImageFromStorage(ctx, LALLI_FAFA_STORAGE_ID);
}

/**
 * Stores an image from a base64 string into Convex storage
 */
export async function storeImageFromBase64(ctx: ActionCtx, base64: string): Promise<string> {
  const blob = base64ToBlob(base64);
  return ctx.storage.store(blob);
}

/**
 * Gets gender label for prompt generation
 */
export function getGenderLabel(gender: "male" | "female" | "other"): string {
  switch (gender) {
    case "male":
      return "boy";
    case "female":
      return "girl";
    default:
      return "child";
  }
}
