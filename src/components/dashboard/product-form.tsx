"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productFormSchema, type ProductFormValues } from "@/lib/validators/product";
import { createProduct, updateProduct, deleteProduct } from "@/actions/product.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ImageUpload } from "@/components/dashboard/image-upload";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ProductFormProps {
  initialData?: ProductFormValues & { id: string };
}

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema as any) as any,
    defaultValues: initialData || {
      name: "",
      description: "",
      basePrice: 0,
      productType: "STANDARD",
      imageUrl: "",
      imagePublicId: "",
      variants: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const isCustom = form.watch("productType") === "CUSTOM";

  async function onSubmit(data: ProductFormValues) {
    setIsLoading(true);
    try {
      if (initialData?.id) {
        await updateProduct(initialData.id, data);
        toast.success("Product updated successfully!");
      } else {
        await createProduct(data);
        toast.success("Product created successfully!");
      }
      router.push("/seller/products");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to save product.");
      setIsLoading(false);
    }
  }

  async function onDelete() {
    if (!initialData?.id) return;
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    setIsLoading(true);
    try {
      await deleteProduct(initialData.id);
      toast.success("Product deleted successfully!");
      router.push("/seller/products");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8">
      {/* Basic Details */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Product Image</Label>
          <ImageUpload 
            value={form.watch("imageUrl") || ""} 
            onChange={(url, publicId) => {
              form.setValue("imageUrl", url);
              form.setValue("imagePublicId", publicId);
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input 
            id="name" 
            placeholder="e.g. Classic Chocolate Cake" 
            {...form.register("name")} 
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            placeholder="Describe your product..." 
            className="resize-none"
            rows={3}
            {...form.register("description")} 
          />
        </div>
      </div>

      <div className="h-px bg-stone-200" />

      {/* Pricing & Type */}
      <div className="space-y-6">
        <div className="space-y-3">
          <Label>Product Type *</Label>
          <RadioGroup 
            defaultValue={form.watch("productType")}
            onValueChange={(val: "STANDARD" | "CUSTOM") => form.setValue("productType", val)}
            className="flex flex-col gap-3 sm:flex-row sm:gap-6"
          >
            <div className="flex items-center space-x-2 rounded-lg border border-stone-200 p-4 w-full cursor-pointer hover:bg-stone-50 transition">
              <RadioGroupItem value="STANDARD" id="standard" />
              <Label htmlFor="standard" className="cursor-pointer">
                <span className="block font-medium text-stone-900">Standard Product</span>
                <span className="block text-xs text-stone-500 mt-1">Fixed item, ready to order.</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2 rounded-lg border border-stone-200 p-4 w-full cursor-pointer hover:bg-stone-50 transition">
              <RadioGroupItem value="CUSTOM" id="custom" />
              <Label htmlFor="custom" className="cursor-pointer">
                <span className="block font-medium text-stone-900">Custom Order</span>
                <span className="block text-xs text-stone-500 mt-1">Requires a quote request.</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2 max-w-xs">
          <Label htmlFor="basePrice">Base Price ($) *</Label>
          <Input 
            id="basePrice" 
            type="number"
            step="0.01"
            placeholder="0.00" 
            {...form.register("basePrice")} 
          />
          <p className="text-xs text-stone-500">
            {isCustom ? "Starting price for custom orders." : "The standard price."}
          </p>
          {form.formState.errors.basePrice && (
            <p className="text-sm text-red-500">{form.formState.errors.basePrice.message}</p>
          )}
        </div>
      </div>

      <div className="h-px bg-stone-200" />

      {/* Variants */}
      <div className="space-y-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-stone-900">Variants (Options)</h3>
          <p className="text-sm text-stone-500">Add options like size, flavor, or dietary preferences.</p>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="flex items-end gap-4 p-4 border border-stone-200 rounded-lg bg-stone-50">
            <div className="flex-1 space-y-2">
              <Label>Option Name</Label>
              <Input 
                placeholder="e.g. Large (8 inch)" 
                {...form.register(`variants.${index}.name`)} 
              />
              {form.formState.errors.variants?.[index]?.name && (
                <p className="text-sm text-red-500">{form.formState.errors.variants[index]?.name?.message}</p>
              )}
            </div>
            <div className="w-32 space-y-2">
              <Label>Price Modifier</Label>
              <Input 
                type="number"
                step="0.01"
                placeholder="+0.00" 
                {...form.register(`variants.${index}.priceModifier`)} 
              />
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => remove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button 
          type="button" 
          variant="outline" 
          className="w-full border-dashed text-primary-600 hover:text-primary-700"
          onClick={() => append({ name: "", priceModifier: 0 })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Option
        </Button>
      </div>

      <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-between gap-4">
        {initialData ? (
          <Button type="button" variant="destructive" onClick={onDelete} disabled={isLoading}>
            Delete Product
          </Button>
        ) : (
          <div /> /* Spacer */
        )}
        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/seller/products")} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Save Changes" : "Save Product"}
          </Button>
        </div>
      </div>
    </form>
  );
}
