"use client";
import { useCallback, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithAuth } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);

/**
 * Bridges Clerk auth into Convex using Clerk's default session token.
 * Convex validates it with the customJwt provider in convex/auth.config.js,
 * so no Clerk JWT template is required.
 */
function useClerkAuthForConvex() {
  const { isLoaded, isSignedIn, getToken, orgId, orgRole, userId } = useAuth();

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }) => {
      try {
        return await getToken({ skipCache: forceRefreshToken });
      } catch {
        return null;
      }
    },
    // Re-create when the session identity changes so Convex refetches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getToken, userId, orgId, orgRole]
  );

  return useMemo(
    () => ({
      isLoading: !isLoaded,
      isAuthenticated: isSignedIn ?? false,
      fetchAccessToken,
    }),
    [isLoaded, isSignedIn, fetchAccessToken]
  );
}

export default function Provider({ children }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useClerkAuthForConvex}>
      {children}
    </ConvexProviderWithAuth>
  );
}
