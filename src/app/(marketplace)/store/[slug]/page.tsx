import { db } from "@/db";
import { stores, products, reviews } from "@/db/schema";
import { eq, and, avg, count } from "drizzle-orm";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Plus, Star, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportStoreDialog } from "@/components/marketplace/report-store-dialog";
import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const store = await db.query.stores.findFirst({
    where: eq(stores.slug, slug),
  });

  if (!store) return { title: "Store Not Found" };

  return {
    title: `${store.name} | Ovvi`,
    description: store.description || `Order from ${store.name} on Ovvi.`,
    openGraph: {
      title: `${store.name} | Ovvi`,
      description: store.description || `Order from ${store.name} on Ovvi.`,
      images: store.bannerUrl ? [store.bannerUrl] : [],
    },
  };
}

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${cls} ${
            s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-stone-200"
          }`}
        />
      ))}
    </div>
  );
}

export default async function PublicStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { userId } = await auth();

  const store = await db.query.stores.findFirst({
    where: eq(stores.slug, slug),
  });

  if (!store) notFound();

  const [storeProducts, storeReviews] = await Promise.all([
    db.query.products.findMany({
      where: and(eq(products.storeId, store.id), eq(products.isActive, true)),
      with: { images: true },
      orderBy: (p, { asc }) => [asc(p.sortOrder)],
    }),
    db.query.reviews.findMany({
      where: eq(reviews.storeId, store.id),
      with: { buyer: true },
      orderBy: (r, { desc }) => [desc(r.createdAt)],
    }),
  ]);

  const avgRating =
    storeReviews.length > 0
      ? storeReviews.reduce((sum, r) => sum + r.rating, 0) / storeReviews.length
      : null;

  const whatsappNumber = store.whatsappNumber;
  const waMessage = encodeURIComponent(
    `Hi! 👋 I'm interested in a custom order from ${store.name} on Ovvi.\n\nHere's what I'm looking for:\n- Occasion:\n- Date needed:\n- Servings/Size:\n- Flavor preferences:\n- Any dietary requirements:\n\nLooking forward to hearing from you! 🎂`
  );
  const waLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${waMessage}`
    : null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "Bakery"],
    name: store.name,
    description: store.description ?? undefined,
    url: `${appUrl}/store/${store.slug}`,
    image: store.bannerUrl ?? store.logoUrl ?? undefined,
    address: store.city ? { "@type": "PostalAddress", addressLocality: store.city } : undefined,
    ...(avgRating !== null && storeReviews.length > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating.toFixed(1),
            reviewCount: storeReviews.length,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="bg-stone-50 min-h-screen pb-24">
      {/* Banner */}
      <div className="relative h-48 sm:h-64 md:h-80 w-full bg-stone-200">
        {store.bannerUrl ? (
          <Image src={store.bannerUrl} alt={`${store.name} banner`} fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-primary-100 to-stone-200" />
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 space-y-8">
        {/* Store Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="h-24 w-24 rounded-full border-4 border-white shadow-sm bg-white overflow-hidden relative shrink-0">
              {store.logoUrl ? (
                <Image src={store.logoUrl} alt={store.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-primary-100 flex items-center justify-center text-primary-600 font-display text-2xl font-bold">
                  {store.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-stone-900">
                {store.name}
              </h1>
              {store.city && (
                <p className="text-stone-500 text-sm mt-1">{store.city}</p>
              )}

              {avgRating !== null && (
                <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                  <StarDisplay rating={avgRating} />
                  <span className="text-sm font-medium text-stone-700">
                    {avgRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-stone-400">
                    ({storeReviews.length} review{storeReviews.length !== 1 ? "s" : ""})
                  </span>
                </div>
              )}

              {store.description && (
                <p className="text-stone-600 mt-4 leading-relaxed">{store.description}</p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {waLink && (
              <Button asChild variant="outline" className="flex-1">
                <a href={waLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Request Custom Order
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Menu Section */}
        <div>
          <h2 className="font-display text-xl font-bold text-stone-900 mb-4">Menu</h2>
          {storeProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
              <p className="text-stone-500">This baker hasn't added any products yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden divide-y divide-stone-100 shadow-sm">
              {storeProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/store/${store.slug}/${product.id}`}
                  className="group flex gap-4 p-4 sm:p-6 hover:bg-stone-50 transition cursor-pointer block"
                >
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-stone-900">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-stone-500 line-clamp-2 mt-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-medium text-stone-900">
                        {product.basePrice
                          ? `$${(product.basePrice / 100).toFixed(2)}`
                          : "Custom Quote"}
                      </span>
                      <button className="h-8 w-8 bg-stone-100 text-primary-600 rounded-full flex items-center justify-center hover:bg-primary-50 transition group-hover:bg-primary-100">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {product.images[0] && (
                    <div className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-xl bg-stone-100 overflow-hidden relative">
                      <Image
                        src={product.images[0].url}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold text-stone-900">
              Reviews
              {avgRating !== null && (
                <span className="ml-3 text-base font-normal text-stone-500">
                  {avgRating.toFixed(1)} / 5
                </span>
              )}
            </h2>
            {avgRating !== null && <StarDisplay rating={avgRating} size="md" />}
          </div>

          {storeReviews.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-stone-200">
              <Star className="w-8 h-8 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-500 text-sm">No reviews yet. Be the first to order!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {storeReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm shrink-0">
                        {review.buyer?.firstName?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-stone-800 text-sm">
                          {review.buyer?.firstName
                            ? `${review.buyer.firstName} ${review.buyer.lastName || ""}`.trim()
                            : "Anonymous"}
                        </p>
                        <p className="text-xs text-stone-400">
                          {format(new Date(review.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <StarDisplay rating={review.rating} />
                  </div>
                  {review.comment && (
                    <p className="text-stone-600 text-sm mt-3 leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report Store */}
        {userId && (
          <div className="flex justify-center pb-4">
            <ReportStoreDialog storeId={store.id} storeName={store.name} />
          </div>
        )}
      </div>
    </div>
    </>
  );
}
