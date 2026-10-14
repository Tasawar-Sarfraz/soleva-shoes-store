import type { Product } from "./types";
export type Filters = Record<string, string | undefined>;
export function filterProducts(products: Product[], filters: Filters) {
  const q = (filters.q || "").toLowerCase().trim();
  const result = products.filter((p) => {
    if (q && !`${p.name} ${p.category}`.toLowerCase().includes(q)) return false;
    if (filters.category && p.category !== filters.category) return false;
    if (
      filters.min &&
      Number.isFinite(Number(filters.min)) &&
      p.price < Number(filters.min) * 100
    )
      return false;
    if (
      filters.max &&
      Number.isFinite(Number(filters.max)) &&
      p.price > Number(filters.max) * 100
    )
      return false;
    const matching = p.variants.filter(
      (v) =>
        (!filters.size || v.size === Number(filters.size)) &&
        (!filters.color || v.color === filters.color),
    );
    if (!matching.length) return false;
    if (
      filters.availability === "available" &&
      !matching.some((v) => v.stock > 0)
    )
      return false;
    if (
      filters.availability === "sold-out" &&
      matching.some((v) => v.stock > 0)
    )
      return false;
    return true;
  });
  return result.sort((a, b) =>
    filters.sort === "price-asc"
      ? a.price - b.price
      : filters.sort === "price-desc"
        ? b.price - a.price
        : filters.sort === "name"
          ? a.name.localeCompare(b.name)
          : a.createdAt - b.createdAt,
  );
}
