import type { Language } from "./appearance";
import { languageQuery } from "./language";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

/** The means of payment the footer can draw; the backoffice picks which are shown. */
export type PaymentBadgeId = "mtn" | "wave" | "cash" | "visa" | "mastercard" | "orange";

/** What the shop says about itself (backend `GET /shop`), edited in the backoffice. */
export interface ShopInfo {
  contact: { phone?: string; whatsapp?: string; email?: string; hours?: string };
  address: string | null;
  /** The shop's point on the map; null until it is filled in. */
  location: { latitude: number; longitude: number } | null;
  tiktok_url: string | null;
  /** Wording about delivery, in the visitor's language when it was written. */
  delivery_info: string | null;
  /** The scrolling bar's messages, in the visitor's language; empty = the storefront's own defaults. */
  topbar_messages: string[];
  payment_methods: PaymentBadgeId[];
}

export async function getShopInfo(language: Language = "fr"): Promise<ShopInfo | null> {
  const lang = languageQuery(language);

  try {
    const response = await fetch(`${API_BASE_URL}/shop${lang ? `?${lang}` : ""}`, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;

    return (await response.json()) as ShopInfo;
  } catch {
    return null;
  }
}
