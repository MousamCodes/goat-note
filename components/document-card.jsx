"use client";
import { useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import {
  AlertCircle,
  Check,
  FileText,
  Loader2,
  MessageSquareText,
  Pencil,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBytes, formatRelativeTime } from "@/lib/utils";

export function DocumentCard({ doc }) {
  const rename = useMutation(api.documents.rename);
  const remove = useMutation(api.documents.remove);
  const reprocess = useMutation(api.documents.reprocess);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(doc.title);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const saveTitle = async () => {
    const clean = title.trim();
    if (clean && clean !== doc.title) await rename({ id: doc._id, title: clean });
    else setTitle(doc.title);
    setEditing(false);
  };

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <FileText className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveTitle();
              }}
              className="flex items-center gap-1"
            >
              <Input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && (setTitle(doc.title), setEditing(false))}
                aria-label="Document title"
                className="h-8"
              />
              <Button type="submit" size="icon-sm" variant="ghost" aria-label="Save title">
                <Check />
              </Button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              title="Rename"
              className="group flex max-w-full items-center gap-1.5 text-left font-medium"
            >
              <span className="truncate">{doc.title}</span>
              <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
          <p className="truncate text-xs text-muted-foreground" title={doc.fileName}>
            {doc.fileName} · {formatBytes(doc.size)}
          </p>
        </div>
      </div>

      <div className="mt-3 min-h-5 text-xs">
        <StatusLine doc={doc} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
        <span className="text-xs text-muted-foreground">
          Added {formatRelativeTime(doc._creationTime)}
        </span>
        <div className="flex items-center gap-1">
          {doc.status === "ready" && (
            <Button
              variant="ghost"
              size="sm"
              render={<Link href={`/dashboard/ask?doc=${doc._id}`} />}
            >
              <MessageSquareText /> Ask
            </Button>
          )}
          {doc.status === "error" && (
            <Button variant="ghost" size="sm" onClick={() => reprocess({ id: doc._id })}>
              <RotateCcw /> Retry
            </Button>
          )}
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <Button variant="destructive" size="xs" onClick={() => remove({ id: doc._id })}>
                Delete
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setConfirmDelete(false)}
                aria-label="Cancel"
              >
                <X />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete document"
              title="Delete"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusLine({ doc }) {
  if (doc.status === "processing") {
    const total = doc.chunkCount ?? 0;
    const done = doc.embeddedCount ?? 0;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return (
      <span className="block text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Loader2 className="size-3.5 animate-spin" />
          {total ? `Indexing passages ${done}/${total}` : "Reading the PDF…"}
        </span>
        {total > 0 && (
          <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </span>
        )}
      </span>
    );
  }
  if (doc.status === "error") {
    return (
      <span className="inline-flex items-start gap-1.5 text-destructive">
        <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
        <span className="line-clamp-2">{doc.error || "Processing failed"}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
      <Check className="size-3.5" /> Ready · {doc.pageCount ?? "?"} pages · {doc.chunkCount ?? 0} passages
    </span>
  );
}
