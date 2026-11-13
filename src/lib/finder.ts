import type { Product } from "./catalog";
import { toMajorUnits } from "./money";

/** Budget tiers of the "find the right product" guide, in major units (F CFA). */
export interface Budget {
  id: string;
  /** Inclusive lower bound. */
  min: number;
  /** Exclusive upper bound; `null` = no ceiling. */
  max: number | null;
}

export const BUDGETS: readonly Budget[] = [
  { id: "lt-300", min: 0, max: 300_000 },
  { id: "300-700", min: 300_000, max: 700_000 },
  { id: "700-1500", min: 700_000, max: 1_500_000 },
  { id: "gt-1500", min: 1_500_000, max: null },
];

/** French labels of the tiers (F CFA); also what the WhatsApp message says. */
export const BUDGET_LABELS: Record<string, string> = {
  "lt-300": "Moins de 300 000",
  "300-700": "300 000 – 700 000",
  "700-1500": "700 000 – 1,5 M",
  "gt-1500": "Plus de 1,5 M",
};

export interface FinderChoice {
  category: string | null;
  budget: string | null;
  /** null = any brand. */
  brand: string | null;
}

export interface FinderCategory {
  slug: string;
  name: string;
  count: number;
}

/** Products that can actually be bought: they have a price and are in stock. */
function buyable(products: readonly Product[]): Product[] {
  return products.filter((product) => product.best_offer?.in_stock);
}

/** The categories that have something to buy, biggest first (the first question's choices). */
export function finderCategories(products: readonly Product[], limit = 8): FinderCategory[] {
  const found = new Map<string, FinderCategory>();

  for (const product of buyable(products)) {
    if (!product.category) continue;
    const entry = found.get(product.category.slug) ?? { slug: product.category.slug, name: product.category.name, count: 0 };
    entry.count += 1;
    found.set(product.category.slug, entry);
  }

  return [...found.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

/** Brands on sale in a category, most present first (the third question's choices). */
export function finderBrands(products: readonly Product[], category: string | null, limit = 8): string[] {
  const counts = new Map<string, number>();

  for (const product of buyable(products)) {
    if (category && product.category?.slug !== category) continue;
    counts.set(product.brand, (counts.get(product.brand) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([brand]) => brand);
}

function inBudget(product: Product, budget: Budget): boolean {
  if (!product.best_offer) return false;
  const price = toMajorUnits(product.best_offer.price);
  return price >= budget.min && (budget.max === null || price < budget.max);
}

/** The products fitting the choices, in-stock only, cheapest first. */
export function findProducts(products: readonly Product[], choice: FinderChoice, limit = 3): Product[] {
  const budget = BUDGETS.find((candidate) => candidate.id === choice.budget);

  return buyable(products)
    .filter((product) => !choice.category || product.category?.slug === choice.category)
    .filter((product) => !choice.brand || product.brand === choice.brand)
    .filter((product) => !budget || inBudget(product, budget))
    .sort((a, b) => (a.best_offer?.price.amount ?? 0) - (b.best_offer?.price.amount ?? 0))
    .slice(0, limit);
}

export interface SelectionSummary {
  categoryName: string | null;
  budgetLabel: string | null;
  brand: string | null;
  lines: { name: string; price: string; url: string }[];
}

/** The text the shopper sends to the shop on WhatsApp (the shop reads French). */
export function selectionMessage(summary: SelectionSummary): string {
  const wishes = [
    summary.categoryName ? `je cherche : ${summary.categoryName}` : null,
    summary.budgetLabel ? `budget : ${summary.budgetLabel} F CFA` : null,
    summary.brand ? `marque : ${summary.brand}` : null,
  ].filter(Boolean);

  const intro = `Bonjour TechLium, ${wishes.length > 0 ? wishes.join(", ") : "j'ai besoin de conseils"}.`;
  const lines = summary.lines.map((line) => `- ${line.name} (${line.price})\n  ${line.url}`);

  return [intro, lines.length > 0 ? "Ces produits m'intéressent :" : null, ...lines].filter(Boolean).join("\n");
}
