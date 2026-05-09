import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	user_roles: defineTable({
		userId: v.string(),
		role: v.union(v.literal("user"), v.literal("admin")),
		email: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_user", ["userId"]),

	user_profiles: defineTable({
		userId: v.string(),
		parentName: v.string(),
		childName: v.string(),
		childNickName: v.optional(v.string()),
		childAge: v.number(),
		childGender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
		favoriteColor: v.optional(v.string()),
		favoriteAnimal: v.optional(v.string()),
		childAvatarStorageId: v.optional(v.string()), 
		childProfilePicture: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
		child2Name: v.optional(v.string()),
		child2Age: v.optional(v.number()),
		child2Gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"))),
		child2NickName: v.optional(v.string()),
		child2FavoriteColor: v.optional(v.string()),
		child2FavoriteAnimal: v.optional(v.string()),
		child2AvatarStorageId: v.optional(v.string()),
		child2ProfilePicture: v.optional(v.string()),
		// Streak tracking
		currentStreak: v.optional(v.number()),
		longestStreak: v.optional(v.number()),
		lastStoryDate: v.optional(v.number()), // Timestamp of last story creation (for streak calculation)
	}).index("by_user", ["userId"]),

	stories: defineTable({
		userId: v.string(),
		profileId: v.id("user_profiles"),
		title: v.string(),
		narrationFilePath: v.optional(v.string()),
		audioDurationSeconds: v.optional(v.number()),
		params: v.object({
			theme: v.string(),
			lesson: v.optional(v.string()),
			length: v.optional(v.union(v.literal("short"), v.literal("medium"), v.literal("long"))),
			storyType: v.optional(v.string()), // "adventure" | "silly" | "cozy"
			language: v.optional(v.string()),
			useFavorites: v.optional(v.boolean()),
			childName: v.optional(v.string()),
			textOnly: v.optional(v.boolean()),
		}),
		sceneMetadata: v.optional(v.array(v.object({
			sceneNumber: v.number(),
			description: v.string(),
			filePath: v.string(),
		}))),
		status: v.union(
			v.literal("queued"),
			v.literal("generating"),
			v.literal("ready"),
			v.literal("error"),
			v.literal("text_ready"),
			v.literal("images_ready"),
			v.literal("voice_ready")
		),
		error: v.optional(v.string()),
		content: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
	.index("by_user", ["userId"])
	.index("by_profile", ["profileId"])
	.index("by_status", ["status"]),
	structures: defineTable({
		// e.g., "Adventure Quest"
		code: v.string(),
		name: v.string(),
		// Ordered steps, e.g., ["Problem", "Journey", "Challenges", "Resolution"]
		pattern: v.array(v.string()),
		// Optional, e.g., "Action stories"
		useFor: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_name", ["name"]),

	personality_traits: defineTable({
		// Canonical identifier like "CD_01"
		code: v.string(),
		// Descriptions for each role in the dynamic
		fafaRole: v.string(),
		childRole: v.string(),
		lalliRole: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_code", ["code"]),

	themes:defineTable({
		name: v.string(),
		createdAt: v.number(),
	}).index("by_name", ["name"]),
	
	lessons:defineTable({
		name: v.string(),
		createdAt: v.number(),
	}).index("by_name", ["name"]),
	// Openings
flavor_openings: defineTable({
	code: v.string(),            // e.g., "OP_01"
	description: v.string(),
	createdAt: v.number(),
  }).index("by_code", ["code"]),
  
  // Magical Triggers
  flavor_magical_triggers: defineTable({
	code: v.string(),            // e.g., "MT_01"
	description: v.string(),
	keywords: v.array(v.string()),
	createdAt: v.number(),
  }).index("by_code", ["code"]),
  
  // Obstacles
  flavor_obstacles: defineTable({
	code: v.string(),            // e.g., "OB_01"
	description: v.string(),
	exampleContext: v.array(v.string()),
	solutions: v.array(v.string()),
	createdAt: v.number(),
  }).index("by_code", ["code"]),
  
  // Payoffs
  flavor_payoffs: defineTable({
	code: v.string(),            // e.g., "PY_01"
	description: v.string(),
	createdAt: v.number(),
  }).index("by_code", ["code"]),
  
  // Endings
  flavor_endings: defineTable({
	code: v.string(),            // e.g., "EN_01"
	description: v.string(),
	createdAt: v.number(),
  }).index("by_code", ["code"]),
  
  // Compatibility map per theme x category
  theme_flavor_compatibility: defineTable({
	themeId: v.id("themes"),
	category: v.union(
	  v.literal("OP"), v.literal("MT"), v.literal("OB"),
	  v.literal("PY"), v.literal("EN")
	),
	allowedCodes: v.array(v.string()), // e.g., ["OP_01","OP_04","OP_08"]
	createdAt: v.number(),
  }).index("by_theme_category", ["themeId", "category"]),

  // Per-user story element usage tracking (simplified — flavor codes removed)
  user_story_element_usage: defineTable({
	userId: v.string(),
	lastStructureCode: v.optional(v.string()), // Last used structure code
	storyCount: v.number(), // Number of stories generated
	// Legacy flavor codes — kept optional for backward compat, no longer written
	usedCodes: v.optional(v.object({
		OP: v.array(v.string()),
		MT: v.array(v.string()),
		OB: v.array(v.string()),
		PY: v.array(v.string()),
		EN: v.array(v.string()),
		PT: v.array(v.string()),
	})),
	createdAt: v.number(),
	updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Blogs
  blogs: defineTable({
	title: v.string(),
	slug: v.string(),
	content: v.any(), // Editor.js output format (JSON)
	excerpt: v.optional(v.string()),
	status: v.union(v.literal("draft"), v.literal("published")),
	publishedAt: v.optional(v.number()),
	createdAt: v.number(),
	updatedAt: v.number(),
  })
	.index("by_slug", ["slug"])
	.index("by_status", ["status"]),
	//credit 
	user_credits: defineTable({
		userId: v.string(),
		totalCredits: v.number(),
		usedCredits: v.number(),
		availableCredits: v.number(),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_user", ["userId"]),
	razorpay_plans: defineTable({
		name: v.string(),
		price: v.number(),
		interval: v.union(v.literal("monthly"), v.literal("yearly")),
		planId: v.string(),
		createdAt: v.number(),
	}).index("by_name", ["name"]),
	user_subscriptions: defineTable({
		userId: v.string(),
		subscriptionId: v.string(),
		planId: v.string(),
		price: v.number(),
		interval: v.union(v.literal("monthly"), v.literal("yearly")),
		status: v.union(v.literal("active"), v.literal("inactive")),
		createdAt: v.number(),
	}).index("by_user", ["userId"]),
	subscription_transactions: defineTable({
		userId: v.string(),
		subscriptionId: v.string(),
		planId: v.string(),
		price: v.number(),
		interval: v.union(v.literal("monthly"), v.literal("yearly")),
		status: v.union(v.literal("active"), v.literal("inactive")),
		expiresAt: v.number(),
		renewedAt: v.optional(v.number()),
		createdAt: v.number(),
	}).index("by_user", ["userId"]),
	voice_models: defineTable({
		name: v.string(),
		voiceId: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_name", ["name"]),

	// Story types (Big Adventure / Silly & Funny / Cozy Bedtime)
	story_types: defineTable({
		code: v.string(),          // "adventure" | "silly" | "cozy"
		name: v.string(),          // "Big Adventure" | "Silly & Funny" | "Cozy Bedtime"
		emoji: v.string(),         // "🗺️" | "🌀" | "🌙"
		description: v.string(),   // Short UI description
		promptHint: v.string(),    // Hint passed to AI
		isActive: v.boolean(),
		sortOrder: v.number(),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_code", ["code"]),

	// Languages supported for story generation
	languages: defineTable({
		code: v.string(),          // "en" | "hi" | "bn" | "gu" | "ta" | "mr" | "te"
		name: v.string(),          // "English" | "Hindi" etc.
		nativeName: v.string(),    // "English" | "हिंदी" etc.
		flag: v.string(),          // emoji flag
		voiceGroup: v.string(),    // "english" | "hindi" — which TTS voices to use
		isActive: v.boolean(),
		sortOrder: v.number(),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_code", ["code"]),

	// Global system configuration (key-value store)
	system_config: defineTable({
		key: v.string(),           // "system_prompt" | other future keys
		value: v.string(),
		updatedAt: v.number(),
	}).index("by_key", ["key"]),
});



