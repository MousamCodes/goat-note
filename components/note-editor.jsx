"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { ArrowLeft, Check, Loader2, Pin, PinOff, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, countWords, formatRelativeTime } from "@/lib/utils";
import { NOTE_COLOR_STYLES, noteCardClass } from "@/components/note-colors";

const AUTOSAVE_DELAY_MS = 600;

export function NoteEditor({ note }) {
  const router = useRouter();
  const updateNote = useMutation(api.notes.update);
  const togglePin = useMutation(api.notes.togglePin);
  const removeNote = useMutation(api.notes.remove);

  // Local draft; the parent remounts this component per note id (key={note._id}).
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [status, setStatus] = useState("saved"); // "saved" | "dirty" | "saving" | "error"
  const [confirmDelete, setConfirmDelete] = useState(false);
  const titleRef = useRef(null);
  const timer = useRef(null);
  const latest = useRef({ title: note.title, content: note.content });

  useEffect(() => {
    if (!note.title && !note.content) titleRef.current?.focus();
  }, [note.title, note.content]);

  const save = useCallback(async () => {
    const draft = latest.current;
    setStatus("saving");
    try {
      await updateNote({ id: note._id, title: draft.title, content: draft.content });
      // Only mark saved if nothing changed while the request was in flight.
      setStatus(latest.current === draft ? "saved" : "dirty");
    } catch (err) {
      console.error("Failed to save note", err);
      setStatus("error");
    }
  }, [note._id, updateNote]);

  const scheduleSave = useCallback(
    (next) => {
      latest.current = next;
      setStatus("dirty");
      clearTimeout(timer.current);
      timer.current = setTimeout(save, AUTOSAVE_DELAY_MS);
    },
    [save]
  );

  // Flush pending edits when leaving the page.
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        const draft = latest.current;
        if (draft.title !== note.title || draft.content !== note.content) {
          updateNote({ id: note._id, title: draft.title, content: draft.content }).catch(() => {});
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onTitle = (e) => {
    setTitle(e.target.value);
    scheduleSave({ ...latest.current, title: e.target.value });
  };
  const onContent = (e) => {
    setContent(e.target.value);
    scheduleSave({ ...latest.current, content: e.target.value });
  };

  const onDelete = async () => {
    clearTimeout(timer.current);
    latest.current = { title: note.title, content: note.content };
    await removeNote({ id: note._id });
    router.replace("/dashboard/notes");
  };

  const words = countWords(content);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" render={<Link href="/dashboard/notes" />}>
          <ArrowLeft /> My notes
        </Button>
        <div className="flex items-center gap-1">
          <SaveStatus status={status} updatedAt={note.updatedAt} onRetry={save} />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => togglePin({ id: note._id })}
            aria-label={note.pinned ? "Unpin note" : "Pin note"}
            title={note.pinned ? "Unpin" : "Pin"}
          >
            {note.pinned ? <PinOff /> : <Pin />}
          </Button>
          {confirmDelete ? (
            <div className="flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/5 px-1 py-0.5">
              <span className="px-1 text-xs text-destructive">Delete this note?</span>
              <Button variant="destructive" size="xs" onClick={onDelete}>
                Delete
              </Button>
              <Button variant="ghost" size="xs" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete note"
              title="Delete"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </div>

      <div className={cn("rounded-2xl border border-border p-5 shadow-xs sm:p-7", noteCardClass(note.color))}>
        <input
          ref={titleRef}
          value={title}
          onChange={onTitle}
          placeholder="Untitled"
          aria-label="Note title"
          maxLength={200}
          className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/60 sm:text-3xl"
        />
        <Textarea
          value={content}
          onChange={onContent}
          placeholder="Start writing…"
          aria-label="Note content"
          className="mt-4 min-h-[50vh] resize-y border-0 bg-transparent p-0 text-base leading-7 shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4 text-xs text-muted-foreground">
          <ColorPicker
            value={note.color}
            onChange={(color) => updateNote({ id: note._id, color })}
          />
          <span>
            {words} {words === 1 ? "word" : "words"} · {content.length} characters
          </span>
        </div>
      </div>
    </div>
  );
}

function SaveStatus({ status, updatedAt, onRetry }) {
  if (status === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="mr-1 text-xs text-destructive underline-offset-2 hover:underline"
      >
        Save failed. Retry
      </button>
    );
  }
  return (
    <span className="mr-1 inline-flex items-center gap-1 text-xs text-muted-foreground" aria-live="polite">
      {status === "saving" || status === "dirty" ? (
        <>
          <Loader2 className="size-3 animate-spin" /> Saving
        </>
      ) : (
        <>
          <Check className="size-3" /> Saved {formatRelativeTime(updatedAt)}
        </>
      )}
    </span>
  );
}

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Note colour">
      {Object.entries(NOTE_COLOR_STYLES).map(([key, { label, swatch }]) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          aria-label={label}
          title={label}
          onClick={() => onChange(key)}
          className={cn(
            "size-5 rounded-full border border-black/10 transition-transform hover:scale-110 dark:border-white/20",
            swatch,
            value === key && "ring-2 ring-ring ring-offset-2 ring-offset-background"
          )}
        />
      ))}
    </div>
  );
}
