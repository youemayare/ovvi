import * as z from "zod";

export const productVariantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Variant name is required").max(50),
  priceModifier: z.coerce.number().default(0),
});

export const productFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().max(1000).optional(),
  basePrice: z.coerce.number().min(0, "Price cannot be negative"),
  productType: z.enum(["STANDARD", "CUSTOM"]),
  imageUrl: z.string().optional(),
  imagePublicId: z.string().optional(),
  variants: z.array(productVariantSchema).default([]),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
