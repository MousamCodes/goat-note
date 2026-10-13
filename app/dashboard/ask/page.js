"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { FileUp } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/components/chat-panel";
import { DocumentPicker } from "@/components/document-picker";
import { EmptyState } from "@/components/empty-state";

export default function AskPage() {
  return (
    <Suspense fallback={null}>
      <AskPageInner />
    </Suspense>
  );
}

function AskPageInner() {
  const searchParams = useSearchParams();
  const focusDoc = searchParams.get("doc");

  const documents = useQuery(api.documents.list);
  const messages = useQuery(api.chat.list);
  const ask = useAction(api.chat.ask);
  const clear = useMutation(api.chat.clear);

  // null = "follow all ready documents"; an array = the user's own selection.
  const [manual, setManual] = useState(focusDoc ? [focusDoc] : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const ready = (documents ?? []).filter((d) => d.status === "ready");
  const readyIds = ready.map((d) => d._id);
  const selected = manual ? manual.filter((id) => readyIds.includes(id)) : readyIds;

  // If the focused document is unknown or not ready, fall back to all.
  useEffect(() => {
    if (focusDoc && documents && !readyIds.includes(focusDoc)) setManual(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusDoc, documents === undefined]);

  const send = async (question) => {
    setBusy(true);
    setError(null);
    try {
      await ask({ question, documentIds: selected });
    } catch (err) {
      // The failed turn is also recorded in the conversation by the server.
      setError(err?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  if (documents && documents.length === 0) {
    return (
      <EmptyState
        title="Upload a PDF first"
        text="Once a document has been indexed you can ask questions about it here."
        action={
          <Button render={<Link href="/dashboard" />}>
            <FileUp /> Upload documents
          </Button>
        }
      />
    );
  }

  const noSelection = selected.length === 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ask your documents</h1>
        <p className="text-sm text-muted-foreground">
          Questions are answered only from the selected PDFs, with page citations.
        </p>
      </div>

      {documents && (
        <DocumentPicker
          documents={documents}
          selected={selected}
          onChange={setManual}
          label="Asking across"
        />
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <ChatPanel
        messages={messages}
        onSend={send}
        busy={busy}
        disabled={noSelection}
        disabledReason={
          ready.length === 0
            ? "Your documents are still being indexed. This usually takes under a minute."
            : "Select at least one document above."
        }
        onClear={() => clear()}
      />
    </div>
  );
}
