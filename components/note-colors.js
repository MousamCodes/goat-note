// Tailwind classes for each note colour. Keys must match NOTE_COLORS in convex/schema.js.
export const NOTE_COLOR_STYLES = {
  default: {
    label: "Default",
    card: "bg-card",
    swatch: "bg-zinc-200 dark:bg-zinc-600",
  },
  yellow: {
    label: "Yellow",
    card: "bg-amber-50 dark:bg-amber-950/40",
    swatch: "bg-amber-300",
  },
  green: {
    label: "Green",
    card: "bg-emerald-50 dark:bg-emerald-950/40",
    swatch: "bg-emerald-300",
  },
  blue: {
    label: "Blue",
    card: "bg-sky-50 dark:bg-sky-950/40",
    swatch: "bg-sky-300",
  },
  pink: {
    label: "Pink",
    card: "bg-pink-50 dark:bg-pink-950/40",
    swatch: "bg-pink-300",
  },
  purple: {
    label: "Purple",
    card: "bg-violet-50 dark:bg-violet-950/40",
    swatch: "bg-violet-300",
  },
};

export function noteCardClass(color) {
  return (NOTE_COLOR_STYLES[color] ?? NOTE_COLOR_STYLES.default).card;
}
