import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { embedTexts, generateText } from "./gemini";

const TOP_K = 8;
const HISTORY_TURNS = 6;
const MAX_QUESTION = 2000;

const SYSTEM_PROMPT = `You are Goat Note, a friendly study assistant for college students.
Answer the student's question using ONLY the numbered excerpts from their uploaded documents.
Rules:
- Cite the excerpts you use inline like [1] or [2][3]. Every factual claim needs a citation.
- If the excerpts do not contain enough information, say so plainly and suggest what the student could look for. Do not invent facts.
- Explain clearly, like a good tutor. Use Markdown: short paragraphs, bullet points, bold key terms. Keep it focused.
- If the question asks for a definition, formula, or steps, give them precisely as the material states.`;

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
    return await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const m of messages) await ctx.db.delete(m._id);
  },
});

/**
 * Ask a question across the selected documents. The answer is written to the
 * message history (which the UI subscribes to) and also returned.
 */
export const ask = action({
  args: { question: v.string(), documentIds: v.array(v.id("documents")) },
  handler: async (ctx, { question, documentIds }) => {
    const userId = await requireUserId(ctx);
    const q = question.trim();
    if (!q) throw new Error("Please type a question");
    if (q.length > MAX_QUESTION) throw new Error("Question is too long");

    const docs = await ctx.runQuery(internal.chat.readyDocuments, { userId, documentIds });
    if (docs.length === 0) throw new Error("Select at least one processed document");

    const history = await ctx.runQuery(internal.chat.recent, { userId, limit: HISTORY_TURNS });
    await ctx.runMutation(internal.chat.append, {
      userId,
      role: "user",
      content: q,
      documentIds: docs.map((d) => d._id),
    });

    try {
      const [vector] = await embedTexts([q], "RETRIEVAL_QUERY");
      const results = await ctx.vectorSearch("chunks", "by_embedding", {
        vector,
        limit: TOP_K,
        filter: (f) =>
          docs.length === 1
            ? f.eq("documentId", docs[0]._id)
            : f.or(...docs.map((d) => f.eq("documentId", d._id))),
      });

      const chunks = await ctx.runQuery(internal.chat.chunksByIds, {
        ids: results.map((r) => r._id),
        userId,
      });
      const titleById = Object.fromEntries(docs.map((d) => [d._id, d.title]));

      const excerpts = chunks
        .map((c, i) => `[${i + 1}] (${titleById[c.documentId]}, page ${c.page})\n${c.text}`)
        .join("\n\n");
      const transcript = history
        .map((m) => `${m.role === "user" ? "Student" : "Assistant"}: ${m.content}`)
        .join("\n");

      const prompt = `EXCERPTS FROM THE STUDENT'S DOCUMENTS:
${excerpts || "(no relevant excerpts were found)"}

${transcript ? `RECENT CONVERSATION:\n${transcript}\n\n` : ""}STUDENT'S QUESTION: ${q}`;

      const answer = await generateText(prompt, { system: SYSTEM_PROMPT });

      const seen = new Set();
      const sources = chunks
        .map((c) => ({
          documentId: c.documentId,
          title: titleById[c.documentId] ?? "Document",
          page: c.page,
          snippet: c.text.slice(0, 200),
        }))
        .filter((s) => {
          const key = `${s.documentId}:${s.page}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

      await ctx.runMutation(internal.chat.append, { userId, role: "assistant", content: answer, sources });
      return answer;
    } catch (err) {
      const message = String(err?.message ?? err);
      await ctx.runMutation(internal.chat.append, {
        userId,
        role: "assistant",
        content: `Sorry, I couldn't answer that. ${message}`,
        error: true,
      });
      throw err;
    }
  },
});

/* ---------- internal helpers ---------- */

/** Documents from `documentIds` that belong to the user and are ready. */
export const readyDocuments = internalQuery({
  args: { userId: v.string(), documentIds: v.array(v.id("documents")) },
  handler: async (ctx, { userId, documentIds }) => {
    const docs = await Promise.all(documentIds.map((id) => ctx.db.get(id)));
    return docs.filter((d) => d && d.userId === userId && d.status === "ready");
  },
});

export const chunksByIds = internalQuery({
  args: { ids: v.array(v.id("chunks")), userId: v.string() },
  handler: async (ctx, { ids, userId }) => {
    const chunks = await Promise.all(ids.map((id) => ctx.db.get(id)));
    return chunks
      .filter((c) => c && c.userId === userId)
      .map(({ _id, documentId, page, text }) => ({ _id, documentId, page, text }));
  },
});

export const recent = internalQuery({
  args: { userId: v.string(), limit: v.number() },
  handler: async (ctx, { userId, limit }) => {
    const rows = await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
    return rows
      .reverse()
      .filter((m) => !m.error)
      .map(({ role, content }) => ({ role, content: content.slice(0, 1500) }));
  },
});

export const append = internalMutation({
  args: {
    userId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    documentIds: v.optional(v.array(v.id("documents"))),
    sources: v.optional(
      v.array(
        v.object({
          documentId: v.id("documents"),
          title: v.string(),
          page: v.number(),
          snippet: v.string(),
        })
      )
    ),
    error: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => await ctx.db.insert("messages", args),
});
