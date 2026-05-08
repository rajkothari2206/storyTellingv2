import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { v, GenericId } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { generateChildAvatar } from "./sceneImageGenerator/index";

export const getProfile = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) return null;
		const userId = user._id as unknown as GenericId<"betterAuth:user">;
		if (!userId) return null;
		return await ctx.db
			.query("user_profiles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.first();
	},
});

export const createProfile = mutation({
	args: {
		parentName: v.string(),
		childName: v.string(),
		childAge: v.number(),
		childGender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
		childNickName: v.optional(v.string()),
		favoriteColor: v.optional(v.string()),
		favoriteAnimal: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error("Not authenticated");
		}
			const userId = user._id as unknown as GenericId<"betterAuth:user">;

		// Check if profile already exists
		const existingProfile = await ctx.db
			.query("user_profiles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.first();

		if (existingProfile) {
			throw new Error("Profile already exists");
		}

		const now = Date.now();
		await ctx.runMutation(api.auth.setCurrentUserRole, { role: "user" });
		await ctx.runMutation(api.credit._createCredit, {});
		return await ctx.db.insert("user_profiles", {
			userId,
			...args,
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const updateProfile = mutation({
	args: {
		parentName: v.string(),
		childName: v.string(),
		childAge: v.number(),
		childGender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
		childNickName: v.optional(v.string()),
		favoriteColor: v.optional(v.string()),
		favoriteAnimal: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error("Not authenticated");
		}

		const userId = user._id as unknown as GenericId<"betterAuth:user">;

		const profile = await ctx.db
			.query("user_profiles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.first();

		if (!profile) {
			throw new Error("Profile not found");
		}

		return await ctx.db.patch(profile._id, {
			...args,
			updatedAt: Date.now(),
		});
	},
});

export const updateChild2 = mutation({
	args: {
		child2Name: v.optional(v.string()),
		child2Age: v.optional(v.number()),
		child2Gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"))),
		child2NickName: v.optional(v.string()),
		child2FavoriteColor: v.optional(v.string()),
		child2FavoriteAnimal: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error("Not authenticated");
		}

		const userId = user._id as unknown as GenericId<"betterAuth:user">;

		const profile = await ctx.db
			.query("user_profiles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.first();

		if (!profile) {
			throw new Error("Profile not found");
		}

		// If child2Name is empty or undefined, clear all child2 fields
		const updateData: any = {
			updatedAt: Date.now(),
		};

		if (!args.child2Name) {
			// Clear child2 data
			updateData.child2Name = undefined;
			updateData.child2Age = undefined;
			updateData.child2Gender = undefined;
			updateData.child2NickName = undefined;
			updateData.child2FavoriteColor = undefined;
			updateData.child2FavoriteAnimal = undefined;
		} else {
			// Update with provided values
			if (args.child2Name !== undefined) updateData.child2Name = args.child2Name;
			if (args.child2Age !== undefined) updateData.child2Age = args.child2Age;
			if (args.child2Gender !== undefined) updateData.child2Gender = args.child2Gender;
			if (args.child2NickName !== undefined) updateData.child2NickName = args.child2NickName;
			if (args.child2FavoriteColor !== undefined) updateData.child2FavoriteColor = args.child2FavoriteColor;
			if (args.child2FavoriteAnimal !== undefined) updateData.child2FavoriteAnimal = args.child2FavoriteAnimal;
		}

		return await ctx.db.patch(profile._id, updateData);
	},
});

export const hasProfile = query({
	args: {},
	handler: async (ctx) => {
		try {
			const user = await authComponent.getAuthUser(ctx);
			if (!user) return false;

			const userId = user._id as unknown as GenericId<"betterAuth:user">;

			const profile = await ctx.db
				.query("user_profiles")
				.withIndex("by_user", (q) => q.eq("userId", userId))
				.first();

			return !!profile;
		} catch (error) {
			// If unauthenticated, return false instead of throwing
			return false;
		}
	},
});

export const generateAndStoreAvatar: ReturnType<typeof action> = action({
  args: {
    childId: v.optional(v.union(v.literal("1"), v.literal("2"))),
  },
  handler: async (ctx, { childId = "1" }) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get profile
    const profile = await ctx.runQuery(api.userProfiles.getProfile, {});
    if (!profile) {
      throw new Error("Profile not found");
    }
	console.log('profile', profile);

    // Get child info based on childId
    const childInfo = childId === "1" ? {
      name: profile.childName || profile.childNickName || "Child",
      gender: profile.childGender,
      age: profile.childAge,
    } : {
      name: profile.child2Name || profile.child2NickName || "Child",
      gender: profile.child2Gender || "male",
      age: profile.child2Age || 0,
    };

    // Get profile picture based on childId
    const profilePicture = childId === "1" 
      ? profile.childProfilePicture 
      : profile.child2ProfilePicture;

    const result = await generateChildAvatar(
      ctx,
      childInfo,
      // Use the uploaded child profile picture as a reference if available
      profilePicture
    );
    
    if (result.error || !result.avatarStorageId) {
      throw new Error(result.error || "Avatar generation failed");
    }

    // Store avatar ID in profile
    await ctx.runMutation(api.userProfiles._updateAvatarStorageId, {
      avatarStorageId: result.avatarStorageId,
      childId,
    });

    return { avatarStorageId: result.avatarStorageId, generated: true };
  },
});

// Internal mutation to update avatar storage ID
export const _updateAvatarStorageId = mutation({
  args: {
    avatarStorageId: v.string(),
    childId: v.optional(v.union(v.literal("1"), v.literal("2"))),
  },
  handler: async (ctx, { avatarStorageId, childId = "1" }) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const userId = user._id as unknown as GenericId<"betterAuth:user">;

    const profile = await ctx.db
      .query("user_profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (childId === "1") {
      updateData.childAvatarStorageId = avatarStorageId;
    } else {
      updateData.child2AvatarStorageId = avatarStorageId;
    }

    return await ctx.db.patch(profile._id, updateData);
  },
});

export const generateProfilePictureUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error("Not authenticated");
		}
		return await ctx.storage.generateUploadUrl();
	},
});

