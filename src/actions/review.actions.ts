"use server";

import { db } from "@/db";
import { reviews, reports, orders, users, stores } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ReviewSchema = z.object({
  orderId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function submitReview(input: {
  orderId: string;
  rating: number;
  comment?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = ReviewSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });
  if (!user) throw new Error("User not found");

  // Verify order belongs to this buyer and is completed
  const order = await db.query.orders.findFirst({
    where: and(
      eq(orders.id, input.orderId),
      eq(orders.buyerId, user.id),
      eq(orders.status, "COMPLETED")
    ),
  });
  if (!order) throw new Error("Order not found or not yet completed");

  // Check no review already exists
  const existing = await db.query.reviews.findFirst({
    where: eq(reviews.orderId, input.orderId),
  });
  if (existing) throw new Error("You have already reviewed this order");

  await db.insert(reviews).values({
    orderId: input.orderId,
    storeId: order.storeId,
    buyerId: user.id,
    rating: input.rating,
    comment: input.comment?.trim() || null,
  });

  revalidatePath(`/buyer/orders/${input.orderId}`);
  revalidatePath(`/store`);
  return { success: true };
}

const ReportSchema = z.object({
  storeId: z.string().uuid(),
  reason: z.string().min(5).max(200),
  details: z.string().max(2000).optional(),
});

export async function reportStore(input: {
  storeId: string;
  reason: string;
  details?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = ReportSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });
  if (!user) throw new Error("User not found");

  await db.insert(reports).values({
    storeId: input.storeId,
    reporterId: user.id,
    reason: input.reason,
    details: input.details?.trim() || null,
  });

  return { success: true };
}

export async function updateReportStatus(
  reportId: string,
  status: "OPEN" | "REVIEWED" | "RESOLVED"
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });
  if (!user || user.role !== "ADMIN") throw new Error("Admin only");

  await db
    .update(reports)
    .set({ status })
    .where(eq(reports.id, reportId));

  revalidatePath("/admin/reports");
  return { success: true };
}

export async function updateStoreStatus(
  storeId: string,
  status: "ACTIVE" | "SUSPENDED" | "PENDING_REVIEW"
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });
  if (!user || user.role !== "ADMIN") throw new Error("Admin only");

  await db
    .update(stores)
    .set({ status })
    .where(eq(stores.id, storeId));

  revalidatePath("/admin/sellers");
  return { success: true };
}
