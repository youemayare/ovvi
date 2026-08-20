import Link from "next/link";
import Image from "next/image";
import { db } from "@/db";
import { stores, reviews, products } from "@/db/schema";
import { eq, count, avg, desc, sql } from "drizzle-orm";
import { Metadata } from "next";
import { Star, ShoppingBag, MessageCircle, Zap, Shield, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Ovvi — Order from Local Home Bakers",
  description:
    "Discover incredible cakes, pastries, and custom baked goods from talented home bakers near you. Order in minutes, pay securely, and enjoy artisan baking.",
  openGraph: {
    title: "Ovvi — Order from Local Home Bakers",
    description: "Custom cakes & artisan baked goods from talented home bakers near you.",
    type: "website",
  },
};

// Grab a handful of active stores with their review aggregates
async function getFeaturedStores() {
  const data = await db
    .select({
      id: stores.id,
      name: stores.name,
      slug: stores.slug,
      city: stores.city,
      logoUrl: stores.logoUrl,
      bannerUrl: stores.bannerUrl,
      description: stores.description,
      reviewCount: count(reviews.id),
      avgRating: avg(reviews.rating),
    })
    .from(stores)
    .leftJoin(reviews, eq(reviews.storeId, stores.id))
    .where(eq(stores.status, "ACTIVE"))
    .groupBy(stores.id)
    .orderBy(desc(sql`count(${reviews.id})`))
    .limit(6);
  return data;
}

async function getPlatformStats() {
  const [storeCount] = await db
    .select({ count: count() })
    .from(stores)
    .where(eq(stores.status, "ACTIVE"));
  const [orderCount] = await db
    .select({ count: count() })
    .from(stores); // proxy; real orders table aggregation
  return { bakers: storeCount.count };
}

