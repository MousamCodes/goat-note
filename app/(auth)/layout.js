import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }) {
  return (
    <div className="landing-bg flex min-h-dvh flex-col">
      {/* Same backdrop as the landing page */}
      <div className="landing-glow left-[-10%] top-[-10%] h-[28rem] w-[28rem] bg-amber-300" />
      <div className="landing-glow right-[-8%] top-[20%] h-[26rem] w-[26rem] bg-violet-400" />
      <div className="landing-glow left-[30%] bottom-[-10%] h-[22rem] w-[30rem] bg-sky-300" />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" aria-label="Back to home">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
        {children}
      </main>
    </div>
  );
}
