import type { Product } from "./catalog";

/** Fewest names in one half of the scrolling strip, so it is always wider than the screen. */
const MIN_PER_HALF = 10;

/** The catalogue's brands, the best represented first, each once (case-insensitively). */
export function catalogueBrands(products: readonly Product[]): string[] {
  const counts = new Map<string, { name: string; count: number }>();

  for (const product of products) {
    const name = product.brand.trim();
    if (!name) continue;
    const entry = counts.get(name.toLowerCase()) ?? { name, count: 0 };
    entry.count += 1;
    counts.set(name.toLowerCase(), entry);
  }

  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).map((entry) => entry.name);
}

/** One half of the endless strip: the brands, repeated if there are too few to fill the width. */
export function marqueeHalf(brands: readonly string[]): string[] {
  if (brands.length === 0) return [];
  const repeats = Math.ceil(MIN_PER_HALF / brands.length);
  return Array.from({ length: repeats }, () => brands).flat();
}
