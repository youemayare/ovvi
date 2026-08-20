"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@clerk/nextjs";
import { storeOnboardingSchema, type StoreOnboardingValues } from "@/lib/validators/store";
import { createStore } from "@/actions/store.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function OnboardingForm() {
  const router = useRouter();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<StoreOnboardingValues>({
    resolver: zodResolver(storeOnboardingSchema),
    defaultValues: {
      name: "",
      description: "",
      city: "",
      whatsappNumber: "",
      cashEnabled: true,
    },
  });

  async function onSubmit(data: StoreOnboardingValues) {
    setIsLoading(true);
    try {
      await createStore(data);
      await user?.reload();
      toast.success("Store created successfully!");
      router.push("/seller");
    } catch (error: any) {
      toast.error(error.message || "Failed to create store.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Store Name *</Label>
        <Input 
          id="name" 
          placeholder="My Awesome Bakery" 
          {...form.register("name")} 
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Input 
          id="description" 
          placeholder="Specializing in custom cakes..." 
          {...form.register("description")} 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">City *</Label>
        <Input 
          id="city" 
          placeholder="New York" 
          {...form.register("city")} 
        />
        {form.formState.errors.city && (
          <p className="text-sm text-red-500">{form.formState.errors.city.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsappNumber">WhatsApp Number *</Label>
        <Input 
          id="whatsappNumber" 
          type="tel"
          placeholder="+1234567890" 
          {...form.register("whatsappNumber")} 
        />
        <p className="text-xs text-muted-foreground">
          Used to receive custom quote requests from buyers.
        </p>
        {form.formState.errors.whatsappNumber && (
          <p className="text-sm text-red-500">{form.formState.errors.whatsappNumber.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox 
          id="cashEnabled" 
          checked={form.watch("cashEnabled")}
          onCheckedChange={(checked) => form.setValue("cashEnabled", checked as boolean)}
        />
        <Label htmlFor="cashEnabled" className="cursor-pointer">
          Accept Cash on Delivery/Pickup
        </Label>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Store
      </Button>
    </form>
  );
}
