"use client";

import { UserButton, useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Menu, X, ShoppingBag, Store, ArrowRight } from "lucide-react";

export function NavbarAuth() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const role = (user?.publicMetadata as { role?: string })?.role;
  const isSeller = role === "SELLER" || role === "ADMIN";

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!isLoaded) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-stone-200" />;
  }

  // ── Signed-out: just a Sign in button (no hamburger needed) ──
  if (!userId) {
    return (
      <Link
        href="/sign-in"
        className="rounded-full bg-primary-500 px-4 py-1.5 text-sm text-white font-medium hover:bg-primary-600 transition-colors"
      >
        Sign in
      </Link>
    );
  }

  // ── Signed-in: desktop inline / mobile hamburger ─────────────
  return (
    <>
      {/* Desktop nav items (hidden on mobile) */}
      <div className="hidden sm:flex items-center gap-4 text-sm">
        <Link
          href="/buyer/orders"
          className="text-stone-600 hover:text-primary-600 transition-colors font-medium"
        >
          My Orders
        </Link>
        <Link
          href={isSeller ? "/seller" : "/seller/onboarding"}
          className="rounded-full bg-stone-100 px-3 py-1.5 text-stone-700 font-medium hover:bg-stone-200 transition-colors whitespace-nowrap"
        >
          {isSeller ? "Dashboard" : "Sell on Ovvi"}
        </Link>
        <UserButton />
      </div>

      {/* Mobile: avatar + hamburger */}
      <div className="flex sm:hidden items-center gap-2">
        <UserButton />
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
        >
          <Menu className="w-5 h-5 text-stone-600" />
        </button>
      </div>

      {/* Mobile Drawer via Portal to escape header stacking context */}
      {mounted
        ? createPortal(
            <div className="sm:hidden">
              {/* Mobile drawer backdrop */}
              {open && (
                <div
                  className="fixed inset-0 z-40 bg-black/40"
                  onClick={() => setOpen(false)}
                  aria-hidden="true"
                />
              )}

              {/* Mobile drawer panel — slides in from right */}
              <div
                className={`fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${
                  open ? "translate-x-0" : "translate-x-full"
                }`}
                aria-label="Mobile menu"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 h-16 border-b border-stone-200">
                  <span className="font-display font-bold text-primary-600 text-lg">
                    Ovvi
                  </span>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Close menu"
                    className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-stone-500" />
                  </button>
                </div>

                {/* Nav links */}
                <nav className="flex-1 p-5 space-y-1">
                  <Link
                    href="/marketplace"
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-stone-700 hover:bg-stone-100 transition-colors font-medium"
                    onClick={() => setOpen(false)}
                  >
                    <Store className="w-4 h-4 text-stone-400" />
                    Browse Bakers
                  </Link>
                  <Link
                    href="/buyer/orders"
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-stone-700 hover:bg-stone-100 transition-colors font-medium"
                    onClick={() => setOpen(false)}
                  >
                    <ShoppingBag className="w-4 h-4 text-stone-400" />
                    My Orders
                  </Link>
                </nav>

                {/* CTA */}
                <div className="p-5 border-t border-stone-200">
                  <Link
                    href={isSeller ? "/seller" : "/seller/onboarding"}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between w-full bg-primary-50 hover:bg-primary-100 text-primary-700 font-semibold px-4 py-3 rounded-xl transition-colors"
                  >
                    <span>
                      {isSeller ? "Store Dashboard" : "Start Selling"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
