"use client";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Multi-select of the user's documents.
 * documents: all docs; selected: array of ids; onChange(ids).
 */
export function DocumentPicker({ documents, selected, onChange, label = "Documents" }) {
  const ready = documents.filter((d) => d.status === "ready");
  const processing = documents.filter((d) => d.status === "processing");
  const selectedSet = new Set(selected);

  const toggle = (id) => {
    const next = new Set(selectedSet);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange([...next]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label} · {selectedSet.size}/{ready.length}
        </span>
        {ready.length > 1 && (
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => onChange(ready.map((d) => d._id))}
            >
              All
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => onChange([])}
            >
              None
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {ready.map((d) => {
          const on = selectedSet.has(d._id);
          return (
            <button
              key={d._id}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => toggle(d._id)}
              className={cn(
                "inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                on
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              )}
            >
              {on && <Check className="size-3.5 shrink-0" />}
              <span className="truncate">{d.title}</span>
            </button>
          );
        })}
        {processing.map((d) => (
          <span
            key={d._id}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1 text-sm text-muted-foreground"
          >
            <Loader2 className="size-3.5 animate-spin" />
            <span className="truncate">{d.title}</span>
          </span>
        ))}
        {ready.length === 0 && processing.length === 0 && (
          <span className="text-sm text-muted-foreground">No documents yet.</span>
        )}
      </div>
    </div>
  );
}
