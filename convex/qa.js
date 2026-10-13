import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { generateText } from "./gemini";

const MIN_COUNT = 5;
const MAX_COUNT = 25;
const SAMPLE_CHUNKS_TOTAL = 36; // spread evenly across the chosen documents
const MAX_CONTEXT_CHARS = 30_000;

async function requireUserId(ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity.subject;
}

/* ---------- public API ---------- */

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const sets = await ctx.db
      .query("qaSets")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
    // Keep list payloads small: no items, just counts.
    return sets.map(({ items, ...rest }) => ({ ...rest, count: items.length }));
  },
});

export const get = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const id = ctx.db.normalizeId("qaSets", args.id);
    if (!id) return null;
    const set = await ctx.db.get(id);
    if (!set || set.userId !== identity.subject) return null;
    return set;
  },
});

export const remove = mutation({
  args: { id: v.id("qaSets") },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    const set = await ctx.db.get(id);
    if (!set || set.userId !== userId) throw new Error("Q&A set not found");
    await ctx.db.delete(id);
  },
});

/** Generate a set of question/answer pairs from the selected documents. */
export const generate = action({
  args: {
    documentIds: v.array(v.id("documents")),
    count: v.number(),
    focus: v.optional(v.string()),
  },
  handler: async (ctx, { documentIds, count, focus }) => {
    const userId = await requireUserId(ctx);
    const n = Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.round(count)));

    const docs = await ctx.runQuery(internal.chat.readyDocuments, { userId, documentIds });
    if (docs.length === 0) throw new Error("Select at least one processed document");

    const perDoc = Math.max(4, Math.ceil(SAMPLE_CHUNKS_TOTAL / docs.length));
    const samples = await ctx.runQuery(internal.qa.sampleChunks, {
      documentIds: docs.map((d) => d._id),
      userId,
      perDoc,
    });

    const titleById = Object.fromEntries(docs.map((d) => [d._id, d.title]));
    let context = "";
    for (const s of samples) {
      const block = `--- ${titleById[s.documentId]} (page ${s.page}) ---\n${s.text}\n\n`;
      if (context.length + block.length > MAX_CONTEXT_CHARS) break;
      context += block;
    }
    if (!context) throw new Error("The selected documents have no text to work from");

    const topic = focus?.trim() ? `Focus on: ${focus.trim().slice(0, 200)}.\n` : "";
    const prompt = `Create exactly ${n} high-quality exam-style question and answer pairs from the study material below.
${topic}Guidelines:
- Cover the most important concepts, definitions, formulas, processes and comparisons; vary difficulty.
- Questions must be answerable from the material. Answers should be complete but concise (1-4 sentences, or a short list).
- Mix question types: define, explain, compare, apply, "why" questions.
- Do not number the questions. Do not reference "the document" or "the text".
Return a JSON array of objects with keys "question" and "answer".

STUDY MATERIAL:
${context}`;

    const raw = await generateText(prompt, { json: true, temperature: 0.5 });
    const items = parseItems(raw).slice(0, n);
    if (items.length === 0) throw new Error("The model did not return any usable questions. Try again.");

    const title =
      docs.length === 1 ? docs[0].title : `${docs[0].title} + ${docs.length - 1} more`;

    return await ctx.runMutation(internal.qa.save, {
      userId,
      title: focus?.trim() ? `${title} — ${focus.trim().slice(0, 60)}` : title,
      documentIds: docs.map((d) => d._id),
      documentTitles: docs.map((d) => d.title),
      items,
    });
  },
});

function parseItems(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    // Model occasionally wraps JSON in a code fence despite the mime type.
    const match = raw.match(/\[[\s\S]*\]/);
    data = match ? JSON.parse(match[0]) : [];
  }
  const arr = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
  return arr
    .map((it) => ({
      question: String(it?.question ?? "").trim(),
      answer: String(it?.answer ?? "").trim(),
    }))
    .filter((it) => it.question && it.answer);
}

/* ---------- internal helpers ---------- */

/** Evenly spaced chunks from each document, read by index to stay cheap. */
export const sampleChunks = internalQuery({
  args: { documentIds: v.array(v.id("documents")), userId: v.string(), perDoc: v.number() },
  handler: async (ctx, { documentIds, userId, perDoc }) => {
    const out = [];
    for (const documentId of documentIds) {
      const doc = await ctx.db.get(documentId);
      if (!doc || doc.userId !== userId) continue;
      const total = doc.chunkCount ?? 0;
      if (total === 0) continue;
      const take = Math.min(perDoc, total);
      const step = total / take;
      for (let k = 0; k < take; k++) {
        const index = Math.min(total - 1, Math.floor(k * step));
        const chunk = await ctx.db
          .query("chunks")
          .withIndex("by_document_index", (q) => q.eq("documentId", documentId).eq("index", index))
          .unique();
        if (chunk) out.push({ documentId, page: chunk.page, text: chunk.text });
      }
    }
    return out;
  },
});

export const save = internalMutation({
  args: {
    userId: v.string(),
    title: v.string(),
    documentIds: v.array(v.id("documents")),
    documentTitles: v.array(v.string()),
    items: v.array(v.object({ question: v.string(), answer: v.string() })),
  },
  handler: async (ctx, args) => await ctx.db.insert("qaSets", args),
});
