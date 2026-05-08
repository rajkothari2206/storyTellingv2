import { action } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";
import OpenAI from "openai";
import { api,internal } from "./_generated/api";
import { formatStoryPrompt } from "./storyPromptFormatter";

export const generateStoryText: ReturnType<typeof action> = action({
  args: {
    params: v.object({
      theme: v.string(),
      lesson: v.optional(v.string()),
      length: v.union(v.literal("short"), v.literal("medium"), v.literal("long")),
      language: v.optional(v.string()),
      useFavorites: v.optional(v.boolean()),
      childId: v.optional(v.union(v.literal("1"), v.literal("2"))),
      textOnly: v.optional(v.boolean()),
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

    const { childId: _drop, ...cleanParams } = params;
    const avatarStorageId =
      childId === "1"
        ? profile.childAvatarStorageId
        : profile.child2AvatarStorageId;

    const paramsWithChildName = {
      ...cleanParams,
      childName: name || undefined,
    };

    const flavor = await ctx.runMutation(api.storyElementSelector.selectStoryElements, {
      themeName: params.theme,
    });

    const structure = await ctx.runQuery(api.migration.structure.getByCode, {
      code: flavor.structureCode,
    });
    if (!structure) throw new Error("Structure not found");

    const storyId = await ctx.runMutation(api.stories._create, {
      title: "",
      params: paramsWithChildName,
    });

    await ctx.runMutation(api.stories._markStatus, {
      storyId,
      status: "generating",
    });

    const client = new OpenAI({ apiKey: process.env.OPEN_AI_API! });

    const formattedPrompt = formatStoryPrompt(
      flavor,
      { code: structure.code, name: structure.name, pattern: structure.pattern },
      { name: name || "", gender, age },
      {
        theme: params.theme,
        lesson: params.lesson || undefined,
        language: params.language,
        length: params.length,
      }
    );

    const system = process.env.SYSTEM_PROMPT;
    if (!system) {
      throw new Error("SYSTEM_PROMPT environment variable is not set");
    }
    const userPrompt = formattedPrompt;
    const resp = await client.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
    });

    const content = resp.choices?.[0]?.message?.content?.toString().trim() || "";
    if (!content.includes("SCENE METADATA") && !/Scene \d+:/i.test(content) && !params.textOnly) {
      await ctx.runMutation(api.stories._markStatus, {
        storyId,
        status: "error",
        error: "Missing scene metadata",
      });
      throw new Error("Missing scene metadata");
    }

    await ctx.runMutation(api.stories._setContent, {
      storyId,
      content,
    });

    // streak update happens here (small)
    await ctx.runMutation(api.userProfiles.updateStreak, {});

    await ctx.runMutation(api.stories._markStatus, {
      storyId,
      status: "text_ready",
    });

    const childNameForBackground = name || "Child";
    const creditCost = params.textOnly ? 20 : params.length === "short" ? 60 : params.length === "medium" ? 80 : 0;
    const userCredit = await ctx.runQuery(api.credit.list, {});
    if (!userCredit || userCredit.length === 0) {
      throw new Error("User doesn't have enough credits");
    }
    await ctx.runMutation(api.credit._updateCredit, {
      creditId: userCredit[0]._id,
      usedCredits: creditCost,
    });
    console.log(content);
    if (params.textOnly) { return { storyId, content }; }
    
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
