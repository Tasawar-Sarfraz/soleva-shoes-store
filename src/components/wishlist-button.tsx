"use client";
import { Heart } from "lucide-react";
import { useState } from "react";
import { useShopping } from "@/lib/client-store";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { useHydrated } from "./header";
export function WishlistButton({ id, name }: { id: string; name: string }) {
  const ready = useHydrated();
  const ids = useShopping((s) => s.wishlist);
  const setWish = useShopping((s) => s.setWish);
  const owner = useShopping((s) => s.wishlistOwner);
  const { data, isPending } = authClient.useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const wanted = ready && ids.includes(id);
  return (
    <>
      <button
        className={`wish-button ${wanted ? "selected" : ""}`}
        aria-label={`${wanted ? "Remove" : "Save"} ${name} ${wanted ? "from" : "to"} wishlist`}
        aria-pressed={wanted}
        disabled={isPending || busy || !!(data && owner !== data.user.id)}
        aria-busy={busy}
        onClick={async () => {
          setError("");
          if (data) {
            setBusy(true);
            try {
              await api("wishlist", { productId: id, wanted: !wanted });
            } catch (e) {
              setError((e as Error).message);
              setBusy(false);
              return;
            }
            setBusy(false);
          }
          setWish(id, !wanted);
        }}
      >
        <Heart size={18} fill={wanted ? "currentColor" : "none"} />
      </button>
      {error && (
        <span className="error" role="alert">
          {error}
        </span>
      )}
    </>
  );
}
