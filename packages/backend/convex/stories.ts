import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";
import { internal } from "./_generated/api";

export const list = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) return [];
		const userId = String(user._id);
		const docs = await ctx.db
			.query("stories")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.order("desc")
			.collect();
		const filtered = docs.filter((doc) => doc.status != "error");

		// Resolve the first scene image URL for each story so the library
		// can show the actual generated cover image instead of a theme placeholder.
		return await Promise.all(
			filtered.map(async (doc) => {
				const firstScene = doc.sceneMetadata
					?.slice()
					.sort((a, b) => a.sceneNumber - b.sceneNumber)[0];
				const coverImageUrl = firstScene?.filePath
					? await ctx.storage.getUrl(firstScene.filePath as any)
					: null;
				return { ...doc, coverImageUrl };
			})
		);
	},
});

export const listAll = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) throw new Error("Not authenticated");

		const userIdentifier = (user as any).userId || (user as any)._id;
		const userRole = await ctx.db
			.query("user_roles")
			.withIndex("by_user", (q) => q.eq("userId", userIdentifier))
			.first();

		if (userRole?.role !== "admin") {
			throw new Error("Admin access required");
		}

		// Return ALL stories (including errors) so admin can see failed generations
		const docs = await ctx.db
			.query("stories")
			.order("desc")
			.collect();

		// Attach each story's Story Challenge status — previously invisible to
		// admin entirely; auditing it required a direct Convex CLI query.
		const withChallenge = await Promise.all(
			docs.map(async (s) => {
				const challenge = await ctx.db
					.query("testserver_challenges")
					.withIndex("by_story", (q) => q.eq("storyId", s._id))
					.first();
				return {
					...s,
					challenge: challenge
						? {
								status: challenge.status,
								score: challenge.score ?? null,
								completedAt: challenge.completedAt ?? null,
								createdAt: challenge.createdAt,
							}
						: null,
				};
			})
		);
		return withChallenge;
	},
});

export const get = query({
	args: { storyId: v.id("stories") },
	handler: async (ctx, { storyId }) => {
		return await ctx.db.get(storyId);
	},
});

export const getSceneImageUrls = query({
    args: { storyId: v.id("stories") },
    handler: async (ctx, { storyId }) => {
        const story = await ctx.db.get(storyId);
        if (!story?.sceneMetadata || story.sceneMetadata.length === 0) return [];

        const sorted = [...story.sceneMetadata].sort((a, b) => a.sceneNumber - b.sceneNumber);
        const scenes = await Promise.all(
            sorted.map(async (scene) => {
                const url = scene.filePath
                    ? await ctx.storage.getUrl(scene.filePath as any)
                    : undefined;
                return {
                    sceneNumber: scene.sceneNumber,
                    description: scene.description,
                    filePath: scene.filePath,
                    url,
                };
            })
        );

        return scenes;
    },
});

export const getFirstSceneImageUrl = query({
    args: { storyId: v.id("stories") },
    handler: async (ctx, { storyId }) => {
        const story = await ctx.db.get(storyId);
        if (!story?.sceneMetadata || story.sceneMetadata.length === 0) return null;

        const sorted = [...story.sceneMetadata].sort((a, b) => a.sceneNumber - b.sceneNumber);
        const firstScene = sorted[0];
        if (!firstScene?.filePath) return null;

        return await ctx.storage.getUrl(firstScene.filePath as any);
    },
});

export const _create = mutation({
	args: {
		title: v.string(),
		params: v.object({
			theme: v.string(),
			lesson: v.optional(v.string()),
			length: v.optional(v.union(v.literal("short"), v.literal("medium"), v.literal("long"))),
			storyType: v.optional(v.string()),
			language: v.optional(v.string()),
			useFavorites: v.optional(v.boolean()),
			childName: v.optional(v.string()),
			textOnly: v.optional(v.boolean()),
		}),
	},
	handler: async (ctx, { title, params }) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) throw new Error("Not authenticated");
		const userId = String(user._id);

		const profile = await ctx.db
			.query("user_profiles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.first();
		if (!profile) throw new Error("Profile not found");

		const now = Date.now();
		const storyId = await ctx.db.insert("stories", {
			userId,
			profileId: profile._id,
			title,
			params,
			status: "queued",
			createdAt: now,
			updatedAt: now,
		});
		return storyId;
	},
});

