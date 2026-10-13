"use client";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function DashboardError({ error, reset }) {
  return (
    <EmptyState
      title="Something went wrong"
      text={error?.message || "An unexpected error occurred while loading your notes."}
      action={
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
      }
    />
  );
}
