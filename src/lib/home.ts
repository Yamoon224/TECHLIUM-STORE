import type { Product } from "./catalog";
import { discountPercent } from "./pricing";

/** Products with a real reduction, biggest reduction first. */
export function flashDeals(products: readonly Product[], limit = 6): Product[] {
  return products
    .map((product) => ({ product, percent: product.best_offer ? discountPercent(product.best_offer) : null }))
    .filter((entry): entry is { product: Product; percent: number } => entry.percent !== null)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, limit)
    .map((entry) => entry.product);
}

export interface CategoryRow {
  name: string;
  slug: string;
  products: Product[];
}

/** One shelf per category that has products, in order of first appearance; uncategorised products are left out. */
export function categoryRows(products: readonly Product[], perRow = 6, maxRows = 5): CategoryRow[] {
  const rows = new Map<string, CategoryRow>();

  for (const product of products) {
    if (!product.category) continue;
    const row = rows.get(product.category.slug) ?? { name: product.category.name, slug: product.category.slug, products: [] };
    if (row.products.length < perRow) row.products.push(product);
    rows.set(product.category.slug, row);
  }

  return [...rows.values()].slice(0, maxRows);
}
