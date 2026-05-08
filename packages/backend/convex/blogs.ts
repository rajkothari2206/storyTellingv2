import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

// List all blogs (admin only)
export const listAll = query({
	args: {},
	handler: async (ctx) => {
		
		const blogs = await ctx.db
			.query("blogs")
			.order("desc")
			.collect();
		
		return blogs;
	},
});

// Get a single blog by ID
export const get = query({
	args: { blogId: v.id("blogs") },
	handler: async (ctx, { blogId }) => {
		const blog = await ctx.db.get(blogId);
		if (!blog) throw new Error("Blog not found");
		return blog;
	},
});

// List all published blogs (public)
export const listPublished = query({
	args: {},
	handler: async (ctx) => {
		const blogs = await ctx.db
			.query("blogs")
			.withIndex("by_status", (q) => q.eq("status", "published"))
			.order("desc")
			.collect();
		
		return blogs;
	},
});

// Get a blog by slug (public)
export const getBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, { slug }) => {
		const blog = await ctx.db
			.query("blogs")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.filter((q) => q.eq(q.field("status"), "published"))
			.first();
		
		if (!blog) throw new Error("Blog not found");
		return blog;
	},
});

// Create a new blog (admin only)
export const create = mutation({
	args: {
		title: v.string(),
		slug: v.string(),
		content: v.any(), // Editor.js output format
		excerpt: v.optional(v.string()),
		status: v.union(v.literal("draft"), v.literal("published")),
	},
	handler: async (ctx, args) => {
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

		// Check if slug already exists
		const existingBlog = await ctx.db
			.query("blogs")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.first();
		
		if (existingBlog) {
			throw new Error("Blog with this slug already exists");
		}

		const now = Date.now();
		const blogId = await ctx.db.insert("blogs", {
			title: args.title,
			slug: args.slug,
			content: args.content,
			excerpt: args.excerpt,
			status: args.status,
			publishedAt: args.status === "published" ? now : undefined,
			createdAt: now,
			updatedAt: now,
		});

		return blogId;
	},
});

// Update a blog (admin only)
export const update = mutation({
	args: {
		blogId: v.id("blogs"),
		title: v.optional(v.string()),
		slug: v.optional(v.string()),
		content: v.optional(v.any()),
		excerpt: v.optional(v.string()),
		status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
	},
	handler: async (ctx, args) => {
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

		const blog = await ctx.db.get(args.blogId);
		if (!blog) throw new Error("Blog not found");

		// Check if slug is being changed and if it already exists
		if (args.slug && args.slug !== blog.slug) {
			const existingBlog = await ctx.db
				.query("blogs")
				.withIndex("by_slug", (q) => q.eq("slug", args?.slug || ""))
				.first();
			
			if (existingBlog) {
				throw new Error("Blog with this slug already exists");
			}
		}

		const updateData: any = {
			updatedAt: Date.now(),
		};

		if (args.title !== undefined) updateData.title = args.title;
		if (args.slug !== undefined) updateData.slug = args.slug;
		if (args.content !== undefined) updateData.content = args.content;
		if (args.excerpt !== undefined) updateData.excerpt = args.excerpt;
		if (args.status !== undefined) {
			updateData.status = args.status;
			// Set publishedAt when status changes to published
			if (args.status === "published" && blog.status !== "published") {
				updateData.publishedAt = Date.now();
			}
		}

		await ctx.db.patch(args.blogId, updateData);
		return await ctx.db.get(args.blogId);
	},
});

// Delete a blog (admin only)
export const remove = mutation({
	args: { blogId: v.id("blogs") },
	handler: async (ctx, { blogId }) => {
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

		const blog = await ctx.db.get(blogId);
		if (!blog) throw new Error("Blog not found");

		await ctx.db.delete(blogId);
		return { success: true };
	},
});
