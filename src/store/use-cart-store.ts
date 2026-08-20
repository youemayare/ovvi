import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string; // unique item id (could be product.id + variant.id)
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  imageUrl: string | null;
  unitPrice: number; // in cents
  quantity: number;
}

export interface CartStore {
  storeId: string | null;
  storeSlug: string | null;
  items: CartItem[];
  
  // Actions
  addItem: (
    storeId: string, 
    storeSlug: string, 
    item: Omit<CartItem, "id">
  ) => { success: boolean; error?: string };
  
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Computed
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      storeId: null,
      storeSlug: null,
      items: [],

      addItem: (storeId, storeSlug, newItemData) => {
        const { storeId: currentStoreId, items } = get();
        
        // Block mixing items from different stores
        if (currentStoreId && currentStoreId !== storeId && items.length > 0) {
          return { 
            success: false, 
            error: "STORE_MISMATCH" 
          };
        }

        const id = `${newItemData.productId}-${newItemData.variantId || "base"}`;
        
        set((state) => {
          const existingItem = state.items.find((i) => i.id === id);
          
          if (existingItem) {
            return {
              ...state,
              storeId,
              storeSlug,
              items: state.items.map((i) => 
                i.id === id 
                  ? { ...i, quantity: i.quantity + newItemData.quantity } 
                  : i
              )
            };
          }

          return {
            ...state,
            storeId,
            storeSlug,
            items: [...state.items, { ...newItemData, id }]
          };
        });

        return { success: true };
      },

      removeItem: (itemId) => {
        set((state) => {
          const newItems = state.items.filter((i) => i.id !== itemId);
          return {
            items: newItems,
            // Reset store mapping if cart is empty
            storeId: newItems.length === 0 ? null : state.storeId,
            storeSlug: newItems.length === 0 ? null : state.storeSlug,
          };
        });
      },

      updateQuantity: (itemId, quantity) => {
        set((state) => ({
          items: state.items.map((i) => 
            i.id === itemId ? { ...i, quantity } : i
          )
        }));
      },

      clearCart: () => {
        set({ storeId: null, storeSlug: null, items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
      }
    }),
    {
      name: "ovvi-cart-storage",
    }
  )
);
