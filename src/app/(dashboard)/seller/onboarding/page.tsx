import { OnboardingForm } from "@/components/dashboard/onboarding-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // Ensure the user is in our DB
  const dbUser = await db.query.users.findFirst({
    where: (u) => eq(u.clerkId, userId),
  });

  if (!dbUser) {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      redirect("/sign-in");
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      throw new Error("User must have an email address.");
    }

    await db.insert(users).values({
      clerkId: clerkUser.id,
      email: email,
      firstName: clerkUser.firstName || "",
      lastName: clerkUser.lastName || "",
      avatarUrl: clerkUser.imageUrl || "",
    }).onConflictDoNothing({ target: users.clerkId });
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Welcome to Ovvi</CardTitle>
          <CardDescription>
            Let's set up your bakery storefront. You can change these details later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm />
        </CardContent>
      </Card>
    </div>
  );
}
