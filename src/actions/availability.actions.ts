"use server";

import { db } from "@/db";
import { availabilityRules, blackoutDates, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function saveAvailabilityRules(
  rules: { dayOfWeek: number; isAvailable: boolean; maxOrders: number | null }[]
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
    with: { store: true },
  });
  if (!user?.store) throw new Error("Store not found");

  const storeId = user.store.id;

  // Upsert each rule
  for (const rule of rules) {
    const existing = await db.query.availabilityRules.findFirst({
      where: and(
        eq(availabilityRules.storeId, storeId),
        eq(availabilityRules.dayOfWeek, rule.dayOfWeek)
      ),
    });

    if (existing) {
      await db
        .update(availabilityRules)
        .set({ isAvailable: rule.isAvailable, maxOrders: rule.maxOrders })
        .where(eq(availabilityRules.id, existing.id));
    } else {
      await db.insert(availabilityRules).values({
        storeId,
        dayOfWeek: rule.dayOfWeek,
        isAvailable: rule.isAvailable,
        maxOrders: rule.maxOrders,
      });
    }
  }

  revalidatePath("/seller/availability");
  return { success: true };
}

export async function addBlackoutDate(date: string, reason?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
    with: { store: true },
  });
  if (!user?.store) throw new Error("Store not found");

  await db.insert(blackoutDates).values({
    storeId: user.store.id,
    date,
    reason: reason || null,
  });

  revalidatePath("/seller/availability");
  return { success: true };
}

export async function removeBlackoutDate(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
    with: { store: true },
  });
  if (!user?.store) throw new Error("Store not found");

  await db
    .delete(blackoutDates)
    .where(
      and(
        eq(blackoutDates.id, id),
        eq(blackoutDates.storeId, user.store.id)
      )
    );

  revalidatePath("/seller/availability");
  return { success: true };
}
