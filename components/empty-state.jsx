import { NotebookPen } from "lucide-react";

export function EmptyState({ title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
      <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <NotebookPen className="size-5" />
      </div>
      <h2 className="text-lg font-medium">{title}</h2>
      {text && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
