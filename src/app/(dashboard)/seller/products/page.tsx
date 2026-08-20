import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { products, stores, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Products - Seller Dashboard",
};

export default async function ProductsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await db.query.users.findFirst({
    where: (u) => eq(u.clerkId, userId),
  });

  if (!dbUser) redirect("/seller/onboarding");

  const store = await db.query.stores.findFirst({
    where: (s) => eq(s.userId, dbUser.id),
  });

  if (!store) redirect("/seller/onboarding");

  const storeProducts = await db.query.products.findMany({
    where: (p, { eq, and }) => and(eq(p.storeId, store.id), eq(p.isActive, true)),
    with: {
      images: true,
      variants: {
        where: (v, { eq }) => eq(v.isActive, true)
      },
    },
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900">Products</h1>
          <p className="mt-1 text-stone-500">Manage your menu, prices, and options.</p>
        </div>
        <Button asChild>
          <Link href="/seller/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {storeProducts.length === 0 ? (
        <div className="rounded-xl bg-white border border-stone-200 p-8 text-center shadow-sm">
          <h3 className="text-lg font-medium text-stone-900">No products yet</h3>
          <p className="mt-1 text-sm text-stone-500">Get started by adding your first cake or dessert to the menu.</p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/seller/products/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {storeProducts.map((product) => (
            <Link key={product.id} href={`/seller/products/${product.id}`} className="group relative rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition block cursor-pointer">
              <div className="aspect-[4/3] w-full bg-stone-100 relative">
                {product.images[0] ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-stone-400">
                    No image
                  </div>
                )}
                <div className="absolute top-2 right-2 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-stone-700 backdrop-blur-sm">
                  ${((product.basePrice || 0) / 100).toFixed(2)}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-stone-900">{product.name}</h3>
                <p className="mt-1 text-sm text-stone-500 line-clamp-2">
                  {product.description || "No description"}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-800">
                    {product.type === "STANDARD" ? "Standard" : "Custom"}
                  </span>
                  <span className="text-xs text-stone-500">
                    {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
