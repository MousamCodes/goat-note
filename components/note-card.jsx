"use client";
import Link from "next/link";
import { useMutation } from "convex/react";
import { Pin, PinOff } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { cn, formatRelativeTime } from "@/lib/utils";
import { noteCardClass } from "@/components/note-colors";

export function NoteCard({ note }) {
  const togglePin = useMutation(api.notes.togglePin);
  const title = note.title.trim() || "Untitled";
  const preview = note.content.trim();

  const onPin = (e) => {
    e.preventDefault();
    e.stopPropagation();
    togglePin({ id: note._id });
  };

  return (
    <Link
      href={`/dashboard/notes/${note._id}`}
      className={cn(
        "group relative flex h-44 flex-col rounded-2xl border border-border p-4 shadow-xs transition-all outline-none",
        "hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50",
        noteCardClass(note.color)
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className={cn("line-clamp-1 font-medium", !note.title.trim() && "text-muted-foreground")}>
          {title}
        </h3>
        <button
          type="button"
          onClick={onPin}
          aria-label={note.pinned ? "Unpin note" : "Pin note"}
          title={note.pinned ? "Unpin" : "Pin"}
          className={cn(
            "shrink-0 rounded-md p-1 text-muted-foreground transition-opacity hover:bg-foreground/10 hover:text-foreground",
            note.pinned ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          )}
        >
          {note.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
        </button>
      </div>
      <p className="mt-1.5 line-clamp-4 flex-1 whitespace-pre-wrap text-sm text-muted-foreground">
        {preview || "No content yet"}
      </p>
      <p className="mt-2 text-xs text-muted-foreground/80">
        {formatRelativeTime(note.updatedAt)}
      </p>
    </Link>
  );
}
