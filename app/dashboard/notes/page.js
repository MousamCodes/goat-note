"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Plus, Search, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NoteCard } from "@/components/note-card";
import { EmptyState } from "@/components/empty-state";

function matches(note, term) {
  if (!term) return true;
  const t = term.toLowerCase();
  return note.title.toLowerCase().includes(t) || note.content.toLowerCase().includes(t);
}

export default function NotesPage() {
  const router = useRouter();
  const notes = useQuery(api.notes.list);
  const createNote = useMutation(api.notes.create);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const { pinned, others } = useMemo(() => {
    const visible = (notes ?? []).filter((n) => matches(n, search.trim()));
    return {
      pinned: visible.filter((n) => n.pinned),
      others: visible.filter((n) => !n.pinned),
    };
  }, [notes, search]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const id = await createNote({});
      router.push(`/dashboard/notes/${id}`);
    } finally {
      setCreating(false);
    }
  };

  const loading = notes === undefined;
  const total = notes?.length ?? 0;
  const nothingMatches = !loading && total > 0 && pinned.length + others.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quick notes</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${total} ${total === 1 ? "note" : "notes"} · autosaved`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes"
              aria-label="Search notes"
              className="pl-8 pr-8"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <Button onClick={handleCreate} disabled={creating}>
            <Plus /> New note
          </Button>
        </div>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-border bg-muted/60" />
          ))}
        </div>
      )}

      {!loading && total === 0 && (
        <EmptyState
          title="No notes yet"
          text="Jot down anything while you study. Notes save automatically as you type."
          action={
            <Button onClick={handleCreate} disabled={creating}>
              <Plus /> Create a note
            </Button>
          }
        />
      )}

      {nothingMatches && (
        <EmptyState
          title="Nothing matches"
          text={`No notes contain "${search.trim()}".`}
          action={
            <Button variant="outline" onClick={() => setSearch("")}>
              Clear search
            </Button>
          }
        />
      )}

      {pinned.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pinned
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pinned.map((note) => (
              <NoteCard key={note._id} note={note} />
            ))}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="space-y-3">
          {pinned.length > 0 && (
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Others
            </h2>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((note) => (
              <NoteCard key={note._id} note={note} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
