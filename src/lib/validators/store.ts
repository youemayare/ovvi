import * as z from "zod";

export const storeOnboardingSchema = z.object({
  name: z.string().min(2, "Store name must be at least 2 characters."),
  description: z.string().optional(),
  city: z.string().min(2, "City is required."),
  whatsappNumber: z.string().min(10, "Please enter a valid WhatsApp number."),
  cashEnabled: z.boolean(),
});

export type StoreOnboardingValues = z.infer<typeof storeOnboardingSchema>;

export const storeUpdateSchema = z.object({
  name: z.string().min(2, "Store name must be at least 2 characters."),
  description: z.string().optional(),
  logoUrl: z.string().nullable().optional(),
  bannerUrl: z.string().nullable().optional(),
  city: z.string().min(2, "City is required."),
  whatsappNumber: z.string().min(10, "Please enter a valid WhatsApp number."),
  pickupEnabled: z.boolean(),
  pickupInstructions: z.string().nullable().optional(),
  deliveryEnabled: z.boolean(),
  deliveryFee: z.number().min(0).optional(),
});

export type StoreUpdateValues = z.infer<typeof storeUpdateSchema>;