export const _markStatus = mutation({
	args: {
		storyId: v.id("stories"),
		status: v.union(v.literal("generating"), v.literal("ready"), v.literal("error"), v.literal("text_ready"), v.literal("images_ready"), v.literal("voice_ready")),
		error: v.optional(v.string()),
	},
	handler: async (ctx, { storyId, status, error }) => {
		const story = await ctx.db.get(storyId);
		if (!story) throw new Error("Story not found");
		return await ctx.db.patch(storyId, {
			status,
			error,
			updatedAt: Date.now(),
		});
	},
});

export const _setChallengeCost = mutation({
	args: {
		storyId: v.id("stories"),
		challengeTextInputTokens: v.number(),
		challengeTextOutputTokens: v.number(),
	},
	handler: async (ctx, { storyId, challengeTextInputTokens, challengeTextOutputTokens }) => {
		const story = await ctx.db.get(storyId);
		if (!story) throw new Error("Story not found");
		return await ctx.db.patch(storyId, { challengeTextInputTokens, challengeTextOutputTokens });
	},
});

// Real visibility for Challenge generation exhausting every retry — previously
// this only ever surfaced as an uncaught error inside a fire-and-forget
// scheduled job, invisible anywhere in the product.
export const _flagChallengeGenerationFailed = internalMutation({
	args: { storyId: v.id("stories"), reason: v.string() },
	handler: async (ctx, { storyId, reason }) => {
		const story = await ctx.db.get(storyId);
		if (!story) return;
		await ctx.db.patch(storyId, {
			challengeGenerationError: `${new Date().toISOString()}: ${reason}`,
		});
	},
});

// Called once a later attempt (the client's on-demand fallback) succeeds, so
// a resolved failure doesn't linger as a stale flag.
export const _clearChallengeGenerationFailed = internalMutation({
	args: { storyId: v.id("stories") },
	handler: async (ctx, { storyId }) => {
		const story = await ctx.db.get(storyId);
		if (!story?.challengeGenerationError) return;
		await ctx.db.patch(storyId, { challengeGenerationError: undefined });
	},
});

export const _setContent = mutation({
	args: { storyId: v.id("stories"), content: v.string() },
	handler: async (ctx, { storyId, content }) => {
		const story = await ctx.db.get(storyId);
		if (!story) throw new Error("Story not found");
		
		// Split content into lines
		const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
		
		// First line is the title
		const title = lines.length > 0 ? lines[0] : story.title || "Untitled Story";
		
		// Find SCENE METADATA separator OR look for Scene 1: pattern
		const metadataStartIndex = lines.findIndex(line => 
			line.toUpperCase() === 'SCENE METADATA' || 
			/^Scene \d+:/i.test(line)
		);
		
		let contentBody: string;
		let sceneMetadata: any[] | undefined;
		
		if (metadataStartIndex !== -1) {
			// Check if we found "SCENE METADATA" header or went straight to Scene 1:
			const isMetadataHeader = lines[metadataStartIndex].toUpperCase() === 'SCENE METADATA';
			
			// Content is everything between title and metadata
			contentBody = lines.slice(1, metadataStartIndex).join('\n').trim();
			
			// Parse scene metadata - skip the header line if present
			const metadataLines = isMetadataHeader 
				? lines.slice(metadataStartIndex + 1)
				: lines.slice(metadataStartIndex);
				
			sceneMetadata = metadataLines
				.map(line => {
					// Parse: "Scene 1: [setting], [main action], [mood keywords], [visual details]"
					const match = line.match(/Scene (\d+):\s*(.+)/);
					if (!match) return null;
					
					const sceneNumber = parseInt(match[1]);
					const rest = match[2];
					
					// Try to extract structured data
					return {
						sceneNumber,
						description: rest || '',
						filePath: '',
					};
				})
				.filter(item => item !== null);
		} else {
			// No metadata separator, everything after title is content
			contentBody = lines.length > 1 ? lines.slice(1).join('\n') : content;
		}
		
		return await ctx.db.patch(storyId, {
			title,
			content: contentBody,
			sceneMetadata,
			status: "ready",
			updatedAt: Date.now(),
		});
	},
});

