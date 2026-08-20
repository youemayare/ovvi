import { db } from "@/db";
import { stores } from "@/db/schema";
import { and, eq, ilike, inArray, or, sql } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { MapPin, Store as StoreIcon } from "lucide-react";
import { MarketplaceFilters } from "@/components/marketplace/marketplace-filters";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Discover Local Bakers | Ovvi",
  description:
    "Find talented home bakers near you. Order custom cakes, dessert boxes, and artisan treats — pickup or delivery.",
};

interface SearchParams {
  q?: string;
  city?: string;
  fulfillment?: string;
  cash?: string;
}

/** Builds the Drizzle where-clause from URL params. */
async function queryStores(params: SearchParams) {
  const { q, city, fulfillment, cash } = params;

  const conditions = [
    // Always only show active/onboarding stores
    inArray(stores.status, ["ACTIVE", "ONBOARDING"]),
  ];

  // Text search: store name OR description
  if (q?.trim()) {
    const term = `%${q.trim()}%`;
    conditions.push(
      or(ilike(stores.name, term), ilike(stores.description, term))!
    );
  }

  // City filter (case-insensitive exact match on stored city)
  if (city?.trim()) {
    conditions.push(ilike(stores.city, city.trim()));
  }

  // Fulfillment filter
  if (fulfillment === "PICKUP") {
    conditions.push(eq(stores.pickupEnabled, true));
  } else if (fulfillment === "DELIVERY") {
    conditions.push(eq(stores.deliveryEnabled, true));
  }

  // Cash accepted
  if (cash === "1") {
    conditions.push(eq(stores.cashEnabled, true));
  }

  return db.query.stores.findMany({
    where: and(...conditions),
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  });
}

/** Get distinct non-null cities for the city dropdown. */
async function getDistinctCities(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ city: stores.city })
    .from(stores)
    .where(
      and(
        inArray(stores.status, ["ACTIVE", "ONBOARDING"]),
        sql`${stores.city} is not null`
      )
    )
    .orderBy(stores.city);

  return rows.map((r) => r.city).filter(Boolean) as string[];
}

function StoreCard({ store }: { store: Awaited<ReturnType<typeof queryStores>>[0] }) {
  return (
    <Link
      href={`/store/${store.slug}`}
      className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md hover:border-stone-300 transition-all block"
    >
      {/* Banner */}
      <div className="aspect-video w-full bg-stone-200 relative overflow-hidden">
        {store.bannerUrl ? (
          <Image
            src={store.bannerUrl}
            alt={store.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-primary-50 to-stone-200 flex items-center justify-center">
            <StoreIcon className="w-8 h-8 text-stone-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Logo */}
          <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-full border-2 border-white shadow-sm bg-white overflow-hidden relative shrink-0 -mt-9 z-10">
            {store.logoUrl ? (
              <Image src={store.logoUrl} alt={store.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-primary-100 flex items-center justify-center text-primary-600 font-display font-bold text-lg">
                {store.name.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 mt-1">
            <h3 className="font-bold text-stone-900 truncate group-hover:text-primary-600 transition-colors">
              {store.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {store.city && (
                <span className="text-xs text-stone-500 flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />
                  {store.city}
                </span>
              )}
              {/* Fulfillment badges */}
              <div className="flex gap-1">
                {store.pickupEnabled && (
                  <span className="text-[10px] font-medium text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-full">
                    Pickup
                  </span>
                )}
                {store.deliveryEnabled && (
                  <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                    Delivery
                  </span>
                )}
                {store.cashEnabled && (
                  <span className="text-[10px] font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
                    Cash
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {store.description && (
          <p className="text-xs text-stone-500 mt-3 line-clamp-2 leading-relaxed">
            {store.description}
          </p>
        )}
      </div>
    </Link>
  );
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [filteredStores, cities] = await Promise.all([
    queryStores(params),
    getDistinctCities(),
  ]);

  const q = params.q?.trim() ?? "";
  const hasFilters = !!(params.q || params.city || params.fulfillment || params.cash);
  const resultCount = filteredStores.length;

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-stone-200 py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-stone-900">
            Discover local home bakers
          </h1>
          <p className="mt-3 text-base sm:text-lg text-stone-500 max-w-2xl mx-auto">
            Custom cakes, dessert boxes, and artisan treats — made with love and ready to order.
          </p>
        </div>
      </div>

      {/* ── Search & Filters ──────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <Suspense>
          <MarketplaceFilters cities={cities} />
        </Suspense>
      </div>

      {/* ── Results ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Result count */}
        <p className="text-sm text-stone-500 mb-4">
          {hasFilters ? (
            <>
              <span className="font-medium text-stone-800">{resultCount}</span>{" "}
              {resultCount === 1 ? "baker" : "bakers"} found
              {q && (
                <>
                  {" "}for <span className="font-medium text-stone-800">"{q}"</span>
                </>
              )}
            </>
          ) : (
            <>
              <span className="font-medium text-stone-800">{resultCount}</span>{" "}
              {resultCount === 1 ? "baker" : "bakers"} on Ovvi
            </>
          )}
        </p>

        {filteredStores.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <StoreIcon className="w-8 h-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-semibold text-stone-900 mb-2">
              {hasFilters ? "No bakers match your filters" : "No bakers found"}
            </h3>
            <p className="text-stone-500 text-sm max-w-xs mx-auto">
              {hasFilters
                ? "Try broadening your search or removing some filters."
                : "Check back later as more bakers join the platform!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredStores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
