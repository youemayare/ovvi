import { db } from "@/db";
import { availabilityRules, blackoutDates, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AvailabilityEditor } from "./availability-editor";

export const metadata: Metadata = {
  title: "Availability - Seller Dashboard",
};

export default async function AvailabilityPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
    with: { store: true },
  });

  if (!user || !user.store) redirect("/onboarding/store");

  const [rules, blackouts] = await Promise.all([
    db.query.availabilityRules.findMany({
      where: eq(availabilityRules.storeId, user.store.id),
    }),
    db.query.blackoutDates.findMany({
      where: eq(blackoutDates.storeId, user.store.id),
    }),
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900">Availability</h1>
        <p className="mt-1 text-stone-500">
          Control when customers can schedule orders from your store.
        </p>
      </div>

      <AvailabilityEditor
        initialRules={rules.map((r) => ({
          dayOfWeek: r.dayOfWeek,
          isAvailable: r.isAvailable,
          maxOrders: r.maxOrders,
        }))}
        initialBlackouts={blackouts.map((b) => ({
          id: b.id,
          date: b.date,
          reason: b.reason,
        }))}
      />
    </div>
  );
}
