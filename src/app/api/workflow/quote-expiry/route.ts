import { serve } from "@upstash/workflow/nextjs";
import { db } from "@/db";
import { quotes } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Quote Expiry Workflow
 *
 * Triggered when a seller sends a quote.
 * Sleeps until the quote's expiresAt timestamp, then marks it EXPIRED
 * if it hasn't been accepted or cancelled in the meantime.
 *
 * POST /api/workflow/quote-expiry
 * Body: { quoteId: string; expiresAt: string }
 */
export const { POST } = serve<{ quoteId: string; expiresAt: string }>(
  async (context) => {
    const { quoteId, expiresAt } = context.requestPayload;

    // ── Step 1: Sleep until the expiry time ──────────────────────────────
    const expiryDate = new Date(expiresAt);
    if (expiryDate > new Date()) {
      await context.sleepUntil("wait-for-expiry", expiryDate);
    }

    // ── Step 2: Check current status and expire if still SENT ────────────
    await context.run("expire-quote", async () => {
      const quote = await db.query.quotes.findFirst({
        where: eq(quotes.id, quoteId),
      });

      // Only expire if still in SENT state — don't overwrite ACCEPTED/CANCELLED
      if (!quote || quote.status !== "SENT") return;

      await db
        .update(quotes)
        .set({ status: "EXPIRED", updatedAt: new Date() })
        .where(eq(quotes.id, quoteId));

      console.log(`[QuoteExpiry] Quote ${quoteId} expired at ${new Date().toISOString()}`);
    });
  }
);