export const setProfilePicture = mutation({
	args: {
		storageId: v.string(),
		childId: v.optional(v.union(v.literal("1"), v.literal("2"))),
	},
	handler: async (ctx, { storageId, childId = "1" }) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error("Not authenticated");
		}

		const userId = user._id as unknown as GenericId<"betterAuth:user">;
		const profile = await ctx.db
			.query("user_profiles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.first();
		if (!profile) {
			throw new Error("Profile not found");
		}

		const updateData: any = {
			updatedAt: Date.now(),
		};

		if (childId === "1") {
			updateData.childProfilePicture = storageId;
		} else {
			updateData.child2ProfilePicture = storageId;
		}

		return await ctx.db.patch(profile._id, updateData);
	},
});

export const getProfilePhotoUrl = query({
	args: {
		childId: v.optional(v.union(v.literal("1"), v.literal("2"))),
	},
	handler: async (ctx, { childId = "1" }) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			return null;
		}

		const userId = user._id as unknown as GenericId<"betterAuth:user">;
		const profile = await ctx.db
			.query("user_profiles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.first();

		if (!profile) {
			return null;
		}

		const storageId = childId === "1" ? profile.childProfilePicture : profile.child2ProfilePicture;
		if (!storageId) {
			return null;
		}

		return await ctx.storage.getUrl(storageId);
	},
});

// Update streak when a story is created
export const updateStreak = mutation({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) throw new Error("Not authenticated");
		
		const userId = user._id as unknown as GenericId<"betterAuth:user">;
		const profile = await ctx.db
			.query("user_profiles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.first();

		if (!profile) throw new Error("Profile not found");

		const now = Date.now();
		const oneDayMs = 24 * 60 * 60 * 1000;
		
		const currentStreak = profile.currentStreak || 0;
		const longestStreak = profile.longestStreak || 0;
		const lastStoryDate = profile.lastStoryDate;

		let newStreak = 1;

		if (lastStoryDate) {
			const daysSinceLastStory = Math.floor((now - lastStoryDate) / oneDayMs);
			
			// If story was created today (same day), keep streak
			if (daysSinceLastStory === 0) {
				newStreak = currentStreak;
			}
			// If story was created yesterday, increment streak
			else if (daysSinceLastStory === 1) {
				newStreak = currentStreak + 1;
			}
			// If more than 1 day passed, reset streak to 1
			else {
				newStreak = 1;
			}
		}

		const newLongestStreak = Math.max(newStreak, longestStreak);

		await ctx.db.patch(profile._id, {
			currentStreak: newStreak,
			longestStreak: newLongestStreak,
			lastStoryDate: now,
			updatedAt: now,
		});

		return { currentStreak: newStreak, longestStreak: newLongestStreak };
	},
});

// Get user achievements based on story count and streak
export const getAchievements = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) return null;
		
		const userId = user._id as unknown as GenericId<"betterAuth:user">;
		const profile = await ctx.db
			.query("user_profiles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.first();

		if (!profile) return null;

		// Get total story count
		const stories = await ctx.db
			.query("stories")
			.withIndex("by_user", (q) => q.eq("userId", userId as string))
			.collect();

		const storyCount = stories.length;
		const currentStreak = profile.currentStreak || 0;
		const longestStreak = profile.longestStreak || 0;

		const achievements = [
			{
				icon: "star",
				name: "First Story",
				earned: storyCount >= 1,
			},
			{
				icon: "flame",
				name: "7 Days in a Row",
				earned: longestStreak >= 7,
			},
			{
				icon: "trophy",
				name: "10 Stories",
				earned: storyCount >= 10,
			},
		];

		return {
			currentStreak,
			longestStreak,
			achievements,
		};
	},
});
