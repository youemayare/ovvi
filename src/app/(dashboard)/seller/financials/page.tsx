import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { eq, and, gte, lt, not, inArray } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns";
import type { Metadata } from "next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, ShoppingBag, XCircle, AlertCircle, CheckCircle2 } from "lucide-react";
import { StripeOnboardingButton, StripeDashboardButton } from "@/components/dashboard/stripe-connect-buttons";

export const metadata: Metadata = {
  title: "Financials - Seller Dashboard",
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-stone-500 font-medium">{label}</span>
      </div>
      <div className="text-3xl font-bold text-stone-900">{value}</div>
      {sub && <div className="text-xs text-stone-400 mt-1">{sub}</div>}
    </div>
  );
}

export default async function FinancialsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
    with: { store: true },
  });

  if (!user || !user.store) redirect("/onboarding/store");

  const storeId = user.store.id;
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  const yearStart = startOfYear(now);

  const FINAL_STATUSES = ["COMPLETED", "CONFIRMED_PAID", "CONFIRMED_CASH", "IN_PROGRESS", "READY"];

  // Fetch all non-cancelled orders for this store
  const allOrders = await db.query.orders.findMany({
    where: and(
      eq(orders.storeId, storeId),
      not(inArray(orders.status, ["CANCELLED", "REFUNDED"]))
    ),
    with: { buyer: true },
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
  });

  const completedOrders = allOrders.filter((o) => FINAL_STATUSES.includes(o.status));

  // MTD revenue
  const mtdOrders = completedOrders.filter(
    (o) => new Date(o.createdAt) >= monthStart && new Date(o.createdAt) <= monthEnd
  );
  const mtdRevenue = mtdOrders.reduce((sum, o) => sum + o.total, 0);

  // Last month revenue
  const lastMonthOrders = completedOrders.filter(
    (o) => new Date(o.createdAt) >= lastMonthStart && new Date(o.createdAt) <= lastMonthEnd
  );
  const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + o.total, 0);

  // YTD revenue
  const ytdOrders = completedOrders.filter((o) => new Date(o.createdAt) >= yearStart);
  const ytdRevenue = ytdOrders.reduce((sum, o) => sum + o.total, 0);

  // Total orders (all time, including pending)
  const totalOrderCount = allOrders.length;

  // Platform fees (from completed orders)
  const totalPlatformFees = completedOrders.reduce((sum, o) => sum + o.platformFee, 0);

  const fmt = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  // Month-over-month change
  const momDiff = lastMonthRevenue > 0
    ? (((mtdRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
    : null;

  // Recent 10 orders for the table
  const recentOrders = allOrders.slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900">Financials</h1>
          <p className="mt-1 text-stone-500">
            Track your revenue, orders, and earnings over time.
          </p>
        </div>
        {user.store.stripeOnboarded && (
          <StripeDashboardButton />
        )}
      </div>

      {!user.store.stripeOnboarded && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900">Action Required: Link your bank account</h3>
              <p className="text-amber-700 text-sm mt-1 max-w-xl">
                To receive payouts for card payments, you need to securely link your bank account via Stripe. Until then, you can only accept cash orders.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <StripeOnboardingButton />
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          icon={DollarSign}
          label="Revenue this month"
          value={fmt(mtdRevenue)}
          sub={momDiff !== null ? `${Number(momDiff) >= 0 ? "+" : ""}${momDiff}% vs last month` : `${lastMonthOrders.length === 0 ? "First month" : ""}`}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Revenue this year"
          value={fmt(ytdRevenue)}
          sub={`${ytdOrders.length} completed orders`}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={ShoppingBag}
          label="Total orders"
          value={String(totalOrderCount)}
          sub="Excludes cancelled & refunded"
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          icon={XCircle}
          label="Platform fees paid"
          value={fmt(totalPlatformFees)}
          sub="Deducted from your revenue"
          color="bg-orange-50 text-orange-600"
        />
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900">Recent Transactions</h2>
          <p className="text-sm text-stone-500 mt-0.5">Your latest 10 orders.</p>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-6 py-12 text-center text-stone-400 text-sm">
            No transactions yet.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-stone-50">
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Platform Fee</TableHead>
                <TableHead className="text-right">Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => {
                const net = order.total - order.platformFee;
                return (
                  <TableRow key={order.id} className="hover:bg-stone-50/50">
                    <TableCell className="font-medium text-stone-700 text-sm">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell className="text-stone-600 text-sm">
                      {order.buyer
                        ? `${order.buyer.firstName || ""} ${order.buyer.lastName || ""}`.trim() || order.buyer.email
                        : "Guest"}
                    </TableCell>
                    <TableCell className="text-stone-500 text-sm">
                      {format(new Date(order.createdAt), "MMM d")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {order.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          order.status === "COMPLETED"
                            ? "text-green-600 bg-green-50 border-green-200"
                            : order.status === "CANCELLED"
                            ? "text-red-500 bg-red-50 border-red-200"
                            : "text-stone-500 bg-stone-50 border-stone-200"
                        }`}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-stone-900">
                      {fmt(order.total)}
                    </TableCell>
                    <TableCell className="text-right text-stone-500 text-sm">
                      {fmt(order.platformFee)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-700">
                      {fmt(net)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
