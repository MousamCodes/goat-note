// Convex validates Clerk session tokens directly (no Clerk JWT template needed).
// CLERK_JWT_ISSUER_DOMAIN is set on the Convex deployment, e.g.
//   npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev
const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;

export default {
  providers: [
    {
      type: "customJwt",
      issuer,
      jwks: `${issuer}/.well-known/jwks.json`,
      algorithm: "RS256",
    },
  ],
};
