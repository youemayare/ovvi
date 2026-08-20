// Extends the Clerk session token type to include our custom `role` metadata.
// Add this to `tsconfig.json` includes or it's picked up automatically from `src/types/`.

export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: "BUYER" | "SELLER" | "ADMIN";
    };
  }
}
