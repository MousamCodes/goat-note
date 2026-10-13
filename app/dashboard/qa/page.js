"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { FileUp, Layers, Loader2, Sparkles, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DocumentPicker } from "@/components/document-picker";
import { EmptyState } from "@/components/empty-state";
import { formatRelativeTime } from "@/lib/utils";

const COUNTS = [5, 10, 15, 20];

export default function QaPage() {
  const router = useRouter();
  const documents = useQuery(api.documents.list);
  const sets = useQuery(api.qa.list);
  const generate = useAction(api.qa.generate);
  const remove = useMutation(api.qa.remove);

  const [manual, setManual] = useState(null);
  const [count, setCount] = useState(10);
  const [focus, setFocus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const ready = (documents ?? []).filter((d) => d.status === "ready");
  const readyIds = ready.map((d) => d._id);
  const selected = manual ? manual.filter((id) => readyIds.includes(id)) : readyIds;

  const onGenerate = async () => {
    setBusy(true);
    setError(null);
    try {
      const id = await generate({ documentIds: selected, count, focus: focus || undefined });
      router.push(`/dashboard/qa/${id}`);
    } catch (err) {
      setError(err?.message || "Generation failed");
      setBusy(false);
    }
  };

  if (documents && documents.length === 0) {
    return (
      <EmptyState
        title="Upload a PDF first"
        text="Q&A sets are generated from your indexed documents."
        action={
          <Button render={<Link href="/dashboard" />}>
            <FileUp /> Upload documents
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Practice Q&A</h1>
        <p className="text-sm text-muted-foreground">
          Turn your PDFs into exam-style questions with answers you can reveal one by one.
        </p>
      </div>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-6">
        {documents && (
          <DocumentPicker documents={documents} selected={selected} onChange={setManual} label="Generate from" />
        )}
        <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-end">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Questions
            </label>
            <div className="flex gap-1">
              {COUNTS.map((n) => (
                <Button
                  key={n}
                  type="button"
                  size="sm"
                  variant={count === n ? "default" : "outline"}
                  onClick={() => setCount(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label
              htmlFor="qa-focus"
              className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Focus (optional)
            </label>
            <Input
              id="qa-focus"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="e.g. chapter 3, definitions only, numerical problems"
              maxLength={200}
            />
          </div>
          <Button onClick={onGenerate} disabled={busy || selected.length === 0} size="lg">
            {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {busy ? "Generating…" : "Generate"}
          </Button>
        </div>
        {busy && (
          <p className="text-xs text-muted-foreground">
            Reading the material and writing questions. This usually takes 10–30 seconds.
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Your sets
        </h2>
        {sets === undefined && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-muted/60" />
            ))}
          </div>
        )}
        {sets && sets.length === 0 && (
          <p className="text-sm text-muted-foreground">No sets yet. Generate your first one above.</p>
        )}
        {sets && sets.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sets.map((set) => (
              <div
                key={set._id}
                className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-xs transition-shadow hover:shadow-md"
              >
                <Link href={`/dashboard/qa/${set._id}`} className="flex-1 outline-none">
                  <h3 className="line-clamp-2 font-medium">{set.title}</h3>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    {set.documentTitles.join(" · ")}
                  </p>
                </Link>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Layers className="size-3.5" /> {set.count} questions ·{" "}
                    {formatRelativeTime(set._creationTime)}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove({ id: set._id })}
                    aria-label="Delete set"
                    title="Delete"
                    className="rounded p-1 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
