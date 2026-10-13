import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
const DELETE_BATCH = 200;

async function requireUserId(ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity.subject;
}

async function requireOwnedDocument(ctx, id) {
  const userId = await requireUserId(ctx);
  const doc = await ctx.db.get(id);
  if (!doc || doc.userId !== userId) throw new Error("Document not found");
  return doc;
}

function titleFromFileName(fileName) {
  return (
    fileName
      .replace(/\.pdf$/i, "")
      .replace(/[_\-.]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) || "Untitled document"
  );
}

/* ---------- public API ---------- */

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Register an uploaded PDF and queue it for text extraction + embedding. */
export const create = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    if (args.size > MAX_FILE_BYTES) {
      await ctx.storage.delete(args.storageId);
      throw new Error("File is larger than 25 MB");
    }
    const id = await ctx.db.insert("documents", {
      userId,
      title: titleFromFileName(args.fileName),
      fileName: args.fileName,
      storageId: args.storageId,
      size: args.size,
      status: "processing",
    });
    await ctx.scheduler.runAfter(0, internal.ingest.processDocument, { documentId: id });
    return id;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

export const rename = mutation({
  args: { id: v.id("documents"), title: v.string() },
  handler: async (ctx, { id, title }) => {
    await requireOwnedDocument(ctx, id);
    const clean = title.trim().slice(0, 120);
    if (!clean) throw new Error("Title cannot be empty");
    await ctx.db.patch(id, { title: clean });
  },
});

/** Re-run extraction for a document that failed. */
export const reprocess = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, { id }) => {
    const doc = await requireOwnedDocument(ctx, id);
    if (doc.status === "processing") return;
    await ctx.db.patch(id, {
      status: "processing",
      error: undefined,
      chunkCount: undefined,
      embeddedCount: undefined,
    });
    // Clear any partial chunks, then ingest again.
    await ctx.scheduler.runAfter(0, internal.documents.deleteChunks, {
      documentId: id,
      thenIngest: true,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, { id }) => {
    const doc = await requireOwnedDocument(ctx, id);
    await ctx.storage.delete(doc.storageId);
    await ctx.db.delete(id);
    await ctx.scheduler.runAfter(0, internal.documents.deleteChunks, {
      documentId: id,
      thenIngest: false,
    });
  },
});

/* ---------- internal (used by ingestion) ---------- */

export const getForIngest = internalQuery({
  args: { id: v.id("documents") },
  handler: async (ctx, { id }) => await ctx.db.get(id),
});

export const setStatus = internalMutation({
  args: {
    id: v.id("documents"),
    status: v.union(v.literal("processing"), v.literal("ready"), v.literal("error")),
    error: v.optional(v.string()),
    pageCount: v.optional(v.number()),
    chunkCount: v.optional(v.number()),
    embeddedCount: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const doc = await ctx.db.get(id);
    if (!doc) return; // deleted while processing
    await ctx.db.patch(id, fields);
  },
});

export const insertChunks = internalMutation({
  args: {
    documentId: v.id("documents"),
    userId: v.string(),
    chunks: v.array(
      v.object({
        page: v.number(),
        index: v.number(),
        text: v.string(),
      })
    ),
  },
  handler: async (ctx, { documentId, userId, chunks }) => {
    const doc = await ctx.db.get(documentId);
    if (!doc) return; // deleted while processing
    for (const chunk of chunks) {
      await ctx.db.insert("chunks", { documentId, userId, embedded: false, ...chunk });
    }
  },
});

/** Deletes a document's chunks in batches, rescheduling itself until done. */
export const deleteChunks = internalMutation({
  args: { documentId: v.id("documents"), thenIngest: v.boolean() },
  handler: async (ctx, { documentId, thenIngest }) => {
    const batch = await ctx.db
      .query("chunks")
      .withIndex("by_document", (q) => q.eq("documentId", documentId))
      .take(DELETE_BATCH);
    for (const chunk of batch) await ctx.db.delete(chunk._id);

    if (batch.length === DELETE_BATCH) {
      await ctx.scheduler.runAfter(0, internal.documents.deleteChunks, { documentId, thenIngest });
    } else if (thenIngest) {
      await ctx.scheduler.runAfter(0, internal.ingest.processDocument, { documentId });
    }
  },
});
