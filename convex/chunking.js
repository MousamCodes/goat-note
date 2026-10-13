// Pure text-chunking helpers shared by ingestion. No Convex imports so it can be unit-tested with node.

// Larger passages mean fewer embedding calls (the Gemini free tier counts each
// passage against a per-minute and per-day quota) while staying well under the
// embedding model's input limit.
export const CHUNK_SIZE = 1500; // characters
export const CHUNK_OVERLAP = 200;
const MIN_CHUNK = 40;

/** Collapse odd whitespace that PDF extraction produces. */
export function normalizeText(text) {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Split one page of text into overlapping chunks, preferring to break at
 * paragraph, sentence, or word boundaries.
 */
export function chunkText(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const clean = normalizeText(text);
  if (clean.length <= size) return clean.length >= MIN_CHUNK ? [clean] : [];

  const chunks = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + size, clean.length);
    if (end < clean.length) {
      const window = clean.slice(start, end);
      // Look for the best boundary in the last 40% of the window.
      const floor = Math.floor(size * 0.6);
      const candidates = [
        window.lastIndexOf("\n\n"),
        window.lastIndexOf(". "),
        window.lastIndexOf("? "),
        window.lastIndexOf("! "),
        window.lastIndexOf("\n"),
        window.lastIndexOf(" "),
      ];
      const cut = candidates.find((i) => i >= floor);
      if (cut !== undefined) end = start + cut + 1;
    }
    const piece = clean.slice(start, end).trim();
    if (piece.length >= MIN_CHUNK) chunks.push(piece);
    if (end >= clean.length) break;
    start = Math.max(end - overlap, start + 1);
    // Snap the overlap start to the next word boundary so chunks never begin mid-word.
    const space = clean.indexOf(" ", start);
    if (space !== -1 && space < end) start = space + 1;
  }
  return chunks;
}

/**
 * pages: array of page strings (index 0 = page 1).
 * Returns [{ page, index, text }] with a document-wide running index.
 */
export function chunkPages(pages) {
  const out = [];
  pages.forEach((pageText, i) => {
    for (const text of chunkText(pageText ?? "")) {
      out.push({ page: i + 1, index: out.length, text });
    }
  });
  return out;
}