export const _setVoiceMetadata = mutation({
	args: {
		storyId: v.id("stories"),
		voiceEmotionMetadata: v.optional(v.object({
			scenes: v.array(v.object({
				sceneNumber: v.number(),
				emotion: v.union(
					v.literal("happy"), v.literal("excited"), v.literal("curious"),
					v.literal("warm"), v.literal("playful"), v.literal("thoughtful"),
					v.literal("gentle"), v.literal("naughty"), v.literal("surprised"),
					v.literal("proud"), v.literal("calm"), v.literal("reassuring")
				),
				intensity: v.union(v.literal("subtle"), v.literal("medium")),
			})),
			lineOverrides: v.array(v.object({
				type: v.union(v.literal("fafa_gag"), v.literal("emotional_exchange")),
				emotion: v.union(
					v.literal("happy"), v.literal("excited"), v.literal("curious"),
					v.literal("warm"), v.literal("playful"), v.literal("thoughtful"),
					v.literal("gentle"), v.literal("naughty"), v.literal("surprised"),
					v.literal("proud"), v.literal("calm"), v.literal("reassuring")
				),
				intensity: v.union(v.literal("subtle"), v.literal("medium")),
			})),
		})),
		stingPlacements: v.optional(v.array(v.object({
			stingId: v.string(),
			stingName: v.string(),
			emotion: v.string(),
			intensity: v.union(v.literal("subtle"), v.literal("medium")),
			durationSeconds: v.number(),
			targetScene: v.number(),
			placementHint: v.string(),
			volumeDb: v.number(),
		}))),
	},
	handler: async (ctx, { storyId, voiceEmotionMetadata, stingPlacements }) => {
		const patch: Record<string, unknown> = {};
		if (voiceEmotionMetadata !== undefined) patch.voiceEmotionMetadata = voiceEmotionMetadata;
		if (stingPlacements       !== undefined) patch.stingPlacements       = stingPlacements;
		if (Object.keys(patch).length > 0) await ctx.db.patch(storyId, patch);
	},
});

export const _updateSceneFilePath = mutation({
	args: { 
		storyId: v.id("stories"),
		sceneNumber: v.number(),
		filePath: v.string(),
	},
	handler: async (ctx, { storyId, sceneNumber, filePath }) => {
		const story = await ctx.db.get(storyId);
		if (!story) throw new Error("Story not found");
		
		if (!story.sceneMetadata) return;
		
		const updatedSceneMetadata = story.sceneMetadata.map(scene => 
			scene.sceneNumber === sceneNumber 
				? { ...scene, filePath }
				: scene
		);
		
		return await ctx.db.patch(storyId, {
			sceneMetadata: updatedSceneMetadata,
			updatedAt: Date.now(),
		});
	},
});
export const _setNarrationFilePath = mutation({
	args: { storyId: v.id("stories"), filePath: v.string() },
	handler: async (ctx, { storyId, filePath }) => {
		const story = await ctx.db.get(storyId);
		if (!story) throw new Error("Story not found");
		return await ctx.db.patch(storyId, {
			narrationFilePath: filePath,
			updatedAt: Date.now(),
		});
	},
});

export const _setSceneStartSeconds = mutation({
	args: {
		storyId: v.id("stories"),
		sceneStartSeconds: v.record(v.string(), v.number()),
	},
	handler: async (ctx, { storyId, sceneStartSeconds }) => {
		const story = await ctx.db.get(storyId);
		if (!story) throw new Error("Story not found");
		await ctx.db.patch(storyId, { sceneStartSeconds, updatedAt: Date.now() });
	},
});

// Called once from the reader when the merged narration audio's native
// `ended` event fires — real evidence the story played to completion, as
// opposed to an untaken Challenge (which looks identical whether the child
// finished the story and skipped the Challenge, or never got that far).
// Idempotent: only the first call for a story sets the timestamp.
export const _markReaderCompleted = mutation({
	args: { storyId: v.id("stories") },
	handler: async (ctx, { storyId }) => {
		const story = await ctx.db.get(storyId);
		if (!story || story.readerCompletedAt) return;
		await ctx.db.patch(storyId, { readerCompletedAt: Date.now() });
	},
});

export const _setNarrationDuration = mutation({
	args: { storyId: v.id("stories"), durationSeconds: v.number() },
	handler: async (ctx, { storyId, durationSeconds }) => {
		const story = await ctx.db.get(storyId);
		if (!story) throw new Error("Story not found");
		return await ctx.db.patch(storyId, {
			audioDurationSeconds: durationSeconds,
			updatedAt: Date.now(),
		});
	},
});

