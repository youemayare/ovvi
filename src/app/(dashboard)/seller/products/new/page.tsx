import { ProductForm } from "@/components/dashboard/product-form";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "New Product - Seller Dashboard",
};

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/seller/products" 
          className="rounded-full p-2 hover:bg-stone-100 text-stone-500 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900">Add New Product</h1>
          <p className="mt-1 text-sm text-stone-500">Fill out the details below to add a new item to your menu.</p>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-stone-200 p-6 sm:p-8 shadow-sm">
        <ProductForm />
      </div>
    </div>
  );
}
