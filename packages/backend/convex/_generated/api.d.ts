/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as blogs from "../blogs.js";
import type * as credit from "../credit.js";
import type * as crons from "../crons.js";
import type * as generateStory from "../generateStory.js";
import type * as healthCheck from "../healthCheck.js";
import type * as http from "../http.js";
import type * as internal_generateNarration from "../internal/generateNarration.js";
import type * as internal_generateSceneImage from "../internal/generateSceneImage.js";
import type * as migration_flavor_endings from "../migration/flavor_endings.js";
import type * as migration_flavor_magical_triggers from "../migration/flavor_magical_triggers.js";
import type * as migration_flavor_obstacles from "../migration/flavor_obstacles.js";
import type * as migration_flavor_openings from "../migration/flavor_openings.js";
import type * as migration_flavor_payoffs from "../migration/flavor_payoffs.js";
import type * as migration_languages from "../migration/languages.js";
import type * as migration_lesson from "../migration/lesson.js";
import type * as migration_personality from "../migration/personality.js";
import type * as migration_razorpay_plan from "../migration/razorpay_plan.js";
import type * as migration_seed_system_prompt from "../migration/seed_system_prompt.js";
import type * as migration_story_types from "../migration/story_types.js";
import type * as migration_structure from "../migration/structure.js";
import type * as migration_system_config from "../migration/system_config.js";
import type * as migration_theme from "../migration/theme.js";
import type * as migration_theme_compatibility from "../migration/theme_compatibility.js";
import type * as migration_voice_models from "../migration/voice_models.js";
import type * as narrationGenerator from "../narrationGenerator.js";
import type * as privateData from "../privateData.js";
import type * as razorpay_create_subscription from "../razorpay/create_subscription.js";
import type * as razorpay_initiate_razorpay from "../razorpay/initiate_razorpay.js";
import type * as razorpay_webhook from "../razorpay/webhook.js";
import type * as sceneImageGenerator_constants from "../sceneImageGenerator/constants.js";
import type * as sceneImageGenerator_imageGenerator from "../sceneImageGenerator/imageGenerator.js";
import type * as sceneImageGenerator_index from "../sceneImageGenerator/index.js";
import type * as sceneImageGenerator_promptBuilder from "../sceneImageGenerator/promptBuilder.js";
import type * as sceneImageGenerator_types from "../sceneImageGenerator/types.js";
import type * as sceneImageGenerator_utils from "../sceneImageGenerator/utils.js";
import type * as stories from "../stories.js";
import type * as storyElementSelector from "../storyElementSelector.js";
import type * as storyPromptFormatter from "../storyPromptFormatter.js";
import type * as subscription from "../subscription.js";
import type * as systemConfig from "../systemConfig.js";
import type * as userProfiles from "../userProfiles.js";
import type * as voiceMap from "../voiceMap.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  blogs: typeof blogs;
  credit: typeof credit;
  crons: typeof crons;
  generateStory: typeof generateStory;
  healthCheck: typeof healthCheck;
  http: typeof http;
  "internal/generateNarration": typeof internal_generateNarration;
  "internal/generateSceneImage": typeof internal_generateSceneImage;
  "migration/flavor_endings": typeof migration_flavor_endings;
  "migration/flavor_magical_triggers": typeof migration_flavor_magical_triggers;
  "migration/flavor_obstacles": typeof migration_flavor_obstacles;
  "migration/flavor_openings": typeof migration_flavor_openings;
  "migration/flavor_payoffs": typeof migration_flavor_payoffs;
  "migration/languages": typeof migration_languages;
  "migration/lesson": typeof migration_lesson;
  "migration/personality": typeof migration_personality;
  "migration/razorpay_plan": typeof migration_razorpay_plan;
  "migration/seed_system_prompt": typeof migration_seed_system_prompt;
  "migration/story_types": typeof migration_story_types;
  "migration/structure": typeof migration_structure;
  "migration/system_config": typeof migration_system_config;
  "migration/theme": typeof migration_theme;
  "migration/theme_compatibility": typeof migration_theme_compatibility;
  "migration/voice_models": typeof migration_voice_models;
  narrationGenerator: typeof narrationGenerator;
  privateData: typeof privateData;
  "razorpay/create_subscription": typeof razorpay_create_subscription;
  "razorpay/initiate_razorpay": typeof razorpay_initiate_razorpay;
  "razorpay/webhook": typeof razorpay_webhook;
  "sceneImageGenerator/constants": typeof sceneImageGenerator_constants;
  "sceneImageGenerator/imageGenerator": typeof sceneImageGenerator_imageGenerator;
  "sceneImageGenerator/index": typeof sceneImageGenerator_index;
  "sceneImageGenerator/promptBuilder": typeof sceneImageGenerator_promptBuilder;
  "sceneImageGenerator/types": typeof sceneImageGenerator_types;
  "sceneImageGenerator/utils": typeof sceneImageGenerator_utils;
  stories: typeof stories;
  storyElementSelector: typeof storyElementSelector;
  storyPromptFormatter: typeof storyPromptFormatter;
  subscription: typeof subscription;
  systemConfig: typeof systemConfig;
  userProfiles: typeof userProfiles;
  voiceMap: typeof voiceMap;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
