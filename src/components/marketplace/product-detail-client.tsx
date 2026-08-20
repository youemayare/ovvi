"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { X, Check } from "lucide-react";
import { useCartStore } from "@/store/use-cart-store";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ProductWithRelations = {
  id: string;
  name: string;
  description: string | null;
  basePrice: number | null;
  type: "STANDARD" | "CUSTOM";
  images: { id: string; url: string }[];
  variants: { id: string; name: string; priceModifier: number }[];
};

export function ProductDetailClient({ 
  product, 
  store 
}: { 
  product: ProductWithRelations;
  store: { id: string; slug: string; name: string; whatsappNumber: string | null }
}) {
  const cart = useCartStore();
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    product.variants.length > 0 ? product.variants[0].id : undefined
  );
  
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  
  // WhatsApp form state
  const [waDate, setWaDate] = useState("");
  const [waDetails, setWaDetails] = useState("");

  // Calculate the final price to display
  const basePriceDollars = product.basePrice ? product.basePrice / 100 : 0;
  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);
  const variantModifierDollars = selectedVariant ? selectedVariant.priceModifier / 100 : 0;
  
  const finalPrice = basePriceDollars + variantModifierDollars;
  const finalPriceCents = (product.basePrice || 0) + (selectedVariant?.priceModifier || 0);

  const handleAddToCart = () => {
    const result = cart.addItem(store.id, store.slug, {
      productId: product.id,
      variantId: selectedVariantId || null,
      productName: product.name,
      variantName: selectedVariant?.name || null,
      imageUrl: product.images[0]?.url || null,
      unitPrice: finalPriceCents,
      quantity: 1,
    });

    if (!result.success && result.error === "STORE_MISMATCH") {
      setShowClearCartModal(true);
    } else {
      toast.success("Added to your order", {
        description: `${product.name} ${selectedVariant ? `(${selectedVariant.name})` : ""}`,
      });
    }
  };

  const handleClearAndAdd = () => {
    cart.clearCart();
    cart.addItem(store.id, store.slug, {
      productId: product.id,
      variantId: selectedVariantId || null,
      productName: product.name,
      variantName: selectedVariant?.name || null,
      imageUrl: product.images[0]?.url || null,
      unitPrice: finalPriceCents,
      quantity: 1,
    });
    setShowClearCartModal(false);
    toast.success("Added to your order", {
      description: `${product.name} ${selectedVariant ? `(${selectedVariant.name})` : ""}`,
    });
  };

  const handleRequestQuote = () => {
    if (!store.whatsappNumber) {
      toast.error("This baker hasn't set up their WhatsApp number yet.");
      return;
    }
    setShowWhatsAppModal(true);
  };

  const submitWhatsAppQuote = () => {
    // Generate pre-formatted message
    let message = `Hi ${store.name}! I'd like to request a custom quote from your Ovvi store.\n\n`;
    message += `*Product:* ${product.name}\n`;
    message += `*Link:* ${window.location.href}\n\n`;
    if (waDate) message += `*Requested Date:* ${waDate}\n`;
    if (waDetails) message += `*Details:* ${waDetails}\n`;
    
    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${store.whatsappNumber?.replace(/[^0-9]/g, "")}?text=${encodedMessage}`;
    
    window.open(waUrl, "_blank");
    setShowWhatsAppModal(false);
    setWaDate("");
    setWaDetails("");
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        {/* Main Product Info */}
        <div className="flex flex-col md:flex-row">
          {/* Main Image */}
          <div className="w-full md:w-1/2 aspect-square md:border-r border-stone-200 relative bg-stone-100 cursor-pointer"
               onClick={() => product.images[0] && setLightboxImage(product.images[0].url)}>
            {product.images[0] ? (
              <Image 
                src={product.images[0].url} 
                alt={product.name} 
                fill 
                className="object-cover hover:scale-105 transition-transform duration-500" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-400">
                No image available
              </div>
            )}
          </div>
          
          {/* Details & Selection */}
          <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col">
            <h1 className="font-display text-3xl font-bold text-stone-900">{product.name}</h1>
            
            <div className="mt-4 text-2xl font-medium text-stone-900">
              {product.type === "STANDARD" ? `$${finalPrice.toFixed(2)}` : "Custom Quote"}
            </div>

            {product.description && (
              <p className="mt-6 text-stone-600 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Variants */}
            {product.variants.length > 0 && product.type === "STANDARD" && (
              <div className="mt-8 border-t border-stone-200 pt-6">
                <h3 className="text-sm font-semibold text-stone-900 mb-4 uppercase tracking-wider">Options</h3>
                <RadioGroup 
                  value={selectedVariantId} 
                  onValueChange={setSelectedVariantId}
                  className="space-y-3"
                >
                  {product.variants.map((variant) => (
                    <div key={variant.id} className="flex items-center space-x-3">
                      <RadioGroupItem value={variant.id} id={`variant-${variant.id}`} />
                      <Label 
                        htmlFor={`variant-${variant.id}`}
                        className="flex-1 cursor-pointer font-medium text-stone-700"
                      >
                        {variant.name}
                        {variant.priceModifier > 0 && (
                          <span className="text-stone-500 ml-2">(+${(variant.priceModifier / 100).toFixed(2)})</span>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            <div className="mt-auto pt-8">
              {product.type === "STANDARD" ? (
                <Button size="lg" className="w-full h-14 text-lg" onClick={handleAddToCart}>
                  Add to Order
                </Button>
              ) : (
                <Button size="lg" className="w-full h-14 text-lg" onClick={handleRequestQuote}>
                  Request Quote
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Additional Images Grid (Instagram style) */}
        {product.images.length > 1 && (
          <div className="border-t border-stone-200 bg-stone-50 p-6 sm:p-8">
            <h3 className="font-display text-xl font-bold text-stone-900 mb-6">More Photos</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
               {product.images.slice(1).map((img, index) => (
                <div 
                  key={img.id} 
                  className="aspect-square relative rounded-xl overflow-hidden cursor-pointer group bg-stone-200 shadow-sm"
                  onClick={() => setLightboxImage(img.url)}
                >
                  <Image 
                    src={img.url} 
                    alt={`${product.name} gallery image ${index + 1}`} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox / Modal View */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={() => setLightboxImage(null)}>
          <button 
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxImage(null);
            }}
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative w-full max-w-4xl max-h-[90vh] aspect-square sm:aspect-auto sm:h-[85vh]">
            <Image 
              src={lightboxImage} 
              alt="Enlarged view" 
              fill 
              className="object-contain" 
            />
          </div>
        </div>
      )}

      {/* Clear Cart Warning Modal */}
      <Dialog open={showClearCartModal} onOpenChange={setShowClearCartModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a new order?</DialogTitle>
            <DialogDescription>
              Your cart currently contains items from another bakery. You can only order from one bakery at a time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowClearCartModal(false)}>Cancel</Button>
            <Button variant="default" onClick={handleClearAndAdd}>Clear Cart & Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Quote Modal */}
      <Dialog open={showWhatsAppModal} onOpenChange={setShowWhatsAppModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Custom Quote</DialogTitle>
            <DialogDescription>
              We'll draft a WhatsApp message for you to send directly to the baker.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date Needed</Label>
              <Input 
                type="date" 
                value={waDate}
                onChange={(e) => setWaDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Details & Requirements</Label>
              <Textarea 
                placeholder="E.g., I'd like a 2-tier cake with a dinosaur theme for a 5-year-old. Vanilla sponge with chocolate filling."
                rows={4}
                value={waDetails}
                onChange={(e) => setWaDetails(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWhatsAppModal(false)}>Cancel</Button>
            <Button variant="default" onClick={submitWhatsAppQuote}>Open WhatsApp</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
