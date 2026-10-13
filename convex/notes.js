import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { NOTE_COLORS } from "./schema";

const MAX_TITLE = 200;
const MAX_CONTENT = 50_000;

async function requireUserId(ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity.subject;
}

async function requireOwnedNote(ctx, id) {
  const userId = await requireUserId(ctx);
  const note = await ctx.db.get(id);
  if (!note || note.userId !== userId) throw new Error("Note not found");
  return note;
}

function validateColor(color) {
  if (!NOTE_COLORS.includes(color)) throw new Error("Invalid color");
}

/** All notes for the signed-in user, most recently updated first. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

/** A single note, or null when it does not exist or belongs to someone else. */
export const get = query({
  // Accepts any string so a malformed id in the URL yields null instead of a validation error.
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const id = ctx.db.normalizeId("notes", args.id);
    if (!id) return null;
    const note = await ctx.db.get(id);
    if (!note || note.userId !== identity.subject) return null;
    return note;
  },
});

export const create = mutation({
  args: {
    title: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await ctx.db.insert("notes", {
      userId,
      title: (args.title ?? "").slice(0, MAX_TITLE),
      content: (args.content ?? "").slice(0, MAX_CONTENT),
      pinned: false,
      color: "default",
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("notes"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await requireOwnedNote(ctx, id);
    const patch = {};
    if (fields.title !== undefined) patch.title = fields.title.slice(0, MAX_TITLE);
    if (fields.content !== undefined) patch.content = fields.content.slice(0, MAX_CONTENT);
    if (fields.color !== undefined) {
      validateColor(fields.color);
      patch.color = fields.color;
    }
    if (Object.keys(patch).length === 0) return;
    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });
  },
});

export const togglePin = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, { id }) => {
    const note = await requireOwnedNote(ctx, id);
    await ctx.db.patch(id, { pinned: !note.pinned });
    return !note.pinned;
  },
});

export const remove = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, { id }) => {
    await requireOwnedNote(ctx, id);
    await ctx.db.delete(id);
  },
});
