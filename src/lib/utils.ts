import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { nanoid } from "nanoid";

/**
 * Merge Tailwind classes intelligently, resolving conflicts.
 * Required by all Shadcn UI components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a monetary value from cents to a locale-aware currency string.
 * @example formatCurrency(1999, 'USD') → "$19.99"
 */
export function formatCurrency(
  cents: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Generates a human-readable order number.
 * Format: OVV-YYYYMMDD-XXXXX (e.g. OVV-20260629-A3X7K)
 */
export function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = nanoid(5).toUpperCase();
  return `OVV-${date}-${suffix}`;
}

/**
 * Generates a slug from a store name.
 * Lowercase, spaces → hyphens, strips non-alphanumeric characters.
 * A random suffix prevents duplicates on common names.
 */
export function generateStoreSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
  const suffix = nanoid(4).toLowerCase();
  return `${base}-${suffix}`;
}

/**
 * Builds a WhatsApp wa.me link with a pre-filled message.
 */
export function buildWhatsAppLink(
  phoneNumber: string,
  storeName: string
): string {
  const message = `Hi! 👋 I'm interested in a custom order from ${storeName} on Ovvi.

Here's what I'm looking for:
- Occasion: 
- Date needed: 
- Servings/Size: 
- Flavor preferences: 
- Dietary requirements: 

Looking forward to hearing from you! 🎂`;

  const normalized = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates a secure random checkout token for custom quote links.
 * 32-character URL-safe string.
 */
export function generateCheckoutToken(): string {
  return nanoid(32);
}

/**
 * Returns a quote expiration Date from now.
 * Default: 72 hours (per pending_resolutions.md default).
 */
export function getQuoteExpiryDate(hours: number = 72): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/**
 * Truncates a string to a max length, appending "…".
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 1)}…`;
}
