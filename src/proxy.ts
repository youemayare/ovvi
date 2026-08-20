import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Clerk middleware runs on every matched request to enforce auth and RBAC.
 */

const isSellerRoute = createRouteMatcher(["/seller(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isBuyerRoute = createRouteMatcher(["/buyer(.*)"]);

// All API routes except public webhooks require authentication
const isProtectedApiRoute = createRouteMatcher([
  "/api/((?!webhooks).*)",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // --- Root redirect ---
  if (req.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/marketplace", req.url));
  }

  // --- Seller dashboard routes ---
  if (isSellerRoute(req)) {
    if (!userId) {
      return (await auth()).redirectToSignIn({ returnBackUrl: req.url });
    }
    
    // Always allow access to onboarding regardless of role
    if (req.nextUrl.pathname.startsWith("/seller/onboarding")) {
      return NextResponse.next();
    }

    if (role !== "SELLER" && role !== "ADMIN") {
      // Redirect authenticated non-sellers to the onboarding flow
      return NextResponse.redirect(new URL("/seller/onboarding", req.url));
    }
  }

  // --- Admin routes ---
  if (isAdminRoute(req)) {
    if (!userId) {
      return (await auth()).redirectToSignIn({ returnBackUrl: req.url });
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // --- Buyer dashboard routes ---
  if (isBuyerRoute(req)) {
    if (!userId) {
      return (await auth()).redirectToSignIn({ returnBackUrl: req.url });
    }
  }

  // --- Protected API routes ---
  if (isProtectedApiRoute(req)) {
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
});

export const config = { matcher: [ '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)' ] };