// Cost tracking (Task C) — one mutation per generation phase, each owning
// its own field(s) so concurrent phases never clobber each other via
// ctx.db.patch's shallow merge. Each schedules the final-cost check after
// writing, in case it's the last phase to finish.
export const _setTextUsage = mutation({
	args: { storyId: v.id("stories"), textInputTokens: v.number(), textOutputTokens: v.number() },
	handler: async (ctx, { storyId, textInputTokens, textOutputTokens }) => {
		const story = await ctx.db.get(storyId);
		if (!story) throw new Error("Story not found");
		await ctx.db.patch(storyId, { textInputTokens, textOutputTokens });
		await ctx.scheduler.runAfter(0, internal.costTracking.maybeComputeFinalCost, { storyId });
	},
});

export const _setImageUsage = mutation({
	args: { storyId: v.id("stories"), imageGenerationCalls: v.number() },
	handler: async (ctx, { storyId, imageGenerationCalls }) => {
		const story = await ctx.db.get(storyId);
		if (!story) throw new Error("Story not found");
		await ctx.db.patch(storyId, { imageGenerationCalls });
		await ctx.scheduler.runAfter(0, internal.costTracking.maybeComputeFinalCost, { storyId });
	},
});

export const _setAudioUsage = mutation({
	args: { storyId: v.id("stories"), audioCharactersUsed: v.number() },
	handler: async (ctx, { storyId, audioCharactersUsed }) => {
		const story = await ctx.db.get(storyId);
		if (!story) throw new Error("Story not found");
		await ctx.db.patch(storyId, { audioCharactersUsed });
		await ctx.scheduler.runAfter(0, internal.costTracking.maybeComputeFinalCost, { storyId });
	},
});

export const getNarrationFileUrl = query({
	args: { storyId: v.id("stories") },
	handler: async (ctx, { storyId }) => {
		const story = await ctx.db.get(storyId);
		if (!story?.narrationFilePath) return null;
		const url = await ctx.storage.getUrl(story.narrationFilePath as any);
		return { url };
	},
});
export const getLightMetadata = query({
	args: { storyId: v.id("stories") },
	handler: async (ctx, { storyId }) => {
		const story = await ctx.db.get(storyId);
		if (!story) throw new Error("Story not found");
		return {
			title: story.title,
			sceneMetadata: story.sceneMetadata,
			params: story.params,
			sceneStartSeconds: story.sceneStartSeconds,
			audioDurationSeconds: story.audioDurationSeconds,
		};
	},
});
export const getContentOnly = query({
	args: { storyId: v.id("stories") },
	handler: async (ctx, { storyId }) => {
		const story = await ctx.db.get(storyId);
		if (!story) throw new Error("Story not found");
		return {
			content: story.content,
			title: story.title,
			params: story.params
		};
	},
});

// Admin-only: delete a story and all its associated storage files (images + audio).
// Called from the admin panel to free up Convex storage.
export const adminDeleteStory = mutation({
	args: { storyId: v.id("stories") },
	handler: async (ctx, { storyId }) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) throw new Error("Not authenticated");

		const userIdentifier = (user as any).userId || (user as any)._id;
		const userRole = await ctx.db
			.query("user_roles")
			.withIndex("by_user", (q) => q.eq("userId", userIdentifier))
			.first();
		if (userRole?.role !== "admin") throw new Error("Admin access required");

		const story = await ctx.db.get(storyId);
		if (!story) throw new Error("Story not found");

		// Delete all scene images from Convex storage
		if (story.sceneMetadata) {
			for (const scene of story.sceneMetadata) {
				if (scene.filePath) {
					try {
						await ctx.storage.delete(scene.filePath as any);
					} catch {
						// File may already be gone — continue
					}
				}
			}
		}

		// Delete narration audio from Convex storage
		if (story.narrationFilePath) {
			try {
				await ctx.storage.delete(story.narrationFilePath as any);
			} catch {
				// File may already be gone — continue
			}
		}

		// Delete child avatar storage if present (per-story scope guard)
		// Note: avatars are on user_profiles, not stories — skip here.

		// Delete the story document
		await ctx.db.delete(storyId);

		return { deleted: storyId };
	},
});