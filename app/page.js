import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { ArrowRight, FileUp, MessageSquareText, NotebookPen, Quote, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  {
    icon: FileUp,
    title: "Upload all your PDFs",
    text: "Lecture slides, textbooks, past papers. Drop in several at once; each one is read and indexed in under a minute.",
  },
  {
    icon: MessageSquareText,
    title: "Ask across documents",
    text: "Ask in plain English and get a tutor-style answer built only from your material, with page citations for every claim.",
  },
  {
    icon: Sparkles,
    title: "Generate practice Q&A",
    text: "Turn any set of documents into exam-style questions. Reveal answers one by one and track what you already know.",
  },
  {
    icon: NotebookPen,
    title: "Quick notes on the side",
    text: "Jot down what you learn in autosaving notes you can pin, colour and search.",
  },
];

const steps = [
  { n: "1", title: "Upload", text: "Drag your course PDFs into Goat Note." },
  { n: "2", title: "Ask", text: "Question anything. Answers point to the exact page." },
  { n: "3", title: "Revise", text: "Generate Q&A sets and quiz yourself before the exam." },
];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Show when="signed-out">
            <Button variant="ghost" render={<Link href="/sign-in" />}>
              Sign in
            </Button>
            <Button render={<Link href="/sign-up" />}>Get started</Button>
          </Show>
          <Show when="signed-in">
            <Button render={<Link href="/dashboard" />}>
              Open my documents <ArrowRight />
            </Button>
          </Show>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-14 text-center sm:pt-24">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Quote className="size-3.5" /> Every answer cites the page it came from
          </p>
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Chat with your college PDFs. Revise with generated Q&A.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            Goat Note turns your lecture notes and textbooks into a study partner. Upload multiple
            PDFs, ask questions across all of them, and get practice questions for the exam.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Show when="signed-out">
              <Button size="lg" render={<Link href="/sign-up" />}>
                Start for free <ArrowRight />
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/sign-in" />}>
                I already have an account
              </Button>
            </Show>
            <Show when="signed-in">
              <Button size="lg" render={<Link href="/dashboard" />}>
                Go to my documents <ArrowRight />
              </Button>
            </Show>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-16 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-5 text-left shadow-xs">
              <div className="mb-3 inline-flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Icon className="size-4" />
              </div>
              <h3 className="font-medium">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-4 rounded-2xl border border-border bg-muted/40 p-6 sm:grid-cols-3 sm:p-8">
            {steps.map(({ n, title, text }) => (
              <div key={n} className="flex gap-3">
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {n}
                </span>
                <div>
                  <h3 className="font-medium">{title}</h3>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Built with Next.js, Convex, Clerk and Gemini.
      </footer>
    </div>
  );
}
