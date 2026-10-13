"use client";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export function Markdown({ children, className }) {
  return (
    <div className={cn("markdown", className)}>
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
