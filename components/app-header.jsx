import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Logo } from "@/components/logo";
import { NavTabs } from "@/components/nav-tabs";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/dashboard" aria-label="Documents">
          <Logo />
        </Link>
        <NavTabs />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserButton appearance={{ elements: { avatarBox: "size-8" } }} />
        </div>
      </div>
    </header>
  );
}
