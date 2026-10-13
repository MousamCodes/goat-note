import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-muted/40 px-4 py-10">
      <Link href="/" aria-label="Back to home">
        <Logo />
      </Link>
      {children}
    </div>
  );
}
