import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { money } from "@/lib/format";
import { WishlistButton } from "./wishlist-button";
export function ProductCard({
  product,
  currency = "PKR",
  index,
}: {
  product: Product;
  currency?: string;
  index?: number;
}) {
  const colors = [
    ...new Map(product.variants.map((x) => [x.color, x.colorHex])).entries(),
  ];
  const available = product.variants.some((x) => x.stock > 0);
  return (
    <article className="product-card">
      <div className="product-art">
        <span className="product-index">
          {index !== undefined ? String(index + 1).padStart(2, "0") : "SV"} /{" "}
          {product.category.toUpperCase()}
        </span>
        <WishlistButton id={product.id} name={product.name} />
        <Link
          href={`/products/${product.slug}`}
          aria-label={`View ${product.name}`}
        >
          <Image
            src={product.image}
            alt={`${product.name}, original ${product.category.toLowerCase()} illustration`}
            width={700}
            height={480}
            loading={index === undefined || index < 3 ? "eager" : "lazy"}
            className="shoe-image"
          />
        </Link>
        {!available && <span className="sold-label">Currently sold out</span>}
      </div>
      <div className="product-info">
        <div>
          <Link href={`/products/${product.slug}`}>
            <h3>{product.name}</h3>
          </Link>
          <p>
            {product.category} / {colors.length} colours
          </p>
        </div>
        <strong>{money(product.price, currency)}</strong>
      </div>
      <div
        className="color-dots"
        aria-label={`Colours: ${colors.map((x) => x[0]).join(", ")}`}
      >
        {colors.map(([color, hex]) => (
          <span key={color} style={{ background: hex }} title={color} />
        ))}
      </div>
    </article>
  );
}
