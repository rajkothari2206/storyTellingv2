/**
 * Type definitions for scene image generation
 */

export interface ChildInfo {
  name: string;
  gender: "male" | "female" | "other";
  age: number;
}

export interface SceneMetadata {
  sceneNumber: number;
  description: string;
  filePath: string;
}

export interface ImageGenerationResult {
  imageBase64?: string;
  error?: string;
}

export interface AvatarGenerationResult {
  avatarStorageId?: string;
  error?: string;
}

export interface SceneGenerationResult {
  sceneNumber: number;
  success: boolean;
  error?: string;
}

export interface PromptReferences {
  characterRefBase64?: string;
  childAvatarBase64?: string;
  previousSceneBase64?: string;
}
