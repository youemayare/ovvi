"use server";

import { db } from "@/db";
import { stores } from "@/db/schema";
import { storeOnboardingSchema, storeUpdateSchema, type StoreOnboardingValues, type StoreUpdateValues } from "@/lib/validators/store";
import { generateStoreSlug } from "@/lib/utils";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

export async function createStore(values: StoreOnboardingValues) {
  // 1. Authenticate user
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // 2. Validate input
  const parsed = storeOnboardingSchema.safeParse(values);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const data = parsed.data;

  // 3. Get the database user_id using the clerk_id
  const dbUser = await db.query.users.findFirst({
    where: (u) => eq(u.clerkId, userId),
  });

  if (!dbUser) {
     throw new Error("User record not found in database.");
  }

  // 4. Check if store already exists for user
  const existingStore = await db.query.stores.findFirst({
    where: (s) => eq(s.userId, dbUser.id),
  });

  if (existingStore) {
    throw new Error("You already have a store.");
  }

  // 5. Generate slug & Insert Store
  const slug = generateStoreSlug(data.name);

  const [newStore] = await db.insert(stores).values({
    userId: dbUser.id,
    name: data.name,
    slug,
    description: data.description,
    city: data.city,
    whatsappNumber: data.whatsappNumber,
    cashEnabled: data.cashEnabled,
    status: "ONBOARDING",
  }).returning();

  // 5. Update Clerk role metadata to SELLER
  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: {
      role: "SELLER",
      storeId: newStore.id,
      storeSlug: newStore.slug,
    },
  });

  revalidatePath("/");
  return { success: true };
}

export async function updateStore(storeId: string, values: StoreUpdateValues) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const dbUser = await db.query.users.findFirst({
    where: (u) => eq(u.clerkId, userId),
  });

  if (!dbUser) {
    throw new Error("User not found");
  }

  // Ensure this store belongs to the logged-in user
  const existingStore = await db.query.stores.findFirst({
    where: (s) => eq(s.id, storeId),
  });

  if (!existingStore || existingStore.userId !== dbUser.id) {
    throw new Error("Unauthorized to edit this store");
  }

  const parsed = storeUpdateSchema.safeParse(values);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  await db
    .update(stores)
    .set({
      name: parsed.data.name,
      description: parsed.data.description,
      logoUrl: parsed.data.logoUrl,
      bannerUrl: parsed.data.bannerUrl,
      city: parsed.data.city,
      whatsappNumber: parsed.data.whatsappNumber,
      pickupEnabled: parsed.data.pickupEnabled,
      pickupInstructions: parsed.data.pickupInstructions,
      deliveryEnabled: parsed.data.deliveryEnabled,
      deliveryFee: parsed.data.deliveryFee ? parsed.data.deliveryFee * 100 : 0, // save as cents
    })
    .where(eq(stores.id, storeId));

  revalidatePath("/seller/storefront");
  revalidatePath(`/store/${existingStore.slug}`);

  return { success: true };
}
