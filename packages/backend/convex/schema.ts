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
		city: v.optional(v.string()),
		country: v.optional(v.string()),
		childAvatarStorageId: v.optional(v.string()),
		childProfilePicture: v.optional(v.string()),
		// Cached "character style reference" image (Lalli + this child + Fafa,
		// neutral pose) used to anchor every scene's visual consistency.
		// Previously regenerated fresh on every single story (a real, avoidable
		// Gemini image cost) even though it only depends on the child's avatar,
		// not the story content. Invalidated (cleared) whenever the avatar
		// changes — see _updateAvatarStorageIdById / _updateAvatarStorageId.
		childStyleLockStorageId: v.optional(v.string()),
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
		child2StyleLockStorageId: v.optional(v.string()),
		// Phonetic pronunciation hints — stored as-is and substituted into TTS text only.
		// Never modifies the displayed story text; affects narration audio only.
		childPhoneticName: v.optional(v.string()),
		child2PhoneticName: v.optional(v.string()),
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

		// Phase 5: voice/emotion metadata (scene-level + hero-line overrides)
		voiceEmotionMetadata: v.optional(v.object({
			scenes: v.array(v.object({
				sceneNumber: v.number(),
				emotion:     v.string(),   // from closed vocabulary in Section N
				intensity:   v.union(v.literal("subtle"), v.literal("medium")),
			})),
			lineOverrides: v.array(v.object({
				type:      v.union(v.literal("fafa_gag"), v.literal("emotional_exchange")),
				emotion:   v.string(),
				intensity: v.union(v.literal("subtle"), v.literal("medium")),
			})),
		})),

		// Phase 5: sting placement decisions for this story
		stingPlacements: v.optional(v.array(v.object({
			stingId:         v.id("stings"),
			stingName:       v.string(),
			emotion:         v.string(),
			intensity:       v.union(v.literal("subtle"), v.literal("medium")),
			durationSeconds: v.number(),
			targetScene:     v.number(),
			placementHint:   v.string(),
			volumeDb:        v.number(),
		}))),

		// Phase 6: real per-scene start times (seconds) computed after narration.
		// Keys are scene numbers as strings ("1", "2", …). Replaces the 100 wpm
		// heuristic used during Phase 5 placement. Frontend uses these to trigger
		// stings at the right moment during audio playback.
		sceneStartSeconds: v.optional(v.record(v.string(), v.number())),

		// Cost tracking — each field is written by exactly one generation phase
		// (text / images / narration), never patched by more than one, since
		// ctx.db.patch only shallow-merges and a shared nested object would let
		// one phase's write clobber another's. estimatedCostUSD is computed once
		// all three are present, using system_config's cost_rates at that time.
		textInputTokens:     v.optional(v.number()),
		textOutputTokens:    v.optional(v.number()),
		imageGenerationCalls: v.optional(v.number()),
		audioCharactersUsed: v.optional(v.number()),
		// Written once by generateChallenge, if/when a Story Challenge is
		// generated for this story — not part of the original three-phase set,
		// since Challenge generation is a separate, later, on-demand call.
		challengeTextInputTokens:  v.optional(v.number()),
		challengeTextOutputTokens: v.optional(v.number()),
		estimatedCostUSD:    v.optional(v.number()),
		// Set when Challenge generation exhausts every retry (e.g. the model
		// keeps producing an invalid EQ answer set) — previously this failed
		// silently inside a fire-and-forget scheduled job with zero visibility
		// anywhere in the product. Cleared automatically if a later attempt
		// (the client's on-demand fallback) succeeds.
		challengeGenerationError: v.optional(v.string()),

		// Set once, the first time the reader's merged narration audio fires
		// its native `ended` event for this story — i.e. real evidence the
		// story was actually listened to end-to-end, not just generated.
		// Added because there was previously no way to tell "child abandoned
		// the story partway through" apart from "child finished it but never
		// started the Challenge" — both looked identical (an untaken
		// Challenge) with zero data to distinguish them.
		readerCompletedAt: v.optional(v.number()),

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

	// User story favourites
	story_favourites: defineTable({
		userId: v.string(),
		storyId: v.id("stories"),
	})
	.index("by_user", ["userId"])
	.index("by_user_story", ["userId", "storyId"]),

	// ─── TESTSERVER (admin-gated /testserver staging route, Functional Spec v1.1) ───
	// NOTE (Story Challenge promoted to production): testserver_challenges is
	// now the live production data store for Story Challenge — generateStoryV2.ts
	// reads it for the "growing in" pillar signal, and the production dashboard
	// Growth tab / end-of-story CTA read from it too, gated by the rollout
	// allowlist in testserver/_shared.ts (assertChallengeAccess), not just
	// convex/testserver/* and apps/web/src/app/testserver/* pages. It is NOT
	// safe to delete this table or those directories anymore. testserver_consent
	// and testserver_stars remain testserver-only scaffolding as before.
	testserver_consent: defineTable({
		userId: v.string(),
		parentName: v.string(),
		childName: v.string(),
		childAge: v.number(),
		consentTextVersion: v.string(),
		method: v.string(),
		createdAt: v.number(),
	}).index("by_user", ["userId"]),

	testserver_challenges: defineTable({
		userId: v.string(),
		storyId: v.id("stories"),
		childName: v.string(),
		childAge: v.number(),
		theme: v.string(),
		lesson: v.optional(v.string()),
		length: v.union(v.literal("short"), v.literal("medium"), v.literal("long")),
		quickCheck: v.optional(v.object({
			pillar: v.string(),
			question: v.string(),
			options: v.array(v.string()),
			answeredIndex: v.optional(v.number()),
		})),
		questions: v.array(v.object({
			pillar: v.union(
				v.literal("listening"),
				v.literal("attention"),
				v.literal("emotional"),
				v.literal("cognitive")
			),
			// Legacy MCQ-only fields (kept for backward compat with old rows)
			snippet: v.string(),
			question: v.optional(v.string()),
			options: v.optional(v.array(v.string())),
			correctIndex: v.optional(v.number()),
			expectedIndex: v.optional(v.number()),
			// v2.1 new fields — all optional for backward compat
			id: v.optional(v.string()),
			format: v.optional(v.union(
				v.literal("mcq"), v.literal("fill_blank"),
				v.literal("match_column"), v.literal("sequence")
			)),
			isQuickCheckEligible: v.optional(v.boolean()),
			storyGrounding: v.optional(v.string()),
			promptText: v.optional(v.string()),
			revealFraming: v.optional(v.string()),
			// MCQ new-style: {id,text} options + accepted-set correctOptionIds
			richOptions: v.optional(v.array(v.object({ id: v.string(), text: v.string() }))),
			correctOptionIds: v.optional(v.array(v.string())),
			// fill_blank
			sentenceWithBlank: v.optional(v.string()),
			wordBank: v.optional(v.array(v.string())),
			correctWord: v.optional(v.string()),
			// match_column
			leftItems: v.optional(v.array(v.object({ id: v.string(), text: v.string() }))),
			rightItems: v.optional(v.array(v.object({ id: v.string(), text: v.string() }))),
			correctPairs: v.optional(v.array(v.array(v.string()))),
			// sequence
			sequenceItems: v.optional(v.array(v.object({ id: v.string(), text: v.string() }))),
			correctOrder: v.optional(v.array(v.string())),
		})),
		// v1.3 (16 Aug 2026): 3 of the 10 `questions` are designated in-story
		// quick checks (one cognitive/attention/listening each); the other 7
		// always appear in the Story Challenge. If a quick check goes
		// unanswered during playback, its index rolls into the Challenge too
		// instead of being lost — see functional spec §13.5.
		quickCheckIndices: v.optional(v.array(v.number())),
		// Every answer given so far, whether from a live in-story quick check
		// or from the Story Challenge screen — keyed by index into `questions`.
		// answeredIndex is legacy MCQ (option position); answeredData is new-format
		// JSON (selectedId / selectedWord / pairs / order).
		answeredIndices: v.optional(v.array(v.object({
			index: v.number(),
			answeredIndex: v.optional(v.number()),
			answeredData: v.optional(v.string()),
			// Captured at the moment of the child's first tap — true if first attempt
			// was correct, false if they needed a retry. Used for first-attempt scoring.
			firstAttemptCorrect: v.optional(v.boolean()),
		}))),
		// Pillar→format pairings recorded after generation — used as
		// recentPillarFormatHistory for the NEXT challenge's generation payload.
		pillarFormatHistory: v.optional(v.array(v.object({ pillar: v.string(), format: v.string() }))),
		// `quickCheck` (above) and `answers` (below) are deprecated pre-v1.3
		// fields, kept optional only so the one test row from the first build
		// still validates. No longer written.
		answers: v.optional(v.array(v.number())),
		status: v.union(v.literal("ready"), v.literal("completed")),
		score: v.optional(v.object({
			gradableCorrect: v.number(),
			gradableTotal: v.number(),
			perPillar: v.array(v.object({
				pillar: v.string(),
				correct: v.number(),
				total: v.number(),
			})),
			growingInPillar: v.string(),
			superpowerPillar: v.string(),
			starsEarned: v.number(),
			// Which `questions` indices were actually part of this Challenge
			// submission (base 7 + any unanswered quick checks) — lets the
			// results review show exactly what was graded.
			challengeIndices: v.optional(v.array(v.number())),
		})),
		createdAt: v.number(),
		completedAt: v.optional(v.number()),
	})
		.index("by_user", ["userId"])
		.index("by_story", ["storyId"]),

	testserver_stars: defineTable({
		userId: v.string(),
		amount: v.number(),
		reason: v.string(),
		refId: v.optional(v.string()),
		createdAt: v.number(),
	}).index("by_user", ["userId"]),

	// Records every lifecycle/re-engagement email actually sent, so the daily
	// cron can enforce each cadence (15d / 30d / one-time-per-story) without
	// re-sending on every run. "lapsed_active" and "never_generated" are keyed
	// by userId only (one email per user per cadence window); "challenge_waiting"
	// is keyed by storyId (one nudge ever per story, regardless of user).
	lifecycle_emails: defineTable({
		userId: v.string(),
		emailType: v.union(
			v.literal("lapsed_active"),
			v.literal("never_generated"),
			v.literal("challenge_waiting"),
		),
		storyId: v.optional(v.id("stories")),
		sentAt: v.number(),
	})
		.index("by_user_type", ["userId", "emailType"])
		.index("by_story_type", ["storyId", "emailType"]),

	// ─── STORY ENGINE v2 ──────────────────────────────────────────────────────
	// Additive-only block. Nothing outside generateStoryV2.ts and this schema
	// references these tables during Phase 1–6 development.

	// Per-story memory record used for rotation and anti-repetition (Section L).
	// Written by generateStoryV2 after each successful generation.
	story_memory: defineTable({
		storyId:    v.id("stories"),
		userId:     v.string(),
		profileId:  v.id("user_profiles"),
		childId:    v.union(v.literal("1"), v.literal("2")),

		// Engine decisions for this story
		mode:           v.union(v.literal("quest"), v.literal("wonder")),
		primaryPillar:  v.union(
			v.literal("listening"),
			v.literal("attention"),
			v.literal("emotional"),
			v.literal("cognitive")
		),
		secondaryPillar: v.optional(v.union(
			v.literal("listening"),
			v.literal("attention"),
			v.literal("emotional"),
			v.literal("cognitive")
		)),
		structureShape: v.string(),               // "compressed_5beat" | "full_9beat" + variant suffix
		endingType:     v.optional(v.string()),   // from Section H ending framework; populated from Phase 2
		storyLength:    v.union(v.literal("quick"), v.literal("big")),

		// World variety selections (Section L) — populated from Phase 2
		worldVariety: v.optional(v.object({
			time:        v.string(),
			location:    v.string(),
			environment: v.string(),
		})),

		// Preference usage tiers for this story (Section D) — populated from Phase 2
		preferenceRoles: v.optional(v.object({
			favoriteAnimal: v.optional(v.union(
				v.literal("primary"),
				v.literal("secondary"),
				v.literal("background"),
				v.literal("omitted")
			)),
			favoriteColor: v.optional(v.union(
				v.literal("primary"),
				v.literal("secondary"),
				v.literal("background"),
				v.literal("omitted")
			)),
		})),

		// Who resolved the main problem — for resolver rotation tracking (Section I)
		resolvedBy: v.optional(v.union(
			v.literal("child"),
			v.literal("lalli"),
			v.literal("fafa")
		)),

		// Source of primary pillar — audits whether Challenge signal or LRU rotation drove selection
		pillarSource: v.optional(v.union(v.literal("challenge_signal"), v.literal("lru_rotation"))),

		createdAt: v.number(),
	})
		.index("by_user",          ["userId"])
		.index("by_profile_child", ["profileId", "childId"]),

	// Phase 5 — global sting library (uploaded once, reused across every story)
	stings: defineTable({
		name:            v.string(),
		filePath:        v.string(),    // Convex storage key or external URL
		emotion:         v.union(
			v.literal("happy"),      v.literal("excited"),   v.literal("curious"),
			v.literal("warm"),       v.literal("playful"),   v.literal("thoughtful"),
			v.literal("gentle"),     v.literal("naughty"),   v.literal("surprised"),
			v.literal("proud"),      v.literal("calm"),      v.literal("reassuring")
		),
		durationSeconds: v.number(),    // cached at upload; never probed per placement call
		intensity:       v.union(v.literal("subtle"), v.literal("medium")),
		isActive:        v.boolean(),   // soft-delete; retired stings may still appear in old placements
		createdAt:       v.number(),
	})
		.index("by_emotion", ["emotion", "isActive"])
		.index("by_active",  ["isActive"]),
});



