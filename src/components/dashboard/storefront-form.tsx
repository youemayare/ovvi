"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { storeUpdateSchema, type StoreUpdateValues } from "@/lib/validators/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/dashboard/image-upload";
import { updateStore } from "@/actions/store.actions";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface StorefrontFormProps {
  store: {
    id: string;
    name: string;
    description: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    city: string | null;
    whatsappNumber: string | null;
    pickupEnabled: boolean;
    pickupInstructions: string | null;
    deliveryEnabled: boolean;
    deliveryFee: number;
  };
}

export function StorefrontForm({ store }: StorefrontFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const form = useForm<StoreUpdateValues>({
    resolver: zodResolver(storeUpdateSchema),
    defaultValues: {
      name: store.name,
      description: store.description || "",
      logoUrl: store.logoUrl,
      bannerUrl: store.bannerUrl,
      city: store.city || "",
      whatsappNumber: store.whatsappNumber || "",
      pickupEnabled: store.pickupEnabled,
      pickupInstructions: store.pickupInstructions || "",
      deliveryEnabled: store.deliveryEnabled,
      deliveryFee: store.deliveryFee ? store.deliveryFee / 100 : 0,
    },
  });

  const onSubmit = async (values: StoreUpdateValues) => {
    try {
      setIsPending(true);
      setError("");
      await updateStore(store.id, values);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update storefront");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      {/* Branding Section */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-6">
        <h2 className="text-xl font-display font-bold text-stone-900">Branding</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label>Logo</Label>
            <ImageUpload 
              value={form.watch("logoUrl") || ""}
              onChange={(url) => form.setValue("logoUrl", url)}
            />
          </div>
          <div className="space-y-3">
            <Label>Banner Image</Label>
            <ImageUpload 
              value={form.watch("bannerUrl") || ""}
              onChange={(url) => form.setValue("bannerUrl", url)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="name">Store Name</Label>
          <Input id="name" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="description">Bio / Description</Label>
          <Textarea 
            id="description" 
            {...form.register("description")} 
            rows={4}
            placeholder="Tell customers about your baking style..."
          />
        </div>
      </div>

      {/* Contact & Location Section */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-6">
        <h2 className="text-xl font-display font-bold text-stone-900">Contact & Location</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="city">City</Label>
            <Input id="city" {...form.register("city")} />
            {form.formState.errors.city && (
              <p className="text-red-500 text-sm">{form.formState.errors.city.message}</p>
            )}
          </div>
          <div className="space-y-3">
            <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
            <Input id="whatsappNumber" {...form.register("whatsappNumber")} placeholder="+1234567890" />
            {form.formState.errors.whatsappNumber && (
              <p className="text-red-500 text-sm">{form.formState.errors.whatsappNumber.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Fulfillment Section */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-6">
        <h2 className="text-xl font-display font-bold text-stone-900">Fulfillment</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Pickup</Label>
              <p className="text-sm text-stone-500">Customers can pick up orders directly from you.</p>
            </div>
            <Switch 
              checked={form.watch("pickupEnabled")}
              onCheckedChange={(val: boolean) => form.setValue("pickupEnabled", val)}
            />
          </div>
          
          {form.watch("pickupEnabled") && (
            <div className="space-y-3 pl-4 border-l-2 border-stone-200">
              <Label htmlFor="pickupInstructions">Pickup Instructions (Location)</Label>
              <Textarea 
                id="pickupInstructions" 
                {...form.register("pickupInstructions")} 
                placeholder="e.g., Downtown area near the main street. Full address provided after order confirmation."
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <div className="space-y-0.5">
              <Label>Offer Delivery</Label>
              <p className="text-sm text-stone-500">You will deliver orders to the customer.</p>
            </div>
            <Switch 
              checked={form.watch("deliveryEnabled")}
              onCheckedChange={(val: boolean) => form.setValue("deliveryEnabled", val)}
            />
          </div>

          {form.watch("deliveryEnabled") && (
            <div className="space-y-3 pl-4 border-l-2 border-stone-200">
              <Label htmlFor="deliveryFee">Delivery Fee ($)</Label>
              <Input 
                id="deliveryFee" 
                type="number"
                step="0.01"
                {...form.register("deliveryFee", { valueAsNumber: true })} 
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button 
          type="submit" 
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Save Storefront"}
        </Button>
      </div>
    </form>
  );
}
