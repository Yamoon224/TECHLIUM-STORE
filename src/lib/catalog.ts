/**
 * Server-side data access for the Catalog module (backend/app/Modules/Catalog).
 * Plain `fetch` rather than the typed api-client: the backend's OpenAPI spec
 * doesn't declare response bodies yet (descriptions only), so these types are
 * hand-kept against the actual API Resources until that's closed.
 */

import type { Language } from "./appearance";
import { languageQuery } from "./language";
import type { CurrencyCode } from "./money";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  children: Category[];
}

export interface Money {
  amount: number;
  currency: CurrencyCode;
}

export interface Offer {
  id: number;
  seller: "TechLium" | "vendor";
  vendor_id: number | null;
  price: Money;
  compare_at_price: Money | null;
  condition_grade: string | null;
  warranty_months: number;
  stock_quantity: number;
  in_stock: boolean;
  status: string;
}

export interface ProductVariant {
  id: number;
  sku: string;
  ean: string | null;
  attributes: Record<string, string | number> | null;
  offers: Offer[];
}

export interface Product {
  id: number;
  brand: string;
  name: string;
  slug: string;
  description: string | null;
  /** Photo uploaded by the catalogue team; null until there is one. */
  image_url: string | null;
  /** The whole gallery, cover first (product page only needs more than the cover). */
  images?: { id: number; url: string }[];
  attributes: Record<string, string | number> | null;
  condition_state: "neuf" | "reconditionne" | "occasion";
  category: Category | null;
  best_offer: Offer | null;
  variants: ProductVariant[];
}

interface Paginated<T> {
  data: T[];
  meta?: { current_page: number; last_page: number; total: number };
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`${path} responded with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getCategories(language: Language = "fr"): Promise<Category[]> {
  const lang = languageQuery(language);
  return fetchJson<Category[]>(`/catalog/categories${lang ? `?${lang}` : ""}`);
}

export interface ProductFilters {
  category?: string;
  search?: string;
  /** Texts (name, description) in this language when the catalogue has them. */
  language?: Language;
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.search) params.set("search", filters.search);
  if (filters.language === "en") params.set("lang", "en");

  const query = params.size > 0 ? `?${params.toString()}` : "";
  const page = await fetchJson<Paginated<Product>>(`/catalog/products${query}`);
  return page.data;
}

export interface ProductPage {
  products: Product[];
  page: number;
  lastPage: number;
  total: number;
}

/** One page of the filtered catalogue, for the paginated category and search pages. */
export async function getProductsPage(filters: ProductFilters, page: number, perPage: number): Promise<ProductPage> {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.search) params.set("search", filters.search);
  if (filters.language === "en") params.set("lang", "en");
  params.set("page", String(page));
  params.set("per_page", String(perPage));

  const result = await fetchJson<Paginated<Product>>(`/catalog/products?${params.toString()}`);
  return {
    products: result.data,
    page: result.meta?.current_page ?? page,
    lastPage: Math.max(1, result.meta?.last_page ?? 1),
    total: result.meta?.total ?? result.data.length,
  };
}

/** Returns null when the product doesn't exist or isn't published (404). */
export async function getProduct(slug: string, language: Language = "fr"): Promise<Product | null> {
  const lang = languageQuery(language);
  const response = await fetch(`${API_BASE_URL}/catalog/products/${encodeURIComponent(slug)}${lang ? `?${lang}` : ""}`, {
    next: { revalidate: 60 },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`/catalog/products/${slug} responded with ${response.status}`);
  }

  return response.json() as Promise<Product>;
}
