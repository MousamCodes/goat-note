import Link from "next/link";
import { Show } from "@clerk/nextjs";
import {
  ArrowRight,
  Check,
  FileText,
  FileUp,
  MessageSquareText,
  NotebookPen,
  Quote,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { SocialLinks } from "@/components/social-links";

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
    <div className="landing-bg flex min-h-dvh flex-col">
      {/* Colour glows behind the hero */}
      <div className="landing-glow left-[-10%] top-[-10%] h-[28rem] w-[28rem] bg-amber-300" />
      <div className="landing-glow right-[-8%] top-[8%] h-[26rem] w-[26rem] bg-violet-400" />
      <div className="landing-glow left-[35%] top-[30%] h-[22rem] w-[30rem] bg-sky-300" />

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
        <section className="mx-auto max-w-6xl px-6 pb-10 pt-14 text-center sm:pt-20">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
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

        {/* Product preview */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="landing-float mx-auto max-w-2xl overflow-hidden rounded-2xl border border-border bg-card/85 shadow-xl shadow-black/5 backdrop-blur">
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 text-xs">
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                Asking across
              </span>
              {["Lecture Chapter 02", "Lecture PPT ch 03", "Textbook ch. 5"].map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-primary-foreground"
                >
                  <Check className="size-3" /> {d}
                </span>
              ))}
            </div>
            <div className="space-y-4 p-4 text-left text-sm sm:p-5">
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground">
                  What is the difference between a star schema and a snowflake schema?
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[92%] rounded-2xl bg-muted px-4 py-3">
                  <p>
                    A <strong>star schema</strong> keeps one central fact table joined directly to
                    denormalized dimension tables, so queries need few joins [1]. A{" "}
                    <strong>snowflake schema</strong> normalizes those dimensions into sub-tables
                    (for example Product → Category, Store → City → State), which reduces redundancy
                    but adds joins [2].
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/60 pt-2">
                    {[
                      ["Lecture Chapter 02", 5],
                      ["Lecture Chapter 02", 7],
                      ["Textbook ch. 5", 112],
                    ].map(([t, p]) => (
                      <span
                        key={`${t}-${p}`}
                        className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        <FileText className="size-3" /> {t} · p.{p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-16 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card/80 p-5 text-left shadow-xs backdrop-blur"
            >
              <div className="mb-3 inline-flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Icon className="size-4" />
              </div>
              <h3 className="font-medium">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-4 rounded-2xl border border-border bg-muted/50 p-6 backdrop-blur sm:grid-cols-3 sm:p-8">
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

      <footer className="border-t border-border bg-background/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>
            Built by{" "}
            <a
              href="https://github.com/MousamCodes"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Mousam Podder
            </a>{" "}
            with Next.js, Convex, Clerk and Gemini.
          </p>
          <SocialLinks />
        </div>
      </footer>
    </div>
  );
}
