"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Plus,
  Minus,
  ArrowUpRight,
  Box,
  Check,
  Truck,
  Ruler,
} from "lucide-react";
import type { Product } from "@/lib/types";
import { money } from "@/lib/format";
import { useShopping } from "@/lib/client-store";
import { useHydrated } from "./header";
import { WishlistButton } from "./wishlist-button";
import { ExperienceButton } from "./three/experience-button";
export function ProductDetail({
  product,
  currency,
}: {
  product: Product;
  currency: string;
}) {
  const ready = useHydrated();
  const stored = useShopping((s) => s.selections[product.id]);
  const select = useShopping((s) => s.select);
  const add = useShopping((s) => s.add);
  const cart = useShopping((s) => s.cart);
  const initial =
    product.variants.find((v) => v.stock > 0) || product.variants[0];
  const selected =
    product.variants.find((v) => ready && v.sku === stored) || initial;
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [view, setView] = useState(0);
  const colors = [
    ...new Map(product.variants.map((x) => [x.color, x.colorHex])).entries(),
  ];
  const sizes = [...new Set(product.variants.map((x) => x.size))];
  const update = (sku: string) => {
    select(product.id, sku);
    setQuantity(1);
    setMessage("");
  };
  const colorIndex = colors.findIndex(([name]) => name === selected.color);
  const isSeed = /^(sneakers|running|casual|formal|boots)-\d{2}$/.test(
    product.id,
  );
  return (
    <div className="detail-layout">
      <div>
        <div className="detail-art">
          <span className="eyebrow">
            {product.category.toUpperCase()} / ORIGINAL DESIGN ILLUSTRATION
          </span>
          <Image
            src={
              isSeed
                ? `/products/${product.id}-${colorIndex}.svg`
                : product.image
            }
            alt={`${product.name} in ${selected.color}, ${view ? "mirrored" : "side"} illustration`}
            width={700}
            height={480}
            style={{ transform: view ? "scaleX(-1)" : "" }}
            priority
          />
          <ExperienceButton
            className="viewer-pill"
            type="shoe"
            productId={product.id}
          >
            <Box size={17} /> Inspect in 3D <ArrowUpRight size={16} />
          </ExperienceButton>
        </div>
        <div className="gallery-controls">
          <button
            className={view === 0 ? "current" : ""}
            onClick={() => setView(0)}
            aria-pressed={view === 0}
          >
            01 / Side illustration
          </button>
          <button
            className={view === 1 ? "current" : ""}
            onClick={() => setView(1)}
            aria-pressed={view === 1}
          >
            02 / Mirrored composition
          </button>
        </div>
        <details className="size-guide">
          <summary>
            <Ruler size={16} /> Size guide — EU sizing
          </summary>
          <p>
            Measure your foot from heel to longest toe. This fictional size
            guide is illustrative.
          </p>
          <table>
            <thead>
              <tr>
                <th>EU</th>
                <th>Approx. foot length</th>
              </tr>
            </thead>
            <tbody>
              {sizes.map((size) => (
                <tr key={size}>
                  <td>{size}</td>
                  <td>{(24.5 + (size - 39) * 0.65).toFixed(1)} cm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
      <div className="detail-copy">
        <div className="eyebrow">
          THE MOTION ATELIER / {product.category.toUpperCase()}
        </div>
        <h1>{product.name}</h1>
        <div className="detail-price">
          {money(product.price, currency)} <span>Sample catalogue product</span>
        </div>
        <p>{product.description}</p>
        <div className="variant-block">
          <span>
            Colour — <strong>{selected.color}</strong>
          </span>
          <div className="color-options">
            {colors.map(([name, hex]) => (
              <button
                key={name}
                className={name === selected.color ? "selected" : ""}
                style={{ background: hex }}
                aria-label={`Colour ${name}`}
                aria-pressed={name === selected.color}
                onClick={() => {
                  const match =
                    product.variants.find(
                      (v) => v.color === name && v.size === selected.size,
                    ) || product.variants.find((v) => v.color === name)!;
                  update(match.sku);
                }}
              >
                <span className="sr-only">{name}</span>
                {name === selected.color && <Check size={18} />}
              </button>
            ))}
          </div>
        </div>
        <div className="variant-block">
          <div className="flex justify-between">
            <span>Select size / EU</span>
            <a href="#size-info" className="subtle-link">
              Sizing notes
            </a>
          </div>
          <div className="size-options">
            {sizes.map((size) => {
              const match = product.variants.find(
                (v) => v.color === selected.color && v.size === size,
              );
              return (
                <button
                  key={size}
                  aria-label={`Size ${size}${match?.stock === 0 ? " sold out" : ""}`}
                  aria-pressed={size === selected.size}
                  disabled={!match}
                  className={`${size === selected.size ? "selected" : ""} ${match?.stock === 0 ? "no-stock" : ""}`}
                  onClick={() => match && update(match.sku)}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
        <p
          className={`stock-info ${selected.stock === 0 ? "error" : ""}`}
          role="status"
        >
          {selected.stock
            ? `${selected.stock} pairs available in this variant`
            : "This size and colour is sold out."}
        </p>
        <div className="purchase-row">
          <div className="quantity-control">
            <button
              aria-label="Decrease quantity"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity === 1}
            >
              <Minus size={15} />
            </button>
            <span aria-label={`Quantity ${quantity}`}>{quantity}</span>
            <button
              aria-label="Increase quantity"
              onClick={() =>
                setQuantity(Math.min(10, selected.stock, quantity + 1))
              }
              disabled={quantity >= Math.min(10, selected.stock)}
            >
              <Plus size={15} />
            </button>
          </div>
          <button
            className="btn btn-dark"
            disabled={!selected.stock}
            onClick={() => {
              const already =
                cart.find((x) => x.sku === selected.sku)?.quantity || 0;
              if (already + quantity > Math.min(10, selected.stock)) {
                setMessage(
                  "Your bag already contains this variant. Review the bag quantity.",
                );
                return;
              }
              add(selected.sku, quantity);
              setMessage("Added to your bag.");
            }}
          >
            Add to bag <ArrowUpRight size={18} />
          </button>
          <WishlistButton id={product.id} name={product.name} />
        </div>
        {message && (
          <div className="notice" role="status">
            {message} <Link href="/cart">View bag →</Link>
          </div>
        )}
        <div className="delivery-note">
          <Truck size={17} />
          <span>Cash on delivery · Shipping calculated in your bag</span>
        </div>
        <details open id="size-info" className="product-details">
          <summary>Materials & construction</summary>
          <p>{product.materials}</p>
          <p>
            The 3D model is a reusable category design configured for this
            product, not an individual scan. Experimental colours and monograms
            are previews.
          </p>
        </details>
        <details className="product-details">
          <summary>Care & sizing</summary>
          <p>
            Use a soft, damp cloth and air dry. Our sample sizes use EU 39–44;
            measure both feet and compare the size guide. Real care instructions
            should be supplied by the actual manufacturer.
          </p>
        </details>
      </div>
    </div>
  );
}
