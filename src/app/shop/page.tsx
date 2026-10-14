import type { Metadata } from "next";
import { getProducts, getSettings } from "@/server/store";
import { filterProducts } from "@/lib/filter";
import { categories } from "@/lib/types";
import { ProductCard } from "@/components/product-card";
import Link from "next/link";
import { Search, SlidersHorizontal, ArrowRight } from "lucide-react";
export const metadata: Metadata = { title: "The collection" };
export default async function Shop({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const filters = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const all = getProducts();
  const results = filterProducts(all, filters);
  const config = getSettings();
  const colors = [
    ...new Set(all.flatMap((p) => p.variants.map((v) => v.color))),
  ].sort();
  return (
    <div className="section shop-section">
      <div className="page-heading">
        <span className="eyebrow">
          THE SOLEVA COLLECTION / 100 ORIGINAL SAMPLE DESIGNS
        </span>
        <h1>Find your next move.</h1>
        <p>Different days. Different directions. A silhouette for each.</p>
      </div>
      <nav className="category-tabs" aria-label="Product categories">
        <Link className={!filters.category ? "current" : ""} href="/shop">
          All designs <span>{all.length}</span>
        </Link>
        {categories.map((category) => (
          <Link
            key={category}
            className={filters.category === category ? "current" : ""}
            href={`/shop?category=${category}`}
          >
            {category}
            <span>{all.filter((p) => p.category === category).length}</span>
          </Link>
        ))}
      </nav>
      <div className="shop-layout">
        <aside>
          <form action="/shop" className="filter-form">
            <div className="eyebrow">
              <SlidersHorizontal size={14} /> REFINE YOUR VIEW
            </div>
            <label>
              Search
              <div className="search-field">
                <Search size={16} />
                <input
                  name="q"
                  placeholder="Name or category"
                  defaultValue={filters.q}
                />
              </div>
            </label>
            <label>
              Category
              <select
                name="category"
                aria-label="Category"
                defaultValue={filters.category || ""}
              >
                <option value="">All categories</option>
                {categories.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label>
                Min price (PKR)
                <input
                  name="min"
                  type="number"
                  min="0"
                  defaultValue={filters.min}
                  placeholder="0"
                />
              </label>
              <label>
                Max price (PKR)
                <input
                  name="max"
                  type="number"
                  min="0"
                  defaultValue={filters.max}
                  placeholder="25000"
                />
              </label>
            </div>
            <label>
              Size (EU)
              <select
                name="size"
                aria-label="Size (EU)"
                defaultValue={filters.size || ""}
              >
                <option value="">Any size</option>
                {[39, 40, 41, 42, 43, 44].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Colour
              <select
                name="color"
                aria-label="Colour"
                defaultValue={filters.color || ""}
              >
                <option value="">All colours</option>
                {colors.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Availability
              <select
                name="availability"
                aria-label="Availability"
                defaultValue={filters.availability || ""}
              >
                <option value="">All designs</option>
                <option value="available">In stock</option>
                <option value="sold-out">Sold out</option>
              </select>
            </label>
            <label>
              Sort by
              <select
                name="sort"
                aria-label="Sort by"
                defaultValue={filters.sort || ""}
              >
                <option value="">Atelier order</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="name">Name: A–Z</option>
              </select>
            </label>
            <button className="btn btn-dark">
              Apply filters <ArrowRight size={16} />
            </button>
            <Link className="text-btn" href="/shop">
              Reset filters
            </Link>
          </form>
        </aside>
        <div>
          <div className="results-bar">
            <span>
              {results.length} {results.length === 1 ? "design" : "designs"}{" "}
              found
            </span>
            <span className="tiny">DEMONSTRATION CATALOGUE</span>
          </div>
          {results.length ? (
            <div className="grid grid-cols-1 min-[500px]:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-9">
              {results.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={config.currency}
                  index={i}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>No designs in this view.</h2>
              <p>Try fewer filters or a different search.</p>
              <Link href="/shop" className="btn btn-dark">
                View the collection
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
