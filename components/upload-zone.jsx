"use client";
import { useCallback, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { CheckCircle2, FileUp, Loader2, XCircle } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { cn, formatBytes } from "@/lib/utils";

const MAX_BYTES = 25 * 1024 * 1024;
const PARALLEL = 3;

function isPdf(file) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

export function UploadZone() {
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const createDocument = useMutation(api.documents.create);
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState([]); // { id, name, size, status, error }

  const patch = (id, fields) =>
    setUploads((list) => list.map((u) => (u.id === id ? { ...u, ...fields } : u)));

  const uploadOne = useCallback(
    async (entry, file) => {
      try {
        const url = await generateUploadUrl();
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/pdf" },
          body: file,
        });
        if (!res.ok) throw new Error(`Upload failed (${res.status})`);
        const { storageId } = await res.json();
        await createDocument({ storageId, fileName: file.name, size: file.size });
        patch(entry.id, { status: "done" });
        // The document card now shows progress; drop the upload row shortly after.
        setTimeout(() => setUploads((list) => list.filter((u) => u.id !== entry.id)), 2500);
      } catch (err) {
        patch(entry.id, { status: "error", error: err?.message || "Upload failed" });
      }
    },
    [generateUploadUrl, createDocument]
  );

  const handleFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList ?? []);
      if (files.length === 0) return;

      const entries = files.map((file) => {
        const entry = { id: crypto.randomUUID(), name: file.name, size: file.size, status: "queued" };
        if (!isPdf(file)) return { ...entry, status: "error", error: "Only PDF files are supported" };
        if (file.size > MAX_BYTES) return { ...entry, status: "error", error: "Larger than 25 MB" };
        return entry;
      });
      setUploads((list) => [...list, ...entries]);

      // Upload a few at a time so many files don't all hit the network at once.
      const queue = entries
        .map((entry, i) => ({ entry, file: files[i] }))
        .filter(({ entry }) => entry.status === "queued");
      const workers = Array.from({ length: Math.min(PARALLEL, queue.length) }, async () => {
        while (queue.length) {
          const { entry, file } = queue.shift();
          patch(entry.id, { status: "uploading" });
          await uploadOne(entry, file);
        }
      });
      await Promise.all(workers);
    },
    [uploadOne]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload PDF files"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors outline-none",
          "focus-visible:ring-3 focus-visible:ring-ring/50",
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-foreground/40 hover:bg-muted/40"
        )}
      >
        <div className="inline-flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <FileUp className="size-5" />
        </div>
        <p className="font-medium">Drop PDFs here, or click to choose</p>
        <p className="text-xs text-muted-foreground">
          Upload several at once · up to 25 MB each · text-based PDFs (not scans)
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {uploads.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border text-sm">
          {uploads.map((u) => (
            <li key={u.id} className="flex items-center gap-3 px-3 py-2">
              {u.status === "done" ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              ) : u.status === "error" ? (
                <XCircle className="size-4 shrink-0 text-destructive" />
              ) : (
                <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
              )}
              <span className="min-w-0 flex-1 truncate">{u.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {u.status === "error"
                  ? u.error
                  : u.status === "done"
                    ? "Uploaded"
                    : u.status === "uploading"
                      ? `Uploading · ${formatBytes(u.size)}`
                      : "Waiting"}
              </span>
              {u.status === "error" && (
                <button
                  type="button"
                  onClick={() => setUploads((list) => list.filter((x) => x.id !== u.id))}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Dismiss
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
