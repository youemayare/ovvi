"use server";

import { db } from "@/db";
import { products, productVariants, productImages, stores, users } from "@/db/schema";
import { productFormSchema, type ProductFormValues } from "@/lib/validators/product";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createProduct(values: ProductFormValues) {
  // 1. Authenticate user
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // 2. Validate input
  const parsed = productFormSchema.safeParse(values);
  if (!parsed.success) {
    throw new Error("Invalid product data");
  }
  const data = parsed.data;

  // 3. Find the internal DB user and their store
  const dbUser = await db.query.users.findFirst({
    where: (u) => eq(u.clerkId, userId),
  });

  if (!dbUser) {
    throw new Error("User record not found");
  }

  const store = await db.query.stores.findFirst({
    where: (s) => eq(s.userId, dbUser.id),
  });

  if (!store) {
    throw new Error("Store not found. Please complete onboarding.");
  }

  // 4. Insert the product
  const [newProduct] = await db.insert(products).values({
    storeId: store.id,
    name: data.name,
    description: data.description || null,
    basePrice: Math.round(data.basePrice * 100), // convert to cents
    type: data.productType,
    isActive: true,
  }).returning();

  // 5. Insert image if any
  if (data.imageUrl && data.imagePublicId) {
    await db.insert(productImages).values({
      productId: newProduct.id,
      url: data.imageUrl,
      publicId: data.imagePublicId,
    });
  }

  // 6. Insert variants if any
  if (data.variants && data.variants.length > 0) {
    const variantValues = data.variants.map((v) => ({
      productId: newProduct.id,
      name: v.name,
      priceModifier: Math.round(v.priceModifier * 100), // convert to cents
    }));
    await db.insert(productVariants).values(variantValues);
  }

  revalidatePath("/seller/products");
  return { success: true, productId: newProduct.id };
}

export async function updateProduct(productId: string, values: ProductFormValues) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = productFormSchema.safeParse(values);
  if (!parsed.success) throw new Error("Invalid product data");
  const data = parsed.data;

  const dbUser = await db.query.users.findFirst({
    where: (u) => eq(u.clerkId, userId),
  });
  if (!dbUser) throw new Error("User record not found");

  const store = await db.query.stores.findFirst({
    where: (s) => eq(s.userId, dbUser.id),
  });
  if (!store) throw new Error("Store not found");

  const { and, notInArray } = await import("drizzle-orm");

  const product = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.storeId, store.id)),
  });
  if (!product) throw new Error("Product not found");

  await db.update(products).set({
    name: data.name,
    description: data.description || null,
    basePrice: Math.round(data.basePrice * 100),
    type: data.productType,
  }).where(eq(products.id, productId));

  const existingImage = await db.query.productImages.findFirst({
    where: eq(productImages.productId, productId)
  });
  
  if (data.imageUrl && data.imagePublicId) {
    if (existingImage) {
      await db.update(productImages).set({
        url: data.imageUrl,
        publicId: data.imagePublicId,
      }).where(eq(productImages.productId, productId));
    } else {
      await db.insert(productImages).values({
        productId,
        url: data.imageUrl,
        publicId: data.imagePublicId,
      });
    }
  }

  const formVariantIds = data.variants.map((v) => v.id).filter(Boolean) as string[];

  // 1. Soft delete variants omitted from the form
  if (formVariantIds.length > 0) {
    await db.update(productVariants)
      .set({ isActive: false })
      .where(and(
        eq(productVariants.productId, productId), 
        notInArray(productVariants.id, formVariantIds)
      ));
  } else {
    // If empty, soft delete all
    await db.update(productVariants)
      .set({ isActive: false })
      .where(eq(productVariants.productId, productId));
  }

  // 2. Update existing & Insert new
  for (const v of data.variants) {
    if (v.id) {
      await db.update(productVariants).set({
        name: v.name,
        priceModifier: Math.round(v.priceModifier * 100),
        isActive: true,
      }).where(and(
        eq(productVariants.id, v.id),
        eq(productVariants.productId, productId)
      ));
    } else {
      await db.insert(productVariants).values({
        productId,
        name: v.name,
        priceModifier: Math.round(v.priceModifier * 100),
      });
    }
  }
  
  revalidatePath("/seller/products");
  return { success: true };
}

export async function deleteProduct(productId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await db.query.users.findFirst({
    where: (u) => eq(u.clerkId, userId),
  });
  if (!dbUser) throw new Error("User record not found");

  const store = await db.query.stores.findFirst({
    where: (s) => eq(s.userId, dbUser.id),
  });
  if (!store) throw new Error("Store not found");

  const { and } = await import("drizzle-orm");

  const product = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.storeId, store.id)),
  });
  if (!product) throw new Error("Product not found");

  await db.update(products).set({ isActive: false }).where(eq(products.id, productId));
  
  revalidatePath("/seller/products");
  return { success: true };
}
