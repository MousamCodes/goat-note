"use client";
import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { NoteEditor } from "@/components/note-editor";
import { EmptyState } from "@/components/empty-state";

export default function NotePage({ params }) {
  const { noteId } = use(params);
  const note = useQuery(api.notes.get, { id: noteId });

  if (note === undefined) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-5 w-24 animate-pulse rounded bg-muted" />
        <div className="h-10 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (note === null) {
    return (
      <EmptyState
        title="Note not found"
        text="This note does not exist or you do not have access to it."
        action={
          <Button variant="outline" render={<Link href="/dashboard/notes" />}>
            <ArrowLeft /> Back to notes
          </Button>
        }
      />
    );
  }

  return <NoteEditor key={note._id} note={note} />;
}
