import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProducts, getSettings } from "@/server/store";
import { ProductDetail } from "@/components/product-detail";
import { ProductCard } from "@/components/product-card";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = getProduct((await params).slug);
  return {
    title: product?.name || "Product not found",
    description: product?.description,
  };
}
export default async function ProductPage({ params }: Props) {
  const product = getProduct((await params).slug);
  if (!product) notFound();
  const config = getSettings();
  return (
    <div className="section product-section">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/shop">Collection</Link>
        <span>/</span>
        <Link href={`/shop?category=${product.category}`}>
          {product.category}
        </Link>
        <span>/</span>
        <span>{product.name}</span>
      </nav>
      <ProductDetail product={product} currency={config.currency} />
      <div className="related-products">
        <div className="section-heading">
          <h2>A shared direction.</h2>
          <Link
            className="text-btn"
            href={`/shop?category=${product.category}`}
          >
            More {product.category.toLowerCase()} ↗
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {getProducts()
            .filter(
              (p) => p.category === product.category && p.id !== product.id,
            )
            .slice(0, 4)
            .map((p) => (
              <ProductCard key={p.id} product={p} currency={config.currency} />
            ))}
        </div>
      </div>
    </div>
  );
}
