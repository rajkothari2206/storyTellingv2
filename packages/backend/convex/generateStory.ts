import { action } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";
import OpenAI from "openai";
import { api, internal } from "./_generated/api";
import { formatStoryPrompt } from "./storyPromptFormatter";

export const generateStoryText: ReturnType<typeof action> = action({
  args: {
    params: v.object({
      theme: v.string(),
      lesson: v.optional(v.string()),
      storyType: v.optional(v.string()),   // "adventure" | "silly" | "cozy"
      language: v.optional(v.string()),
      childId: v.optional(v.union(v.literal("1"), v.literal("2"))),
      // Legacy fields from old generate page — accepted but ignored
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

    // Fetch story type details from DB (for name + prompt hint)
    const storyTypeRecord = params.storyType
      ? await ctx.runQuery((api as any)["migration/story_types"].getByCode, { code: params.storyType })
      : null;

    // Select structure element (now simplified — just maps storyType → structureCode)
    const flavor = await ctx.runMutation(api.storyElementSelector.selectStoryElements, {
      themeName: params.theme,
      storyType: params.storyType,
    });

    const structure = await ctx.runQuery(api.migration.structure.getByCode, {
      code: flavor.structureCode,
    });
    if (!structure) throw new Error("Structure not found");

    // Create story record
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

    await ctx.runMutation(api.stories._markStatus, {
      storyId,
      status: "generating",
    });

    const client = new OpenAI({ apiKey: process.env.OPEN_AI_API! });

    const formattedPrompt = formatStoryPrompt(
      { name: name || "", gender, age },
      {
        theme: params.theme,
        lesson: params.lesson || undefined,
        language: params.language,
        storyType: params.storyType,
        storyTypeName: storyTypeRecord?.name,
        storyTypePromptHint: storyTypeRecord?.promptHint,
      }
    );

    // Get system prompt: try DB first, fall back to env var
    const systemConfig = await ctx.runQuery((api as any).systemConfig.get, {
      key: "system_prompt",
    });
    const system = systemConfig?.value || process.env.SYSTEM_PROMPT;
    if (!system) {
      throw new Error("SYSTEM_PROMPT not configured. Set it in Admin → System Prompt or add env var.");
    }

    const makeStoryRequest = async (temperature: number) =>
      client.chat.completions.create({
        model: "gpt-4.1",
        temperature,
        messages: [
          { role: "system", content: system },
          { role: "user", content: formattedPrompt },
        ],
      });

    let resp = await makeStoryRequest(0.4);
    let content = resp.choices?.[0]?.message?.content?.toString().trim() || "";

    // Detect structured error responses (e.g. "RULE_CONFLICT") from the model
    // and retry once at higher temperature with an explicit override instruction.
    const isNonStory = !content || content.length < 200 || /^[A-Z_]+$/.test(content);
    if (isNonStory) {
      console.warn("AI returned non-story response, retrying:", content.slice(0, 80));
      const retryResp = await client.chat.completions.create({
        model: "gpt-4.1",
        temperature: 0.7,
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content:
              formattedPrompt +
              "\n\nIMPORTANT: Generate the story now. " +
              "Keep all structural labels (SCENE METADATA, Scene 1:, Scene 2:, Lalli:, Fafa:) in English. " +
              "Only the story prose and dialogue text should be in the requested language.",
          },
        ],
      });
      content = retryResp.choices?.[0]?.message?.content?.toString().trim() || "";
    }

    if (!content) {
      await ctx.runMutation(api.stories._markStatus, {
        storyId,
        status: "error",
        error: "Empty response from AI",
      });
      throw new Error("Empty response from AI");
    }
    // Log warning if scene metadata is missing (non-fatal)
    if (!content.includes("SCENE METADATA") && !/Scene \d+:/i.test(content)) {
      console.warn("Scene metadata missing from AI output. Language:", content.slice(0, 100));
    }

    await ctx.runMutation(api.stories._setContent, {
      storyId,
      content,
    });

    // Update streak
    await ctx.runMutation(api.userProfiles.updateStreak, {});

    await ctx.runMutation(api.stories._markStatus, {
      storyId,
      status: "text_ready",
    });

    const childNameForBackground = name || "Child";
    const creditCost = 60; // Single flat cost
    const userCredit = await ctx.runQuery(api.credit.list, {});
    if (!userCredit || userCredit.length === 0) {
      throw new Error("User doesn't have enough credits");
    }
    await ctx.runMutation(api.credit._updateCredit, {
      creditId: userCredit[0]._id,
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
          id: childId,
          name: childNameForBackground,
          gender,
          age,
          avatarStorageId,
        },
      }
    );

    await ctx.scheduler.runAfter(
      0,
      internal.internal.generateNarration.generateNarration,
      {
        storyId,
        child: {
          name: childNameForBackground,
          gender,
        },
      }
    );

    return { storyId };
  },
});
