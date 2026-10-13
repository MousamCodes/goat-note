import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const NOTE_COLORS = ["default", "yellow", "green", "blue", "pink", "purple"];

/** Must match the `outputDimensionality` requested from the embedding model. */
export const EMBEDDING_DIMENSIONS = 768;

const documentStatus = v.union(v.literal("processing"), v.literal("ready"), v.literal("error"));

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    userName: v.string(),
    imageUrl: v.optional(v.string()),
  }).index("by_clerkId", ["clerkId"]),

  // Uploaded PDFs. One row per file; text lives in `chunks`.
  documents: defineTable({
    userId: v.string(),
    title: v.string(),
    fileName: v.string(),
    storageId: v.id("_storage"),
    size: v.number(),
    status: documentStatus,
    error: v.optional(v.string()),
    pageCount: v.optional(v.number()),
    chunkCount: v.optional(v.number()),
    embeddedCount: v.optional(v.number()), // progress while status === "processing"
  }).index("by_user", ["userId"]),

  // Text passages used for retrieval. `embedding` is filled in by a paced
  // background job; rows without it are simply absent from the vector index.
  chunks: defineTable({
    userId: v.string(),
    documentId: v.id("documents"),
    page: v.number(), // 1-based page the chunk came from
    index: v.number(), // position of the chunk within the document
    text: v.string(),
    embedded: v.boolean(),
    embedding: v.optional(v.array(v.float64())),
  })
    .index("by_document", ["documentId"])
    .index("by_document_index", ["documentId", "index"])
    .index("by_document_embedded", ["documentId", "embedded"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: EMBEDDING_DIMENSIONS,
      filterFields: ["userId", "documentId"],
    }),

  // Chat history for "Ask your documents".
  messages: defineTable({
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
  }).index("by_user", ["userId"]),

  // Generated question/answer sets for revision.
  qaSets: defineTable({
    userId: v.string(),
    title: v.string(),
    documentIds: v.array(v.id("documents")),
    documentTitles: v.array(v.string()),
    items: v.array(v.object({ question: v.string(), answer: v.string() })),
  }).index("by_user", ["userId"]),

  notes: defineTable({
    userId: v.string(), // Clerk user id (identity.subject)
    title: v.string(),
    content: v.string(),
    pinned: v.boolean(),
    color: v.string(),
    updatedAt: v.number(),
  }).index("by_user", ["userId", "updatedAt"]),
});
