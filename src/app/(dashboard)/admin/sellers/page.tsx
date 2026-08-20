import { db } from "@/db";
import { stores, users, reviews } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq, desc, count, avg } from "drizzle-orm";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StoreStatusControl } from "./store-status-control";
import Link from "next/link";
import { Star, ExternalLink } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sellers — Admin" };

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "ACTIVE":
      return <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">Active</Badge>;
    case "PENDING_REVIEW":
      return <Badge variant="outline" className="text-yellow-700 bg-yellow-50 border-yellow-200">Pending Review</Badge>;
    case "SUSPENDED":
      return <Badge variant="outline" className="text-red-700 bg-red-50 border-red-200">Suspended</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function AdminSellersPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const adminUser = await db.query.users.findFirst({ where: eq(users.clerkId, userId) });
  if (!adminUser || adminUser.role !== "ADMIN") redirect("/");

  const allStores = await db.query.stores.findMany({
    with: { user: true },
    orderBy: [desc(stores.createdAt)],
  });

  const reviewData = await db
    .select({
      storeId: reviews.storeId,
      avgRating: avg(reviews.rating),
      reviewCount: count(reviews.id),
    })
    .from(reviews)
    .groupBy(reviews.storeId);

  const reviewMap = new Map(
    reviewData.map((r) => [r.storeId, { avg: Number(r.avgRating), count: Number(r.reviewCount) }])
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900">Sellers</h1>
          <p className="text-stone-500 mt-1">Manage and moderate all bakery storefronts.</p>
        </div>
        <Badge variant="outline" className="text-stone-600">{allStores.length} total</Badge>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-stone-50">
            <TableRow>
              <TableHead>Store</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Manage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allStores.map((store) => {
              const rev = reviewMap.get(store.id);
              return (
                <TableRow key={store.id} className="hover:bg-stone-50/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-900">{store.name}</span>
                      <Link href={`/store/${store.slug}`} target="_blank" className="text-stone-400 hover:text-primary-600">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                    <div className="text-xs text-stone-400 font-mono">{store.slug}</div>
                  </TableCell>
                  <TableCell className="text-stone-600 text-sm">
                    {store.user
                      ? `${store.user.firstName || ""} ${store.user.lastName || ""}`.trim() || store.user.email
                      : "—"}
                  </TableCell>
                  <TableCell className="text-stone-500 text-sm">{store.city || "—"}</TableCell>
                  <TableCell>
                    {rev ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{rev.avg.toFixed(1)}</span>
                        <span className="text-stone-400">({rev.count})</span>
                      </div>
                    ) : (
                      <span className="text-stone-400 text-xs">No reviews</span>
                    )}
                  </TableCell>
                  <TableCell className="text-stone-500 text-sm">
                    {format(new Date(store.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell><StatusBadge status={store.status} /></TableCell>
                  <TableCell>
                    <StoreStatusControl storeId={store.id} currentStatus={store.status} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
