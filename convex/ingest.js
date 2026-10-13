"use node";
import { v } from "convex/values";
import { extractText, getDocumentProxy } from "unpdf";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { chunkPages } from "./chunking";

const INSERT_BATCH = 100; // passages per mutation call
const MAX_CHUNKS = 1500; // keeps very large PDFs bounded

/**
 * Stage 1 of ingestion (Node runtime, because PDF parsing needs it):
 * extract text from the uploaded PDF, chunk it, and store the passages.
 * Stage 2 (embeddings.embedPending) embeds them in rate-limited batches.
 */
export const processDocument = internalAction({
  args: { documentId: v.id("documents") },
  handler: async (ctx, { documentId }) => {
    const doc = await ctx.runQuery(internal.documents.getForIngest, { id: documentId });
    if (!doc) return;

    try {
      const blob = await ctx.storage.get(doc.storageId);
      if (!blob) throw new Error("Uploaded file could not be found in storage");

      const data = new Uint8Array(await blob.arrayBuffer());
      const pdf = await getDocumentProxy(data);
      const { totalPages, text: pages } = await extractText(pdf, { mergePages: false });

      const chunks = chunkPages(pages).slice(0, MAX_CHUNKS);
      if (chunks.length === 0) {
        throw new Error(
          "No readable text was found. Scanned/image-only PDFs are not supported yet."
        );
      }

      for (let i = 0; i < chunks.length; i += INSERT_BATCH) {
        await ctx.runMutation(internal.documents.insertChunks, {
          documentId,
          userId: doc.userId,
          chunks: chunks.slice(i, i + INSERT_BATCH),
        });
      }

      await ctx.runMutation(internal.documents.setStatus, {
        id: documentId,
        status: "processing",
        pageCount: totalPages,
        chunkCount: chunks.length,
        embeddedCount: 0,
      });
      await ctx.scheduler.runAfter(0, internal.embeddings.embedPending, { documentId });
    } catch (err) {
      const message = String(err?.message ?? err).slice(0, 500);
      console.error(`Ingestion failed for ${documentId}: ${message}`);
      await ctx.runMutation(internal.documents.setStatus, {
        id: documentId,
        status: "error",
        error: message,
      });
    }
  },
});
