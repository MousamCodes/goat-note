// Thin client for the Gemini REST API (no SDK needed).
// Requires GEMINI_API_KEY on the Convex deployment:
//   npx convex env set GEMINI_API_KEY <your key>
import { EMBEDDING_DIMENSIONS } from "./schema";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const EMBED_BATCH_SIZE = 100; // API maximum per batchEmbedContents call
const RETRY_DELAYS_MS = [5_000, 10_000, 20_000];

function apiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Run: npx convex env set GEMINI_API_KEY <your key>"
    );
  }
  return key;
}

export function chatModel() {
  return process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash";
}

export function embeddingModel() {
  return process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001";
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class GeminiError extends Error {
  constructor(status, body) {
    let detail = body;
    try {
      detail = JSON.parse(body)?.error?.message ?? body;
    } catch {}
    super(`Gemini request failed (${status}): ${String(detail).slice(0, 300)}`);
    this.status = status;
    this.rateLimited = status === 429;
  }
}

/**
 * POST to Gemini. Transient 5xx errors are retried with backoff. Rate limits
 * (429) are retried only when `retryRateLimit` is true; the embedding pipeline
 * handles them itself by rescheduling, so it passes false.
 */
async function callGemini(path, body, { retryRateLimit = true } = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${BASE_URL}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey() },
      body: JSON.stringify(body),
    });
    if (res.ok) return await res.json();

    const error = new GeminiError(res.status, await res.text());
    const retryable = res.status >= 500 || (res.status === 429 && retryRateLimit);
    if (!retryable || attempt >= RETRY_DELAYS_MS.length) throw error;
    await sleep(RETRY_DELAYS_MS[attempt]);
  }
}

/**
 * Embed a list of strings. taskType is "RETRIEVAL_DOCUMENT" for stored chunks
 * and "RETRIEVAL_QUERY" for questions. Note: on the Gemini free tier every
 * text in a batch counts toward the per-minute request quota.
 */
export async function embedTexts(texts, taskType, options = {}) {
  const model = embeddingModel();
  const vectors = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBED_BATCH_SIZE);
    const data = await callGemini(
      `models/${model}:batchEmbedContents`,
      {
        requests: batch.map((text) => ({
          model: `models/${model}`,
          content: { parts: [{ text }] },
          taskType,
          outputDimensionality: EMBEDDING_DIMENSIONS,
        })),
      },
      options
    );
    const embeddings = data.embeddings ?? [];
    if (embeddings.length !== batch.length) {
      throw new Error("Gemini returned an unexpected number of embeddings");
    }
    vectors.push(...embeddings.map((e) => e.values));
  }
  return vectors;
}

/** Generate text (or JSON when `json` is true) from a prompt. */
export async function generateText(prompt, { system, json = false, temperature = 0.3 } = {}) {
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      ...(json ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  const data = await callGemini(`models/${chatModel()}:generateContent`, body);
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text.trim()) {
    const reason = candidate?.finishReason || data.promptFeedback?.blockReason || "unknown reason";
    throw new Error(`Gemini returned an empty response (${reason})`);
  }
  return text;
}
