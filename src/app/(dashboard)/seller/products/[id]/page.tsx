import type { Metadata } from "next";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ProductForm } from "@/components/dashboard/product-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Edit Product - Seller Dashboard",
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const product = await db.query.products.findFirst({
    where: and(eq(products.id, id), eq(products.storeId, store.id)),
    with: {
      images: true,
      variants: {
        where: (v, { eq }) => eq(v.isActive, true)
      },
    },
  });

  if (!product || !product.isActive) {
    redirect("/seller/products");
  }

  // Format for the form
  const initialData = {
    id: product.id,
    name: product.name,
    description: product.description || "",
    basePrice: (product.basePrice || 0) / 100,
    productType: product.type as "STANDARD" | "CUSTOM",
    imageUrl: product.images[0]?.url || "",
    imagePublicId: product.images[0]?.publicId || "",
    variants: product.variants.map(v => ({
      id: v.id,
      name: v.name,
      priceModifier: v.priceModifier / 100,
    })),
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/seller/products"
          className="text-stone-500 hover:text-stone-900 transition flex items-center justify-center p-2 -ml-2 rounded-md hover:bg-stone-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900">Edit Product</h1>
          <p className="mt-1 text-sm text-stone-500">Update your product details and pricing.</p>
        </div>
      </div>
      
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <ProductForm initialData={initialData} />
      </div>
    </div>
  );
}
