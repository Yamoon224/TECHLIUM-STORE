import type { Product } from "./catalog";

/** One category of the "Explorer" grid: what it sells, with a couple of photos and its main brands. */
export interface CategoryTile {
  slug: string;
  name: string;
  count: number;
  /** Photos of its products, for the tile (at most two). */
  images: string[];
  /** Its best represented brands (at most four). */
  brands: string[];
}

const PHOTOS_PER_TILE = 2;
const BRANDS_PER_TILE = 4;

/** The categories that have priced products, the biggest first, each with photos and brands to show. */
export function categoryTiles(products: readonly Product[], limit = 8): CategoryTile[] {
  const found = new Map<string, { tile: CategoryTile; brands: Map<string, number> }>();

  for (const product of products) {
    if (!product.best_offer || !product.category) continue;

    const entry = found.get(product.category.slug) ?? {
      tile: { slug: product.category.slug, name: product.category.name, count: 0, images: [], brands: [] },
      brands: new Map<string, number>(),
    };
    entry.tile.count += 1;
    if (product.image_url && entry.tile.images.length < PHOTOS_PER_TILE) entry.tile.images.push(product.image_url);
    entry.brands.set(product.brand, (entry.brands.get(product.brand) ?? 0) + 1);
    found.set(product.category.slug, entry);
  }

  return [...found.values()]
    .map(({ tile, brands }) => ({
      ...tile,
      brands: [...brands.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, BRANDS_PER_TILE).map(([name]) => name),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** Soft backgrounds for the category tiles, taken in turn (dark text reads on all of them). */
export const TILE_TINTS = ["#e8eefc", "#efece4", "#e3f3ea", "#fdeee3", "#ece6f7", "#e4f1f6", "#f6e8ee", "#eef2dc"] as const;

/** Deep backgrounds for a brand's banner (white text reads on all of them). */
const BANNER_COLORS = ["#1d3fbf", "#7c2d92", "#0f766e", "#b4380f", "#334155", "#a1124a", "#1e6b3a", "#6b4e0a"] as const;

/** The same brand always gets the same banner colour. */
export function brandColor(brand: string): string {
  let hash = 0;
  for (const char of brand.toLowerCase()) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return BANNER_COLORS[hash % BANNER_COLORS.length];
}
