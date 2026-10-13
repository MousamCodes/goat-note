import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { AppHeader } from "@/components/app-header";
import { UserSync } from "@/components/user-sync";

export const metadata = { title: "My notes" };

export default async function DashboardLayout({ children }) {
  // Server-side guard in addition to proxy.js, so the dashboard is never
  // reachable without a session even if route matching changes.
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="flex min-h-dvh flex-col">
      <UserSync />
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