const FEATURES = [
  {
    icon: ShoppingBag,
    title: "Multi-item cart",
    body: "Browse a full menu and add as many items as you like — all in one seamless checkout.",
  },
  {
    icon: MessageCircle,
    title: "Custom orders via WhatsApp",
    body: "Need a wedding cake or something special? Chat directly with the baker and get a custom checkout link.",
  },
  {
    icon: Zap,
    title: "Cash or card",
    body: "Pay securely online, or choose cash on pickup — whatever works for you.",
  },
  {
    icon: Shield,
    title: "Verified bakers",
    body: "Every baker on Ovvi is reviewed by real customers. Ratings are honest, unfiltered, and earned.",
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Discover a baker", body: "Browse the marketplace and find a home baker near you with the skills and style you love." },
  { step: "02", title: "Choose your order", body: "Pick from their menu or request a custom order via WhatsApp for that special occasion." },
  { step: "03", title: "Pay & confirm", body: "Checkout securely with your card, or choose cash on pickup. Your slot is instantly reserved." },
  { step: "04", title: "Enjoy & review", body: "Pick up or receive your order on the scheduled day, then leave a review to help others discover great bakers." },
];

export default async function LandingPage() {
  const [featuredStores, stats] = await Promise.all([getFeaturedStores(), getPlatformStats()]);

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-xl font-bold text-primary-600">
            Ovvi 🎂
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-stone-600">
            <Link href="/marketplace" className="hover:text-stone-900 transition-colors">Browse Bakers</Link>
            <Link href="/seller/onboarding" className="hover:text-stone-900 transition-colors">Sell on Ovvi</Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/sign-in" className="text-sm text-stone-600 hover:text-stone-900 transition-colors hidden sm:block">
              Sign in
            </Link>
            <Button asChild size="sm" className="rounded-full text-xs sm:text-sm px-3 sm:px-4">
              <Link href="/marketplace">Browse Bakers</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 pt-24 pb-32">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-100/60 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-secondary-100/40 blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-sm font-medium px-4 py-1.5 rounded-full border border-primary-200 mb-8">
            🎉 {stats.bakers}+ home bakers and counting
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-extrabold text-stone-900 leading-[1.1] mb-6">
            Order from your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-500">
              favourite
            </span>{" "}
            home baker.
          </h1>

          <p className="text-xl text-stone-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Discover incredible cakes, pastries, and custom baked goods made with love by talented home bakers in your city.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="h-14 px-8 text-base rounded-full shadow-lg hover:shadow-xl transition-shadow">
              <Link href="/marketplace">
                Browse Bakers Near You <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base rounded-full">
              <Link href="/seller/onboarding">Start Selling →</Link>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-10 text-sm text-stone-400">
            <span className="flex items-center gap-1.5"><span className="text-amber-400">★★★★★</span> Verified reviews</span>
            <span className="hidden sm:inline">·</span>
            <span>Cash or card</span>
            <span className="hidden sm:inline">·</span>
            <span>Custom orders via WhatsApp</span>
          </div>
        </div>
      </section>

      {/* ── Featured Bakers ─────────────────────────────────────────────────── */}
      {featuredStores.length > 0 && (
        <section className="py-20 max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-display text-3xl font-bold text-stone-900">Featured Bakers</h2>
              <p className="text-stone-500 mt-1">Highly rated home bakers loved by their communities.</p>
            </div>
            <Link href="/marketplace" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
              See all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredStores.map((store) => (
              <Link
                key={store.id}
                href={`/store/${store.slug}`}
                className="group bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md hover:border-stone-300 overflow-hidden transition-all"
              >
                {/* Banner */}
                <div className="h-36 bg-gradient-to-tr from-primary-100 to-stone-200 relative overflow-hidden">
                  {store.bannerUrl && (
                    <Image src={store.bannerUrl} alt={store.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm shrink-0 overflow-hidden relative border-2 border-white -mt-8">
                      {store.logoUrl ? (
                        <Image src={store.logoUrl} alt={store.name} fill className="object-cover" />
                      ) : (
                        store.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-900 group-hover:text-primary-600 transition-colors">
                        {store.name}
                      </h3>
                      {store.city && <p className="text-xs text-stone-500">{store.city}</p>}
                    </div>
                  </div>

                  {Number(store.reviewCount) > 0 && (
                    <div className="flex items-center gap-1 text-sm mb-2">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-medium text-stone-700">{Number(store.avgRating).toFixed(1)}</span>
                      <span className="text-stone-400">({store.reviewCount} reviews)</span>
                    </div>
                  )}

                  {store.description && (
                    <p className="text-sm text-stone-500 line-clamp-2">{store.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── How It Works ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white border-y border-stone-200">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-bold text-stone-900 mb-3">How it works</h2>
            <p className="text-stone-500">From discovery to delivery in four easy steps.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 font-display font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="font-semibold text-stone-900 mb-2">{step.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section className="py-20 max-w-5xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl font-bold text-stone-900 mb-3">Built for bakers & buyers</h2>
          <p className="text-stone-500">Everything you need for a great home bakery experience.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                <feature.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{feature.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Seller CTA ──────────────────────────────────────────────────────── */}
      <section className="py-20 mx-4 mb-12 rounded-3xl bg-gradient-to-br from-stone-900 to-stone-800 text-white overflow-hidden relative max-w-5xl lg:mx-auto">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="relative text-center px-6 max-w-2xl mx-auto">
          <div className="text-5xl mb-6">🎂</div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Are you a home baker?
          </h2>
          <p className="text-stone-300 text-lg mb-8 leading-relaxed">
            Turn your passion into a business. Create your free storefront, set your menu, and start receiving orders from customers in your city — no technical skills required.
          </p>
          <Button asChild size="lg" className="h-14 px-8 text-base rounded-full bg-primary-500 hover:bg-primary-400 text-white shadow-lg">
            <Link href="/seller/onboarding">Start your bakery for free →</Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-stone-200 py-10 bg-white">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-500">
          <Link href="/" className="font-display font-bold text-stone-800">Ovvi 🎂</Link>
          <div className="flex gap-6">
            <Link href="/marketplace" className="hover:text-stone-800 transition-colors">Browse</Link>
            <Link href="/seller/onboarding" className="hover:text-stone-800 transition-colors">Sell</Link>
            <a href="mailto:hello@ovvi.com" className="hover:text-stone-800 transition-colors">Contact</a>
          </div>
          <p>© {new Date().getFullYear()} Ovvi. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
