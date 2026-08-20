import { db } from "@/db";
import { orders, users, reviews } from "@/db/schema";
import { eq, and, gte, count, sum, avg, not, inArray } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format, startOfMonth, startOfToday, endOfToday } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, TrendingUp, Star, Clock, ArrowRight, CheckCircle2, Package } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Seller Dashboard" };

const STATUS_COLOR: Record<string, string> = {
  PENDING_PAYMENT:  "text-yellow-700 bg-yellow-50 border-yellow-200",
  CONFIRMED_PAID:   "text-green-700 bg-green-50 border-green-200",
  CONFIRMED_CASH:   "text-blue-700 bg-blue-50 border-blue-200",
  IN_PROGRESS:      "text-purple-700 bg-purple-50 border-purple-200",
  READY:            "text-indigo-700 bg-indigo-50 border-indigo-200",
  COMPLETED:        "text-stone-600 bg-stone-100 border-stone-200",
  CANCELLED:        "text-red-600 bg-red-50 border-red-200",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Pending", CONFIRMED_PAID: "Confirmed", CONFIRMED_CASH: "Cash",
  IN_PROGRESS: "In Progress", READY: "Ready", COMPLETED: "Completed", CANCELLED: "Cancelled",
};

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-stone-500 font-medium">{label}</span>
      </div>
      <div className="text-3xl font-bold text-stone-900">{value}</div>
      {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
    </div>
  );
}

export default async function SellerDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
    with: { store: true },
  });

  if (!user || !user.store) redirect("/seller/onboarding");

  const storeId = user.store.id;
  const today = startOfToday();
  const todayEnd = endOfToday();
  const monthStart = startOfMonth(new Date());

  // Run all stats queries in parallel
  const [todayOrders, pendingOrders, mtvOrders, allReviews, recentOrders] = await Promise.all([
    // Orders placed today
    db.query.orders.findMany({
      where: and(eq(orders.storeId, storeId), gte(orders.createdAt, today)),
    }),
    // Active (not completed/cancelled)
    db.query.orders.findMany({
      where: and(
        eq(orders.storeId, storeId),
        not(inArray(orders.status, ["COMPLETED", "CANCELLED", "REFUNDED", "PENDING_PAYMENT"]))
      ),
    }),
    // MTD completed orders
    db.query.orders.findMany({
      where: and(
        eq(orders.storeId, storeId),
        gte(orders.createdAt, monthStart),
        inArray(orders.status, ["COMPLETED", "CONFIRMED_PAID", "CONFIRMED_CASH", "IN_PROGRESS", "READY"])
      ),
    }),
    // Reviews for avg rating
    db.query.reviews.findMany({
      where: eq(reviews.storeId, storeId),
    }),
    // Recent 5 orders
    db.query.orders.findMany({
      where: eq(orders.storeId, storeId),
      with: { buyer: true, items: true },
      orderBy: (o, { desc }) => [desc(o.createdAt)],
      limit: 5,
    }),
  ]);

  const mtdRevenue = mtvOrders.reduce((s, o) => s + o.total, 0);
  const avgRating = allReviews.length
    ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
    : null;

  const fmt = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900">
          {greeting}, {user.store.name} 👋
        </h1>
        <p className="mt-1 text-stone-500">Here's what's happening with your bakery today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          icon={ShoppingBag}
          label="Orders today"
          value={String(todayOrders.length)}
          sub={todayOrders.length === 1 ? "1 order placed" : `${todayOrders.length} orders placed`}
          color="bg-primary-50 text-primary-600"
        />
        <StatCard
          icon={Clock}
          label="Active orders"
          value={String(pendingOrders.length)}
          sub="Awaiting action"
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Revenue MTD"
          value={fmt(mtdRevenue)}
          sub={`${mtvOrders.length} confirmed orders`}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          icon={Star}
          label="Avg rating"
          value={avgRating ? `${avgRating.toFixed(1)} ★` : "No reviews"}
          sub={`${allReviews.length} review${allReviews.length !== 1 ? "s" : ""}`}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-semibold text-stone-900">Recent Orders</h2>
          <Link
            href="/seller/orders"
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Package className="w-8 h-8 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500 text-sm">No orders yet.</p>
            <p className="text-stone-400 text-xs mt-1">
              Share your{" "}
              <Link href="/seller/storefront" className="underline text-primary-600">
                storefront link
              </Link>{" "}
              to get your first order.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {recentOrders.map((order) => {
              const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
              return (
                <Link
                  key={order.id}
                  href={`/seller/orders/${order.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-stone-50 transition group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-900 text-sm">{order.orderNumber}</span>
                      <Badge variant="outline" className={`text-xs ${STATUS_COLOR[order.status] || ""}`}>
                        {STATUS_LABEL[order.status] || order.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {order.buyer
                        ? `${order.buyer.firstName || ""} ${order.buyer.lastName || ""}`.trim() || order.buyer.email
                        : "Guest"}{" "}
                      · {itemCount} item{itemCount !== 1 ? "s" : ""}
                      · {format(new Date(order.scheduledDate + "T12:00:00"), "MMM d")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="font-semibold text-stone-900 text-sm">
                      {fmt(order.total)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { href: "/seller/products", label: "Manage Menu", icon: "🧁" },
          { href: "/seller/quotes", label: "Send a Quote", icon: "💬" },
          { href: "/seller/availability", label: "Set Availability", icon: "📅" },
          { href: "/seller/storefront", label: "Share Storefront", icon: "🔗" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white rounded-xl border border-stone-200 p-4 text-center hover:border-primary-300 hover:shadow-sm transition group"
          >
            <div className="text-2xl mb-2">{item.icon}</div>
            <p className="text-sm font-medium text-stone-700 group-hover:text-primary-600 transition-colors">
              {item.label}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
