import { clerkMiddleware } from "@clerk/nextjs/server";

// Routes anyone can open without signing in. Everything else requires a session.
// (The dashboard layout also checks auth server-side, as Clerk recommends.)
const PUBLIC_ROUTES = [/^\/$/, /^\/sign-in(\/.*)?$/, /^\/sign-up(\/.*)?$/];

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_ROUTES.some((re) => re.test(pathname));
  if (!isPublic) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|webp|png|jpg|jpeg|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
