"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Menu, X, LayoutDashboard, Package, ShoppingBag, MessageSquare, CalendarDays, Store, DollarSign, Users, Flag, ArrowLeft } from "lucide-react";

const navItems = [
  { label: "Dashboard",    href: "/seller",              icon: LayoutDashboard },
  { label: "Products",     href: "/seller/products",     icon: Package },
  { label: "Orders",       href: "/seller/orders",       icon: ShoppingBag },
  { label: "Quotes",       href: "/seller/quotes",       icon: MessageSquare },
  { label: "Availability", href: "/seller/availability", icon: CalendarDays },
  { label: "Storefront",   href: "/seller/storefront",   icon: Store },
  { label: "Financials",   href: "/seller/financials",   icon: DollarSign },
];

const adminItems = [
  { label: "Sellers", href: "/admin/sellers", icon: Users },
  { label: "Reports", href: "/admin/reports",  icon: Flag },
];

function NavLink({
  item,
  onClick,
}: {
  item: { label: string; href: string; icon: React.ElementType };
  onClick?: () => void;
}) {
  const pathname = usePathname();
  // exact match for /seller (dashboard home), prefix match for sub-pages
  const isActive =
    item.href === "/seller"
      ? pathname === "/seller"
      : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? "bg-primary-50 text-primary-700"
          : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
      }`}
    >
      <item.icon className="w-4 h-4 shrink-0" />
      {item.label}
    </Link>
  );
}

function SidebarContent({
  isAdmin,
  onNavigate,
}: {
  isAdmin: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex h-16 items-center px-6 border-b border-stone-200 shrink-0">
        <Link
          href="/"
          className="font-display text-xl font-bold text-primary-600"
          onClick={onNavigate}
        >
          Ovvi
        </Link>
        <span className="ml-2 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
          Seller
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} onClick={onNavigate} />
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
                Admin
              </p>
            </div>
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-stone-200 shrink-0">
        <Link
          href="/marketplace"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-stone-500 hover:text-stone-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Browse Marketplace
        </Link>
      </div>
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const role = (user?.publicMetadata as { role?: string })?.role;
  const isAdmin = role === "ADMIN";

  // Close drawer on route change
  const pathname = usePathname();
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="skeleton h-8 w-48" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden">
      {/* ── Desktop Sidebar ───────────────────────────────────── */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-stone-200 bg-white">
        <SidebarContent isAdmin={isAdmin} />
      </aside>

      {/* ── Mobile Drawer Overlay ─────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile Drawer Panel ───────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-white border-r border-stone-200 shadow-xl transition-transform duration-300 ease-in-out lg:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Mobile navigation"
      >
        {/* Close button inside drawer */}
        <button
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-stone-500" />
        </button>
        <SidebarContent isAdmin={isAdmin} onNavigate={() => setDrawerOpen(false)} />
      </aside>

      {/* ── Main Content ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="shrink-0 h-14 lg:h-16 border-b border-stone-200 bg-white flex items-center px-4 lg:px-8 gap-3">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-stone-100 transition-colors"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
          >
            <Menu className="w-5 h-5 text-stone-600" />
          </button>

          {/* Mobile brand (visible only when sidebar is hidden) */}
          <Link
            href="/seller"
            className="lg:hidden font-display font-bold text-primary-600 text-lg"
          >
            Ovvi
          </Link>

          <div className="flex-1" />
          <UserButton />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
