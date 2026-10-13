"use client";
import Link from "next/link";
import { useQuery } from "convex/react";
import { MessageSquareText, Sparkles } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/upload-zone";
import { DocumentCard } from "@/components/document-card";

export default function DocumentsPage() {
  const documents = useQuery(api.documents.list);
  const loading = documents === undefined;
  const total = documents?.length ?? 0;
  const ready = documents?.filter((d) => d.status === "ready").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your documents</h1>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Loading…"
              : total === 0
                ? "Upload lecture notes, textbooks or past papers as PDF."
                : `${total} ${total === 1 ? "PDF" : "PDFs"} · ${ready} ready to ask`}
          </p>
        </div>
        {ready > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" render={<Link href="/dashboard/qa" />}>
              <Sparkles /> Generate Q&A
            </Button>
            <Button render={<Link href="/dashboard/ask" />}>
              <MessageSquareText /> Ask a question
            </Button>
          </div>
        )}
      </div>

      <UploadZone />

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl border border-border bg-muted/60" />
          ))}
        </div>
      )}

      {!loading && total > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <DocumentCard key={doc._id} doc={doc} />
          ))}
        </div>
      )}
    </div>
  );
}
