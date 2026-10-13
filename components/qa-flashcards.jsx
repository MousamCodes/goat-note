"use client";
import { useState } from "react";
import { Check, Eye, EyeOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";

export function QaFlashcards({ items }) {
  const [revealed, setRevealed] = useState(() => new Set());
  const [known, setKnown] = useState(() => new Set());

  const allShown = revealed.size === items.length;
  const toggleSet = (set, i) => {
    const next = new Set(set);
    next.has(i) ? next.delete(i) : next.add(i);
    return next;
  };

  const progress = items.length ? Math.round((known.size / items.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
        <div className="min-w-40 flex-1">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Marked as known</span>
            <span>
              {known.size}/{items.length}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setRevealed(allShown ? new Set() : new Set(items.map((_, i) => i)))
            }
          >
            {allShown ? <EyeOff /> : <Eye />}
            {allShown ? "Hide answers" : "Show all"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setKnown(new Set());
              setRevealed(new Set());
            }}
            disabled={known.size === 0 && revealed.size === 0}
          >
            <RotateCcw /> Reset
          </Button>
        </div>
      </div>

      <ol className="space-y-3">
        {items.map((item, i) => {
          const open = revealed.has(i);
          const done = known.has(i);
          return (
            <li
              key={i}
              className={cn(
                "rounded-2xl border p-4 shadow-xs transition-colors",
                done ? "border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/20" : "border-border bg-card"
              )}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.question}</p>
                  {open && (
                    <div className="mt-2 rounded-xl bg-muted/60 p-3 text-sm">
                      <Markdown>{item.answer}</Markdown>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setRevealed((s) => toggleSet(s, i))}
                    >
                      {open ? <EyeOff /> : <Eye />}
                      {open ? "Hide answer" : "Reveal answer"}
                    </Button>
                    <Button
                      variant={done ? "secondary" : "ghost"}
                      size="xs"
                      onClick={() => setKnown((s) => toggleSet(s, i))}
                    >
                      <Check /> {done ? "Known" : "Mark as known"}
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
