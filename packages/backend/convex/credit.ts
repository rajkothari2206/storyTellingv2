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
            .query("user_credits")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc")
            .collect();
        return docs;
    },
});

export const _updateCredit = mutation({
    args: {
        creditId: v.id("user_credits"),
        usedCredits: v.number(),
    },
    handler: async (ctx, { creditId, usedCredits }) => {
        //calculate available credits
        const userCredit = await ctx.db.get(creditId);
        if (!userCredit) return { success: false, error: "User credit not found" };
        const availableCredits = userCredit.availableCredits - usedCredits;
        await ctx.db.patch(creditId, { usedCredits, availableCredits, updatedAt: Date.now() });
        return { success: true };
    },
});

export const _createCredit = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }
        const userId = String(user._id);
        await ctx.db.insert("user_credits", { userId, totalCredits: 250, usedCredits: 0, availableCredits: 250, createdAt: Date.now(), updatedAt: Date.now() });
        return { success: true };
    },
});

export const _addCredits = mutation({
    args: {
        userId: v.string(),
        credits: v.number(),
    },
    handler: async (ctx, { userId, credits }) => {
        // Find user's credit record
        const userCredit = await ctx.db
            .query("user_credits")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc")
            .first();

        if (!userCredit) {
            // Create credit record if it doesn't exist
            await ctx.db.insert("user_credits", {
                userId,
                totalCredits: credits,
                usedCredits: 0,
                availableCredits: credits,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        } else {
            // Update existing credit record
            const newTotalCredits = userCredit.totalCredits + credits;
            const newAvailableCredits = userCredit.availableCredits + credits;
            await ctx.db.patch(userCredit._id, {
                totalCredits: newTotalCredits,
                availableCredits: newAvailableCredits,
                updatedAt: Date.now(),
            });
        }
        return { success: true };
    },
});
export const adminGetUserCredits = query({
    args: { userId: v.string() },
    handler: async (ctx, { userId }) => {
        // Verify caller is admin
        const user = await authComponent.getAuthUser(ctx);
        if (!user) throw new Error("Not authenticated");
        const callerIdentifier = String((user as any).userId || (user as any)._id);
        const callerRole = await ctx.db
            .query("user_roles")
            .withIndex("by_user", (q) => q.eq("userId", callerIdentifier))
            .first();
        if (callerRole?.role !== "admin") throw new Error("Admin access required");

        const credit = await ctx.db
            .query("user_credits")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc")
            .first();
        return credit ?? null;
    },
});

export const adminAdjustCredits = mutation({
    args: {
        userId: v.string(),
        amount: v.number(), // positive = add, negative = remove
        reason: v.optional(v.string()),
    },
    handler: async (ctx, { userId, amount, reason }) => {
        // Verify caller is admin
        const user = await authComponent.getAuthUser(ctx);
        if (!user) throw new Error("Not authenticated");
        const callerIdentifier = String((user as any).userId || (user as any)._id);
        const callerRole = await ctx.db
            .query("user_roles")
            .withIndex("by_user", (q) => q.eq("userId", callerIdentifier))
            .first();
        if (callerRole?.role !== "admin") throw new Error("Admin access required");

        const userCredit = await ctx.db
            .query("user_credits")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc")
            .first();

        if (!userCredit) {
            if (amount <= 0) throw new Error("No credit record found for this user");
            // Create credit record
            await ctx.db.insert("user_credits", {
                userId,
                totalCredits: amount,
                usedCredits: 0,
                availableCredits: amount,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        } else {
            const newAvailable = Math.max(0, userCredit.availableCredits + amount);
            const newTotal = amount > 0
                ? userCredit.totalCredits + amount  // adding credits increases total
                : userCredit.totalCredits;           // removing credits doesn't change total earned
            await ctx.db.patch(userCredit._id, {
                totalCredits: newTotal,
                availableCredits: newAvailable,
                updatedAt: Date.now(),
            });
        }
        return { success: true };
    },
});

export const adminListAllCredits = query({
    args: {},
    handler: async (ctx) => {
        // Verify caller is admin
        const user = await authComponent.getAuthUser(ctx);
        if (!user) throw new Error("Not authenticated");
        const callerIdentifier = String((user as any).userId || (user as any)._id);
        const callerRole = await ctx.db
            .query("user_roles")
            .withIndex("by_user", (q) => q.eq("userId", callerIdentifier))
            .first();
        if (callerRole?.role !== "admin") throw new Error("Admin access required");

        return await ctx.db.query("user_credits").collect();
    },
});
