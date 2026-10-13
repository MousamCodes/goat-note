import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { embedTexts } from "./gemini";

// Gemini's free tier allows ~100 embedded texts per minute, so embed in
// batches of 50 spaced 30s apart and back off further on 429s.
const BATCH = 50;
const PACE_MS = 30_000;
const RATE_LIMIT_DELAY_MS = 45_000;
const MAX_RATE_LIMIT_RETRIES = 12; // ~9 minutes of waiting before giving up

/**
 * Embeds the next batch of un-embedded passages for a document and
 * reschedules itself until none remain, then marks the document ready.
 */
export const embedPending = internalAction({
  args: { documentId: v.id("documents"), rateLimitRetries: v.optional(v.number()) },
  handler: async (ctx, { documentId, rateLimitRetries = 0 }) => {
    const pending = await ctx.runQuery(internal.embeddings.pendingChunks, {
      documentId,
      limit: BATCH,
    });
    if (pending === null) return; // document was deleted or is no longer processing

    if (pending.length === 0) {
      await ctx.runMutation(internal.documents.setStatus, { id: documentId, status: "ready" });
      return;
    }

    let vectors;
    try {
      vectors = await embedTexts(
        pending.map((c) => c.text),
        "RETRIEVAL_DOCUMENT",
        { retryRateLimit: false }
      );
    } catch (err) {
      if (err?.rateLimited && rateLimitRetries < MAX_RATE_LIMIT_RETRIES) {
        await ctx.scheduler.runAfter(RATE_LIMIT_DELAY_MS, internal.embeddings.embedPending, {
          documentId,
          rateLimitRetries: rateLimitRetries + 1,
        });
        return;
      }
      const message = err?.rateLimited
        ? "Gemini's free-tier embedding quota is used up for now. Press Retry in a few minutes (per-minute quota) or tomorrow (daily quota)."
        : String(err?.message ?? err).slice(0, 500);
      await ctx.runMutation(internal.documents.setStatus, {
        id: documentId,
        status: "error",
        error: message,
      });
      return;
    }

    await ctx.runMutation(internal.embeddings.saveEmbeddings, {
      documentId,
      items: pending.map((c, i) => ({ id: c._id, embedding: vectors[i] })),
    });

    // More to do? Pace the next batch so we stay under the per-minute quota.
    const delay = pending.length === BATCH ? PACE_MS : 0;
    await ctx.scheduler.runAfter(delay, internal.embeddings.embedPending, { documentId });
  },
});

/** Next un-embedded passages, or null if the document is gone / not processing. */
export const pendingChunks = internalQuery({
  args: { documentId: v.id("documents"), limit: v.number() },
  handler: async (ctx, { documentId, limit }) => {
    const doc = await ctx.db.get(documentId);
    if (!doc || doc.status !== "processing") return null;
    const rows = await ctx.db
      .query("chunks")
      .withIndex("by_document_embedded", (q) => q.eq("documentId", documentId).eq("embedded", false))
      .take(limit);
    return rows.map(({ _id, text }) => ({ _id, text }));
  },
});

export const saveEmbeddings = internalMutation({
  args: {
    documentId: v.id("documents"),
    items: v.array(v.object({ id: v.id("chunks"), embedding: v.array(v.float64()) })),
  },
  handler: async (ctx, { documentId, items }) => {
    let saved = 0;
    for (const { id, embedding } of items) {
      const chunk = await ctx.db.get(id);
      if (!chunk) continue; // document deleted mid-flight
      await ctx.db.patch(id, { embedding, embedded: true });
      saved++;
    }
    const doc = await ctx.db.get(documentId);
    if (doc) await ctx.db.patch(documentId, { embeddedCount: (doc.embeddedCount ?? 0) + saved });
  },
});
