import type { Metadata } from "next";
import { NavbarAuth } from "@/components/navbar-auth";
import { CartDrawer } from "@/components/marketplace/cart-drawer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Discover Local Home Bakers",
  description:
    "Find and order from the best local home bakers near you — custom cakes, dessert boxes, and handmade treats.",
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link
            href="/"
            className="font-display text-xl sm:text-2xl font-bold text-primary-600 shrink-0"
          >
            Ovvi
          </Link>

          {/* Desktop center nav removed — Browse is now in the right cluster */}

          {/* Right side: browse + cart + auth */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/marketplace"
              className="hidden sm:block text-sm font-medium text-stone-600 hover:text-primary-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-stone-100"
            >
              Browse
            </Link>
            <CartDrawer />
            <NavbarAuth />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-stone-200 py-6 sm:py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-stone-400">
          <Link href="/" className="font-display font-bold text-stone-700 text-base">
            Ovvi 🎂
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/marketplace" className="hover:text-stone-600 transition-colors">Browse</Link>
            <Link href="/seller/onboarding" className="hover:text-stone-600 transition-colors">Sell</Link>
            <a href="mailto:hello@ovvi.com" className="hover:text-stone-600 transition-colors">Contact</a>
          </div>
          <p>© {new Date().getFullYear()} Ovvi</p>
        </div>
      </footer>
    </div>
  );
}
