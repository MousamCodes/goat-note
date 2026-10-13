import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Upsert the signed-in user's profile. Called once after sign-in. */
export const sync = mutation({
  args: {
    email: v.string(),
    userName: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existing) {
      const changed =
        existing.email !== args.email ||
        existing.userName !== args.userName ||
        existing.imageUrl !== args.imageUrl;
      if (changed) await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("users", { clerkId: identity.subject, ...args });
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});
