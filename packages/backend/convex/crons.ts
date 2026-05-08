import { cronJobs } from "convex/server";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run cleanup daily at 2 AM UTC
crons.daily(
	"cleanup old stories",
	{ hourUTC: 2, minuteUTC: 0 },
	internal.crons.cleanupOldStories
);

export default crons;

/**
 * Internal mutation to clean up old stories, keeping only the 10 most recent per user
 * Deletes scene images and narration audio files from storage
 */
export const cleanupOldStories = internalMutation({
	args: {},
	handler: async (ctx) => {
		// Get all users who have stories
		const allStories = await ctx.db
			.query("stories")
			.collect();

		// Group stories by userId
		const storiesByUser = new Map<string, typeof allStories>();
		for (const story of allStories) {
			const userId = story.userId;
			if (!storiesByUser.has(userId)) {
				storiesByUser.set(userId, []);
			}
			storiesByUser.get(userId)!.push(story);
		}

		let deletedCount = 0;
		let deletedFiles = 0;

		// Process each user's stories
		for (const [userId, userStories] of storiesByUser.entries()) {
			// Filter out stories that are still generating or queued (don't delete these)
			const completedStories = userStories.filter(
				(story: typeof allStories[0]) => story.status === "ready" || story.status === "error"
			);

			// Sort by creation time (newest first)
			const sortedStories = completedStories.sort((a: typeof allStories[0], b: typeof allStories[0]) => b.createdAt - a.createdAt);

			// Keep only the 10 most recent
			const storiesToKeep = sortedStories.slice(0, 10);
			const storiesToDelete = sortedStories.slice(10);

			// Delete old stories and their associated files
			for (const story of storiesToDelete) {
				try {
					// Delete scene images
					if (story.sceneMetadata && story.sceneMetadata.length > 0) {
						for (const scene of story.sceneMetadata) {
							if (scene.filePath) {
								try {
									await ctx.storage.delete(scene.filePath as any);
									deletedFiles++;
								} catch (err) {
									console.error(`Failed to delete scene image ${scene.filePath}:`, err);
								}
							}
						}
					}

					// Delete narration audio file
					if (story.narrationFilePath) {
						try {
							await ctx.storage.delete(story.narrationFilePath as any);
							deletedFiles++;
						} catch (err) {
							console.error(`Failed to delete narration file ${story.narrationFilePath}:`, err);
						}
					}

					// Delete the story document
					await ctx.db.delete(story._id);
					deletedCount++;
				} catch (err) {
					console.error(`Failed to delete story ${story._id}:`, err);
				}
			}
		}

		console.log(`Cleanup completed: Deleted ${deletedCount} stories and ${deletedFiles} files`);
		return { deletedStories: deletedCount, deletedFiles };
	},
});

