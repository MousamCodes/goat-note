# Goat Note 🐐

Chat with your college PDFs. Upload lecture notes, textbooks and past papers, ask questions across all of them, and generate exam-style Q&A sets for revision. Every answer cites the page it came from.

Built with **Next.js 16** (App Router), **Convex** (file storage, database, vector search, background jobs), **Clerk** (authentication) and **Gemini** (embeddings + answers), styled with **Tailwind CSS v4**.

## Features

- **Upload multiple PDFs** at once (drag and drop, up to 25 MB each). Each file is read, split into passages and embedded in the background; the card updates live.
- **Ask your documents**: pick any subset of PDFs and ask in plain English. Retrieval uses Convex vector search over the passages; Gemini answers only from those passages and cites them as `[1]`, `[2]`, with page chips under each answer. Conversation history is kept.
- **Practice Q&A**: generate 5–20 question/answer pairs from selected documents, optionally focused on a topic. Reveal answers one by one, mark what you know, see progress.
- **Quick notes**: autosaving notes with pinning, colours and search.
- Sign in with Clerk; every document, passage, message and note is scoped to your account on the server.
- Light / dark mode, responsive layout.

## How it works

```
upload PDF ──► Convex file storage ──► ingest action (Node): unpdf extracts text per page
                                            │  chunk (~1000 chars, 150 overlap, page-aware)
                                            │  Gemini embeddings (768-dim) in batches
                                            ▼
                                       chunks table + vector index
ask ──► embed question ──► vectorSearch (filtered to your selected docs) ──► top 8 passages
                                            ▼
                      Gemini 2.5 Flash answers with citations ──► messages table (live in UI)
Q&A ──► evenly sampled passages ──► Gemini returns JSON [{question, answer}] ──► qaSets table
```

## Getting started

### 1. Install

```bash
npm install
```

### 2. Environment variables (`.env.local`)

```
# Convex (filled in by `npx convex dev` on first run)
CONVEX_DEPLOYMENT=dev:your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
```

### 3. Convex deployment variables

These live on the Convex deployment (not in `.env.local`) because the backend uses them.

```bash
# Clerk issuer so Convex can verify session tokens (Clerk dashboard → API keys → Frontend API URL)
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev

# Gemini API key (https://aistudio.google.com/apikey). The free tier is enough for personal use.
npx convex env set GEMINI_API_KEY your-key
```

Optional overrides: `GEMINI_CHAT_MODEL` (default `gemini-2.5-flash`) and `GEMINI_EMBED_MODEL` (default `gemini-embedding-001`). If you change the embedding model, keep `EMBEDDING_DIMENSIONS` in `convex/schema.js` in sync and re-upload documents.

### 4. Run

```bash
npx convex dev
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/
  page.js                    Landing page
  (auth)/sign-in, sign-up    Clerk auth pages
  dashboard/page.js          Documents: upload zone + document cards
  dashboard/ask/             Ask your documents (chat with citations)
  dashboard/qa/              Generate and browse Q&A sets; qa/[setId] = flashcards
  dashboard/notes/           Quick notes board; notes/[noteId] = editor
components/
  upload-zone, document-card, document-picker, chat-panel, qa-flashcards, markdown
  note-card, note-editor, nav-tabs, app-header, theme-toggle, user-sync, ui/*
convex/
  schema.js                  users, documents, chunks (vector index), messages, qaSets, notes
  documents.js               upload URL, create (schedules ingest), list, rename, reprocess, remove
  ingest.js                  Node action: PDF → text → chunks → embeddings
  chunking.js                Page-aware text chunker (pure, unit-testable)
  chat.js                    ask action (vector search + Gemini), message history
  qa.js                      generate action, sets CRUD
  gemini.js                  Minimal Gemini REST client with retries
  users.js, notes.js, auth.config.js
provider.js                  Convex client wired to Clerk auth
proxy.js                     Route protection
```

## Limits and notes

- Scanned (image-only) PDFs have no extractable text and are marked as failed. OCR is not included yet.
- Very large PDFs are capped at 1,500 passages (roughly 2 million characters).
- **Gemini free tier:** embeddings are limited to about 100 passages per minute and 1,000 per day, and every passage in a batch counts. Indexing therefore runs as a background job that embeds 50 passages every 30 seconds and waits out 429s (`convex/embeddings.js`); the document card shows "Indexing passages 150/400" while it works. A 300-page textbook is roughly 600–800 passages, so expect a few minutes and keep the daily cap in mind. Answers and Q&A generation use Gemini 2.5 Flash, which has its own (more generous) free-tier limits.

## Deploying

1. `npx convex deploy` to create a production Convex deployment, and set `CLERK_JWT_ISSUER_DOMAIN` and `GEMINI_API_KEY` on it too.
2. Deploy the Next.js app (e.g. Vercel) with the same `.env.local` variables, pointing `NEXT_PUBLIC_CONVEX_URL` at the production deployment and using your Clerk production keys.
