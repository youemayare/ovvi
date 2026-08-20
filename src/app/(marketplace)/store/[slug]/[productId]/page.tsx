import { db } from "@/db";
import { stores, products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductDetailClient } from "@/components/marketplace/product-detail-client";

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string; productId: string }> 
}): Promise<Metadata> {
  const { productId } = await params;
  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
    with: {
      store: true,
    }
  });

  if (!product || !product.isActive) return { title: "Product Not Found" };

  return {
    title: `${product.name} | ${product.store.name}`,
    description: product.description || `Order ${product.name} from ${product.store.name}.`,
  };
}

// Server Component: Fetches the specific product and passes it to the client component.
// Using a Server Component here for fast initial load and SEO, while the interactive variant
// selector and image gallery will be handled by the nested Client Component.
export default async function PublicProductPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}) {
  const { slug, productId } = await params;

  // 1. Fetch store
  const store = await db.query.stores.findFirst({
    where: eq(stores.slug, slug),
  });

  if (!store) {
    notFound();
  }

  // 2. Fetch product (ensuring it belongs to this store and is active)
  const product = await db.query.products.findFirst({
    where: and(
      eq(products.id, productId),
      eq(products.storeId, store.id),
      eq(products.isActive, true)
    ),
    with: {
      images: true,
      variants: {
        where: (v, { eq }) => eq(v.isActive, true),
      },
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="bg-stone-50 min-h-screen pb-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Back Navigation */}
        <Link 
          href={`/store/${store.slug}`}
          className="inline-flex items-center text-sm font-medium text-stone-500 hover:text-stone-900 transition mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {store.name}
        </Link>
        
        {/* Render Interactive Client Component */}
        <ProductDetailClient 
          product={product} 
          store={{
            id: store.id,
            slug: store.slug,
            name: store.name,
            whatsappNumber: store.whatsappNumber
          }} 
        />
      </div>
    </div>
  );
}
