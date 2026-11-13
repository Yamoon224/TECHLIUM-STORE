import type { Product } from "./catalog";

/** Columns of the side-by-side table. */
export const COMPARE_SLOTS = 3;

export interface CompareBrand {
  name: string;
  count: number;
}

export interface CompareRange {
  slug: string;
  name: string;
  count: number;
}

/** "Dahua" + "Dahua Caméra dôme" is "Dahua Caméra dôme", not "Dahua Dahua Caméra dôme": a name that already starts with its brand is not prefixed again. */
export function modelName(product: Pick<Product, "brand" | "name">): string {
  return product.name.toLowerCase().startsWith(product.brand.toLowerCase()) ? product.name : `${product.brand} ${product.name}`;
}

/** Products that have a price: the only ones worth putting side by side. */
function priced(products: readonly Product[]): Product[] {
  return products.filter((product) => product.best_offer);
}

/** Brands with something to compare, the best represented first (step 1). */
export function compareBrands(products: readonly Product[]): CompareBrand[] {
  const counts = new Map<string, CompareBrand>();

  for (const product of priced(products)) {
    const entry = counts.get(product.brand) ?? { name: product.brand, count: 0 };
    entry.count += 1;
    counts.set(product.brand, entry);
  }

  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** A brand's ranges: the categories it sells in, the best represented first (step 2). */
export function brandRanges(products: readonly Product[], brand: string): CompareRange[] {
  const ranges = new Map<string, CompareRange>();

  for (const product of priced(products)) {
    if (product.brand !== brand || !product.category) continue;
    const entry = ranges.get(product.category.slug) ?? { slug: product.category.slug, name: product.category.name, count: 0 };
    entry.count += 1;
    ranges.set(product.category.slug, entry);
  }

  return [...ranges.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** The models of one brand in one range, the ones a shopper can compare. */
export function rangeModels(products: readonly Product[], brand: string, category: string | null): Product[] {
  return priced(products).filter((product) => product.brand === brand && (!category || product.category?.slug === category));
}

/** The first models of a range, to fill the table before the shopper changes anything. */
export function defaultPicks(models: readonly Product[], slots = COMPARE_SLOTS): number[] {
  return models.slice(0, slots).map((product) => product.id);
}

const LABELS: Record<string, string> = {
  ram_gb: "Mémoire vive",
  storage_gb: "Stockage",
  capacity_gb: "Capacité",
  cpu: "Processeur",
  network: "Réseau",
  connectivity: "Connectivité",
  screen: "Écran",
  screen_inches: "Taille d'écran",
  panel: "Dalle",
  refresh_hz: "Fréquence",
  resolution: "Résolution",
  technology: "Technologie",
  smart_os: "Système",
  bluetooth: "Bluetooth",
  noise_cancelling: "Réduction de bruit",
  power_w: "Puissance",
  waterproof: "Étanchéité",
  channels: "Canaux",
  subwoofer: "Caisson de basses",
  case_mm: "Boîtier",
  cellular: "Cellulaire",
  type: "Type",
  platform: "Plateforme",
  usage: "Usage",
  category: "Catégorie",
};

const UNITS: [suffix: string, unit: string][] = [
  ["_gb", " Go"],
  ["_w", " W"],
  ["_hz", " Hz"],
  ["_mm", " mm"],
  ["_inches", " pouces"],
];

/** "storage_gb" -> "Stockage"; an unknown key reads as plain words ("battery_life" -> "Battery life"). */
export function attributeLabel(key: string): string {
  if (LABELS[key]) return LABELS[key];
  const words = key.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** 256 under "storage_gb" -> "256 Go"; booleans read "Oui" / "Non". */
export function attributeValue(key: string, value: unknown): string {
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  const unit = UNITS.find(([suffix]) => key.endsWith(suffix))?.[1] ?? "";
  return `${String(value)}${typeof value === "number" ? unit : ""}`;
}

export interface SpecRow {
  key: string;
  label: string;
  /** One cell per compared product; null when it does not say. */
  values: (string | null)[];
}

/** Specs of a product: its own attributes, then its first variant's. */
function specsOf(product: Product): Record<string, unknown> {
  return { ...(product.attributes ?? {}), ...(product.variants[0]?.attributes ?? {}) };
}

/**
 * The rows of the table: every spec any compared product has, in order of
 * first appearance, with a gap (null) where another product does not say.
 * A colour attribute is left out when the product lists its colours itself.
 */
export function specRows(products: readonly Product[]): SpecRow[] {
  const specs = products.map(specsOf);
  const keys: string[] = [];

  specs.forEach((spec, index) => {
    for (const key of Object.keys(spec)) {
      if (key === "color" && (products[index]?.colors?.length ?? 0) > 0) continue;
      // The range is already the one chosen in step 2, so its raw category key says nothing new.
      if (key === "category") continue;
      if (!keys.includes(key)) keys.push(key);
    }
  });

  return keys.map((key) => ({
    key,
    label: attributeLabel(key),
    values: specs.map((spec) => (key in spec && spec[key] !== null && spec[key] !== "" ? attributeValue(key, spec[key]) : null)),
  }));
}
