import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

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
		
		const docs = await ctx.db
			.query("stories")
			.order("desc")
			.collect();
		return docs.filter((doc) => doc.status != "error");
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
			length: v.union(v.literal("short"), v.literal("medium"), v.literal("long")),
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
			params: story.params
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