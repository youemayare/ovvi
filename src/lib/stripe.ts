import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("⚠️ STRIPE_SECRET_KEY environment variable is not set. Stripe functionality will fail.");
}

/**
 * Singleton Stripe client.
 * Always pin the API version to avoid surprise breaking changes.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
  apiVersion: "2026-06-24.dahlia",
  typescript: true,
});

/**
 * Calculates the platform fee in cents.
 * Rate is read from PLATFORM_COMMISSION_RATE (default: 10%).
 */
export function calculatePlatformFee(subtotalCents: number): number {
  const rate = parseFloat(process.env.PLATFORM_COMMISSION_RATE ?? "0.10");
  return Math.round(subtotalCents * rate);
}
