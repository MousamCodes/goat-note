import { cn } from "@/lib/utils";

export function Logo({ className }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span
        aria-hidden="true"
        className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-base text-primary-foreground"
      >
        🐐
      </span>
      <span className="text-lg">Goat Note</span>
    </span>
  );
}
