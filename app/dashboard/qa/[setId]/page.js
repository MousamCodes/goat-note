"use client";
import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { QaFlashcards } from "@/components/qa-flashcards";

export default function QaSetPage({ params }) {
  const { setId } = use(params);
  const set = useQuery(api.qa.get, { id: setId });

  if (set === undefined) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-5 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  if (set === null) {
    return (
      <EmptyState
        title="Q&A set not found"
        text="This set does not exist or you do not have access to it."
        action={
          <Button variant="outline" render={<Link href="/dashboard/qa" />}>
            <ArrowLeft /> Back to Q&A
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Button variant="ghost" size="sm" render={<Link href="/dashboard/qa" />}>
        <ArrowLeft /> All sets
      </Button>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{set.title}</h1>
        <p className="text-sm text-muted-foreground">
          {set.items.length} questions · from {set.documentTitles.join(", ")}
        </p>
      </div>
      <QaFlashcards key={set._id} items={set.items} />
    </div>
  );
}
