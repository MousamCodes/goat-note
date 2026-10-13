"use client";
import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Mirrors the signed-in Clerk user into the Convex `users` table.
 * Renders nothing. Runs once per session (and again if the profile changes).
 */
export function UserSync() {
  const { user, isLoaded } = useUser();
  const { isAuthenticated } = useConvexAuth();
  const syncUser = useMutation(api.users.sync);
  const lastSynced = useRef("");

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const userName = user?.fullName || user?.username || email.split("@")[0] || "User";
  const imageUrl = user?.imageUrl;

  useEffect(() => {
    if (!isLoaded || !user || !isAuthenticated || !email) return;
    const signature = `${user.id}|${email}|${userName}|${imageUrl ?? ""}`;
    if (lastSynced.current === signature) return;
    lastSynced.current = signature;
    syncUser({ email, userName, imageUrl }).catch((err) => {
      lastSynced.current = "";
      console.error("Failed to sync user profile", err);
    });
  }, [isLoaded, user, isAuthenticated, email, userName, imageUrl, syncUser]);

  return null;
}
