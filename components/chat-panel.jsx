"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2, SendHorizonal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Summarize the key points of these documents",
  "What are the most important definitions I should memorize?",
  "Explain the hardest concept here in simple terms",
  "What topics are likely to come up in an exam?",
];

export function ChatPanel({ messages, onSend, busy, disabled, disabledReason, onClear }) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages?.length, busy]);

  const submit = async (text) => {
    const q = (text ?? draft).trim();
    if (!q || busy || disabled) return;
    setDraft("");
    await onSend(q);
    inputRef.current?.focus();
  };

  const loading = messages === undefined;

  return (
    <div className="flex min-h-[60vh] flex-col rounded-2xl border border-border bg-card shadow-xs">
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {loading && (
          <div className="space-y-3">
            <div className="ml-auto h-10 w-1/2 animate-pulse rounded-2xl bg-muted" />
            <div className="h-24 w-3/4 animate-pulse rounded-2xl bg-muted" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 py-10 text-center">
            <p className="max-w-md text-sm text-muted-foreground">
              Ask anything about the selected documents. Answers cite the page they came from.
            </p>
            <div className="flex max-w-xl flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={disabled || busy}
                  onClick={() => submit(s)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && messages.map((m) => <MessageBubble key={m._id} message={m} />)}

        {busy && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Reading your documents…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="border-t border-border p-3"
      >
        {disabled && disabledReason && (
          <p className="mb-2 text-xs text-muted-foreground">{disabledReason}</p>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={disabled ? "Upload a document to start asking" : "Ask a question… (Enter to send, Shift+Enter for a new line)"}
            aria-label="Your question"
            rows={1}
            disabled={disabled}
            className="max-h-40 min-h-10 resize-none"
          />
          <Button type="submit" size="icon-lg" disabled={disabled || busy || !draft.trim()} aria-label="Send">
            {busy ? <Loader2 className="animate-spin" /> : <SendHorizonal />}
          </Button>
          {messages?.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              onClick={onClear}
              disabled={busy}
              aria-label="Clear conversation"
              title="Clear conversation"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[90%] rounded-2xl px-4 py-3 text-sm sm:max-w-[80%]",
          isUser
            ? "bg-primary text-primary-foreground"
            : message.error
              ? "border border-destructive/30 bg-destructive/5 text-destructive"
              : "bg-muted"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <Markdown>{message.content}</Markdown>
        )}
        {message.sources?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/60 pt-2">
            {message.sources.map((s, i) => (
              <span
                key={`${s.documentId}-${s.page}-${i}`}
                title={s.snippet}
                className="inline-flex max-w-full items-center gap-1 rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground"
              >
                <span className="truncate">{s.title}</span>
                <span className="shrink-0">· p.{s.page}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
