"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, MessageSquareText, NotebookPen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", label: "Documents", icon: FileText, exact: true },
  { href: "/dashboard/ask", label: "Ask", icon: MessageSquareText },
  { href: "/dashboard/qa", label: "Q&A", icon: Sparkles },
  { href: "/dashboard/notes", label: "Notes", icon: NotebookPen },
];

export function NavTabs({ className }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Sections" className={cn("flex items-center gap-1", className)}>
      {TABS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
