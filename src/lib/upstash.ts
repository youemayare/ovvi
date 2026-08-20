import { Client } from "@upstash/workflow";

if (!process.env.QSTASH_TOKEN) {
  throw new Error("QSTASH_TOKEN environment variable is not set.");
}

/**
 * Upstash Workflow client for triggering durable background workflows.
 * Workflows are defined as Route Handlers at /api/workflow/*.
 */
export const workflowClient = new Client({
  token: process.env.QSTASH_TOKEN,
});

/**
 * Helper: trigger the quote expiration workflow.
 * Called immediately after a quote's checkout link is generated.
 */
export async function scheduleQuoteExpiration(params: {
  quoteId: string;
  expiresAt: Date;
}): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await workflowClient.trigger({
    url: `${appUrl}/api/workflow/expire-quote`,
    body: { quoteId: params.quoteId },
    // Upstash will deliver this message at the specified time
    notBefore: Math.floor(params.expiresAt.getTime() / 1000),
  });
}
