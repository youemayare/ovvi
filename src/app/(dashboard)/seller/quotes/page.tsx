import { db } from "@/db";
import { quotes, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink, Clock } from "lucide-react";
import type { Metadata } from "next";
import { CopyLinkButton } from "./copy-link-button";
import { QuoteActions } from "./quote-actions";

export const metadata: Metadata = { title: "Quotes — Seller Dashboard" };

const QUOTE_STATUS_STYLES: Record<string, string> = {
  DRAFT:     "text-stone-500 bg-stone-50 border-stone-200",
  SENT:      "text-blue-600 bg-blue-50 border-blue-200",
  ACCEPTED:  "text-green-600 bg-green-50 border-green-200",
  EXPIRED:   "text-orange-600 bg-orange-50 border-orange-200",
  CANCELLED: "text-red-600 bg-red-50 border-red-200",
};

const QUOTE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft", SENT: "Sent", ACCEPTED: "Accepted", EXPIRED: "Expired", CANCELLED: "Cancelled",
};

export default async function QuotesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
    with: { store: true },
  });

  if (!user || !user.store) redirect("/onboarding/store");

  const storeQuotes = await db.query.quotes.findMany({
    where: eq(quotes.storeId, user.store.id),
    orderBy: [desc(quotes.createdAt)],
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900">Quotes</h1>
          <p className="mt-1 text-stone-500 text-sm">
            Custom payment links for WhatsApp customers. Expire after 48 hours.
          </p>
        </div>
        <Button asChild className="bg-primary-600 hover:bg-primary-700 text-white shrink-0">
          <Link href="/seller/quotes/new">
            <Plus className="w-4 h-4 mr-2" />
            New Quote
          </Link>
        </Button>
      </div>

      {storeQuotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-16 text-center">
          <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-6 h-6 text-stone-400" />
          </div>
          <h3 className="font-semibold text-stone-700">No quotes yet</h3>
          <p className="text-stone-500 text-sm mt-1 mb-6">
            Create a payment link to send to a customer on WhatsApp.
          </p>
          <Button asChild variant="outline">
            <Link href="/seller/quotes/new">
              <Plus className="w-4 h-4 mr-2" />
              Create First Quote
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {/* ── Mobile: Cards (< lg) ──────────────────────────── */}
          <div className="lg:hidden space-y-3">
            {storeQuotes.map((quote) => {
              const checkoutUrl = quote.checkoutToken
                ? `${baseUrl}/quote/${quote.checkoutToken}`
                : null;
              const expiryLabel =
                quote.status === "SENT" && quote.expiresAt
                  ? isPast(new Date(quote.expiresAt))
                    ? "Expired"
                    : `Expires in ${formatDistanceToNow(new Date(quote.expiresAt))}`
                  : null;

              return (
                <div
                  key={quote.id}
                  className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 space-y-3"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-stone-900 text-sm">{quote.title}</p>
                      {quote.buyerName && (
                        <p className="text-xs text-stone-500 mt-0.5">{quote.buyerName}</p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${QUOTE_STATUS_STYLES[quote.status] ?? ""}`}
                    >
                      {QUOTE_STATUS_LABELS[quote.status] ?? quote.status}
                    </Badge>
                  </div>

                  {/* Details row */}
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <div className="space-y-0.5">
                      {quote.scheduledDate && (
                        <p>Pickup: {format(new Date(quote.scheduledDate + "T12:00:00"), "MMM d, yyyy")}</p>
                      )}
                      {expiryLabel && (
                        <p className="flex items-center gap-1 text-orange-600">
                          <Clock className="w-3 h-3" />
                          {expiryLabel}
                        </p>
                      )}
                    </div>
                    <span className="font-semibold text-stone-900 text-sm">
                      ${(quote.price / 100).toFixed(2)}
                    </span>
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    {checkoutUrl && ["SENT", "ACCEPTED"].includes(quote.status) ? (
                      <CopyLinkButton url={checkoutUrl} />
                    ) : (
                      <span />
                    )}
                    <QuoteActions quoteId={quote.id} status={quote.status} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Desktop: Table (≥ lg) ─────────────────────────── */}
          <div className="hidden lg:block rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Title</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Pickup Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Expires</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Amount</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Link</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {storeQuotes.map((quote) => {
                  const checkoutUrl = quote.checkoutToken
                    ? `${baseUrl}/quote/${quote.checkoutToken}`
                    : null;
                  const expiryLabel =
                    quote.status === "SENT" && quote.expiresAt
                      ? isPast(new Date(quote.expiresAt))
                        ? "Expired"
                        : `in ${formatDistanceToNow(new Date(quote.expiresAt))}`
                      : null;

                  return (
                    <tr key={quote.id} className="hover:bg-stone-50/50">
                      <td className="px-6 py-4 font-medium text-stone-900 max-w-[160px] truncate">
                        {quote.title}
                      </td>
                      <td className="px-6 py-4 text-stone-600">{quote.buyerName || "—"}</td>
                      <td className="px-6 py-4 text-stone-600">
                        {quote.scheduledDate
                          ? format(new Date(quote.scheduledDate + "T12:00:00"), "MMM d, yyyy")
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={`text-xs ${QUOTE_STATUS_STYLES[quote.status] ?? ""}`}
                        >
                          {QUOTE_STATUS_LABELS[quote.status] ?? quote.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {expiryLabel ? (
                          <span className="flex items-center gap-1 text-xs text-orange-600">
                            <Clock className="w-3 h-3" />
                            {expiryLabel}
                          </span>
                        ) : (
                          <span className="text-xs text-stone-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-stone-900">
                        ${(quote.price / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {checkoutUrl && ["SENT", "ACCEPTED"].includes(quote.status) ? (
                          <CopyLinkButton url={checkoutUrl} />
                        ) : (
                          <span className="text-xs text-stone-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <QuoteActions quoteId={quote.id} status={quote.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
