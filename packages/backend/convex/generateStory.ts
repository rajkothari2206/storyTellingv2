import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";
import { GoogleGenAI } from "@google/genai";
import { api, internal } from "./_generated/api";
import { formatStoryPrompt } from "./storyPromptFormatter";

// ─── Internal action: does all the slow Gemini work in the background ───────

export const _generateContent = internalAction({
  args: {
    storyId: v.id("stories"),
    theme: v.string(),
    lesson: v.optional(v.string()),
    language: v.optional(v.string()),
    storyTypeCode: v.optional(v.string()),
    storyTypeName: v.optional(v.string()),
    storyTypePromptHint: v.optional(v.string()),
    creditId: v.id("user_credits"),
    childInfo: v.object({
      id: v.union(v.literal("1"), v.literal("2")),
      name: v.string(),
      gender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
      age: v.number(),
      avatarStorageId: v.optional(v.string()),
    }),
  },

  handler: async (ctx, args) => {
    const { storyId, theme, lesson, language, storyTypeCode, storyTypeName, storyTypePromptHint, creditId, childInfo } = args;

    await ctx.runMutation(api.stories._markStatus, {
      storyId,
      status: "generating",
    });

    const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const formattedPrompt = formatStoryPrompt(
      { name: childInfo.name, gender: childInfo.gender, age: childInfo.age },
      {
        theme,
        lesson: lesson || undefined,
        language,
        storyType: storyTypeCode,
        storyTypeName,
        storyTypePromptHint,
      }
    );

    // Get system prompt: try DB first, fall back to env var
    const systemConfig = await ctx.runQuery((api as any).systemConfig.get, {
      key: "system_prompt",
    });
    const system = systemConfig?.value || process.env.SYSTEM_PROMPT;
    if (!system) {
      await ctx.runMutation(api.stories._markStatus, {
        storyId,
        status: "error",
        error: "SYSTEM_PROMPT not configured",
      });
      throw new Error("SYSTEM_PROMPT not configured.");
    }

    const makeStoryRequest = async (temperature: number) =>
      gemini.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          temperature,
          systemInstruction: system,
        },
        contents: [{ role: "user", parts: [{ text: formattedPrompt }] }],
      });

    let resp = await makeStoryRequest(0.4);
    let content = resp.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    // Retry if model returned a non-story response
    const isNonStory = !content || content.length < 200 || /^[A-Z_]+$/.test(content);
    if (isNonStory) {
      console.warn("AI returned non-story response, retrying:", content.slice(0, 80));
      const retryResp = await gemini.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          temperature: 0.7,
          systemInstruction: system,
        },
        contents: [
          {
            role: "user",
            parts: [{
              text: formattedPrompt +
                "\n\nReminder: write the story now. Keep all structural labels " +
                "(SCENE METADATA, Scene 1:, Scene 2:, Lalli:, Fafa:) in English. " +
                "Only the story prose and dialogue should be in the requested language.",
            }],
          },
        ],
      });
      content = retryResp.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    }

    // Check word count — retry if too short OR too long
    const storyBodyForCount = content.split(/^SCENE METADATA$/m)[0].trim();
    const wordCount = storyBodyForCount.split(/\s+/).filter(Boolean).length;
    const tooShort = wordCount < 260 && content.length > 200;
    const tooLong = wordCount > 360;

    if (tooShort || tooLong) {
      const reason = tooShort
        ? `too short (${wordCount} words, need 300–320)`
        : `too long (${wordCount} words, max 320)`;
      console.warn(`Story body ${reason}, retrying...`);
      const retryResp = await gemini.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          temperature: 0.5,
          systemInstruction: system,
        },
        contents: [
          {
            role: "user",
            parts: [{
              text: formattedPrompt +
                `\n\nCRITICAL: Your previous attempt produced ~${wordCount} words. The story body MUST be exactly 300–320 words — no more, no less. ` +
                "Each of the 5 scenes must be ~60–64 words. Short, punchy sentences. Stop at 320 words.",
            }],
          },
        ],
      });
      content = retryResp.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || content;
      const retryWordCount = content.split(/^SCENE METADATA$/m)[0].trim().split(/\s+/).filter(Boolean).length;
      console.log(`Retry word count: ${retryWordCount}`);
    } else {
      console.log(`Story word count: ${wordCount}`);
    }

    if (!content) {
      await ctx.runMutation(api.stories._markStatus, {
        storyId,
        status: "error",
        error: "Empty response from AI",
      });
      throw new Error("Empty response from AI");
    }
    if (!content.includes("SCENE METADATA") && !/Scene \d+:/i.test(content)) {
      console.warn("Scene metadata missing from AI output. Language:", content.slice(0, 100));
    }

    await ctx.runMutation(api.stories._setContent, {
      storyId,
      content,
    });

    await ctx.runMutation(api.stories._markStatus, {
      storyId,
      status: "text_ready",
    });

    // Deduct credits
    const creditCost = 80;
    await ctx.runMutation(api.credit._updateCredit, {
      creditId,
      usedCredits: creditCost,
    });

    console.log(content);

    // Fire off image + narration generation in parallel
    await ctx.scheduler.runAfter(
      0,
      internal.internal.generateSceneImage.generateImages,
      {
        storyId,
        child: {
          id: childInfo.id,
          name: childInfo.name,
          gender: childInfo.gender,
          age: childInfo.age,
          avatarStorageId: childInfo.avatarStorageId,
        },
      }
    );

    await ctx.scheduler.runAfter(
      0,
      internal.internal.generateNarration.generateNarration,
      {
        storyId,
        child: {
          name: childInfo.name,
          gender: childInfo.gender,
        },
      }
    );
  },
});

