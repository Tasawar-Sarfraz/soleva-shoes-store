"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "./types";
export type Experience = "shoe" | "lab" | "showroom" | "locations" | "brand";
type ShoppingState = {
  cart: CartLine[];
  wishlist: string[];
  wishlistOwner: string | null;
  wishlistRevision: number;
  selections: Record<string, string>;
  reduceEffects: boolean;
  quality: "low" | "high";
  experience: { type: Experience; productId?: string } | null;
  add: (sku: string, quantity: number) => void;
  setQuantity: (sku: string, quantity: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
  toggleWish: (id: string) => void;
  setWish: (id: string, wanted: boolean) => void;
  setWishlist: (ids: string[], owner?: string | null) => void;
  select: (id: string, sku: string) => void;
  setReduceEffects: (value: boolean) => void;
  setQuality: (value: "low" | "high") => void;
  open: (type: Experience, productId?: string) => void;
  close: () => void;
};
export const useShopping = create<ShoppingState>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
      wishlistOwner: null,
      wishlistRevision: 0,
      selections: {},
      reduceEffects: false,
      quality: "low",
      experience: null,
      add: (sku, quantity) =>
        set((state) => ({
          cart: state.cart.some((x) => x.sku === sku)
            ? state.cart.map((x) =>
                x.sku === sku
                  ? { ...x, quantity: Math.min(10, x.quantity + quantity) }
                  : x,
              )
            : [...state.cart, { sku, quantity: Math.min(10, quantity) }],
        })),
      setQuantity: (sku, quantity) =>
        set((state) => ({
          cart: state.cart.map((x) =>
            x.sku === sku
              ? { ...x, quantity: Math.max(1, Math.min(10, quantity)) }
              : x,
          ),
        })),
      remove: (sku) =>
        set((state) => ({ cart: state.cart.filter((x) => x.sku !== sku) })),
      clear: () => set({ cart: [] }),
      toggleWish: (id) =>
        set((state) => ({
          wishlistRevision: state.wishlistRevision + 1,
          wishlist: state.wishlist.includes(id)
            ? state.wishlist.filter((x) => x !== id)
            : [...state.wishlist, id],
        })),
      setWish: (id, wanted) =>
        set((state) => ({
          wishlistRevision: state.wishlistRevision + 1,
          wishlist: wanted
            ? [...new Set([...state.wishlist, id])]
            : state.wishlist.filter((x) => x !== id),
        })),
      setWishlist: (ids, owner = null) =>
        set({ wishlist: [...new Set(ids)], wishlistOwner: owner }),
      select: (id, sku) =>
        set((state) => ({ selections: { ...state.selections, [id]: sku } })),
      setReduceEffects: (reduceEffects) => set({ reduceEffects }),
      setQuality: (quality) => set({ quality }),
      open: (type, productId) => set({ experience: { type, productId } }),
      close: () => set({ experience: null }),
    }),
    {
      name: "soleva-shopping-v1",
      partialize: (state) => ({
        cart: state.cart,
        wishlist: state.wishlist,
        wishlistOwner: state.wishlistOwner,
        selections: state.selections,
        reduceEffects: state.reduceEffects,
        quality: state.quality,
      }),
    },
  ),
);
