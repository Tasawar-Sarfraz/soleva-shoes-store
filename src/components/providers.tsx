"use client";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useShopping } from "@/lib/client-store";
import { api } from "@/lib/api";
import { ExperienceHub } from "./three/experience-hub";
export function Providers() {
  const { data, isPending } = authClient.useSession();
  useEffect(() => {
    if (isPending) return;
    if (!data?.user.id) {
      if (useShopping.getState().wishlistOwner)
        useShopping.getState().setWishlist([]);
      return;
    }
    let active = true;
    (async () => {
      try {
        const state = useShopping.getState();
        const guest = state.wishlistOwner === null ? state.wishlist : [];
        for (const id of guest)
          await api("wishlist", { productId: id, wanted: true });
        const revision = useShopping.getState().wishlistRevision;
        let saved = await api<{ ids: string[] }>("wishlist");
        if (revision !== useShopping.getState().wishlistRevision)
          saved = await api<{ ids: string[] }>("wishlist");
        if (active) useShopping.getState().setWishlist(saved.ids, data.user.id);
      } catch {
        /* Offline state remains available. Individual writes report failures. */
      }
    })();
    return () => {
      active = false;
    };
  }, [data?.user.id, isPending]);
  return <ExperienceHub />;
}
