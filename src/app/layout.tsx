import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Inter, Outfit, Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ovvi — Order Local Homemade Desserts",
    template: "%s | Ovvi",
  },
  description:
    "Discover and order from the best local home bakers near you. Custom cakes, dessert boxes, and handmade treats — delivered or ready for pickup.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://ovvi.com"
  ),
  openGraph: {
    type: "website",
    siteName: "Ovvi",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={cn(inter.variable, outfit.variable, "font-sans", geist.variable)}
        suppressHydrationWarning
      >
        <body className="font-sans antialiased bg-background text-foreground">
          {children}
          <Toaster position="bottom-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
