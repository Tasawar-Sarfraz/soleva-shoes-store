"use client";
import Link from "next/link";
import { useShopping } from "@/lib/client-store";
import { useHydrated } from "./header";
import { ProductCard } from "./product-card";
import type { Product } from "@/lib/types";
export function Wishlist({
  products,
  currency,
}: {
  products: Product[];
  currency: string;
}) {
  const ids = useShopping((s) => s.wishlist);
  const ready = useHydrated();
  const saved = products.filter((p) => ids.includes(p.id));
  if (!ready) return <p role="status">Loading your saved designs…</p>;
  return saved.length ? (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {saved.map((product) => (
        <ProductCard key={product.id} product={product} currency={currency} />
      ))}
    </div>
  ) : (
    <div className="empty-state">
      <h2>Keep something in mind.</h2>
      <p>
        Tap the heart on a design to save it here. Sign in to sync your wishlist
        to the database.
      </p>
      <Link className="btn btn-dark" href="/shop">
        Discover the collection ↗
      </Link>
    </div>
  );
}
