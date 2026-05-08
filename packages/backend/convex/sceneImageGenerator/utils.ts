import { Gender } from "./types";

export function getGenderLabel(gender: Gender): string {
  if (gender === "male") return "boy";
  if (gender === "female") return "girl";
  return "child";
}
