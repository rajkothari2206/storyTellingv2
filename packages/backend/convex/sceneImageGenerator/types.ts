export type Gender = "male" | "female" | "other";

export interface ChildInfo {
  name: string;
  age: number | string;
  gender: Gender;
  avatarFilePath?: string;
}

export interface SceneMetadata {
  sceneNumber: number;
  description: string;
  filePath?: string;
}

export interface PromptReferences {
  characterRefBase64?: string;
  childAvatarBase64?: string;
  previousSceneBase64?: string;
}