// ─── Public action: fast path — returns storyId immediately ─────────────────
// Frontend calls this, redirects instantly, generation runs in the background.

export const enqueueStory: ReturnType<typeof action> = action({
  args: {
    params: v.object({
      theme: v.string(),
      lesson: v.optional(v.string()),
      storyType: v.optional(v.string()),
      language: v.optional(v.string()),
      childId: v.optional(v.union(v.literal("1"), v.literal("2"))),
      // Legacy fields — accepted but ignored
      length: v.optional(v.string()),
      textOnly: v.optional(v.boolean()),
      useFavorites: v.optional(v.boolean()),
    }),
  },

  handler: async (ctx, { params }) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const profile = await ctx.runQuery(api.userProfiles.getProfile, {});
    if (!profile) throw new Error("Profile not found");

    const childId = params.childId || "1";
    const name =
      childId === "1"
        ? profile.childName || profile.childNickName?.trim()
        : profile.child2Name || profile.child2NickName?.trim();
    const age =
      childId === "1"
        ? profile.childAge ?? 0
        : profile.child2Age ?? 0;
    const gender =
      childId === "1"
        ? profile.childGender || "male"
        : profile.child2Gender || "male";

    const avatarStorageId =
      childId === "1"
        ? profile.childAvatarStorageId
        : profile.child2AvatarStorageId;

    // Validate credits early so we fail before creating the story
    const userId = String((user as any)._id);
    const userCredit = await ctx.runQuery(api.credit.list, {});
    if (!userCredit || userCredit.length === 0) {
      throw new Error("No credit record found");
    }
    if (userCredit[0].availableCredits < 60) {
      throw new Error("Not enough credits");
    }
    const creditId = userCredit[0]._id;

    // Fetch story type details for prompt
    const storyTypeRecord = params.storyType
      ? await ctx.runQuery((api as any)["migration/story_types"].getByCode, { code: params.storyType })
      : null;

    // Select structure element
    const flavor = await ctx.runMutation(api.storyElementSelector.selectStoryElements, {
      themeName: params.theme,
      storyType: params.storyType,
    });

    const structure = await ctx.runQuery(api.migration.structure.getByCode, {
      code: flavor.structureCode,
    });
    if (!structure) throw new Error("Structure not found");

    // Create story record — this is the fast part
    const storyParams = {
      theme: params.theme,
      lesson: params.lesson,
      storyType: params.storyType,
      language: params.language,
      childName: name || undefined,
    };

    const storyId = await ctx.runMutation(api.stories._create, {
      title: "",
      params: storyParams,
    });

    // Update streak here (needs auth context — can't do this inside internal action)
    await ctx.runMutation(api.userProfiles.updateStreak, {});

    // Schedule heavy generation in background — return immediately after this
    await ctx.scheduler.runAfter(0, internal.generateStory._generateContent, {
      storyId,
      theme: params.theme,
      lesson: params.lesson,
      language: params.language,
      storyTypeCode: params.storyType,
      storyTypeName: storyTypeRecord?.name,
      storyTypePromptHint: storyTypeRecord?.promptHint,
      creditId,
      childInfo: {
        id: childId,
        name: name || "",
        gender: gender as "male" | "female" | "other",
        age,
        avatarStorageId,
      },
    });

    return { storyId };
  },
});

// ─── Legacy alias — kept so any existing callers still work ─────────────────
export const generateStoryText = enqueueStory;
