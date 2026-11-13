import type { ProductColor } from "./catalog";
import type { CurrencyCode } from "./money";

export const CART_STORAGE_KEY = "TechLium_cart";

export interface CartItem {
  offerId: number;
  productSlug: string;
  productName: string;
  brand: string;
  priceAmount: number;
  currency: CurrencyCode;
  quantity: number;
  /** Product photo captured when added; absent for older carts or products without one. */
  imageUrl?: string | null;
  /** Colour picked on the product page; a line is one offer in one colour. */
  color?: ProductColor | null;
}

/** Same offer in another colour is another line; `undefined`/`null` means no colour. */
function sameLine(line: CartItem, offerId: number, color?: string | null): boolean {
  return line.offerId === offerId && (line.color?.name ?? null) === (color ?? null);
}

export function loadCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable (private browsing, quota) - the cart just won't persist.
  }
}

/** Most units of one offer (in one colour) a cart line holds: the order API takes up to 99 per line. */
export const MAX_LINE_QUANTITY = 99;

/**
 * Adds `quantity` of an offer in a colour, merging with any existing line. The stock does not
 * limit it: an active product can be ordered even when the shelf does not cover the quantity.
 */
export function addToCart(items: CartItem[], item: Omit<CartItem, "quantity">, quantity: number): CartItem[] {
  const existing = items.find((line) => sameLine(line, item.offerId, item.color?.name));

  if (!existing) {
    return [...items, { ...item, quantity: Math.min(quantity, MAX_LINE_QUANTITY) }];
  }

  return items.map((line) =>
    sameLine(line, item.offerId, item.color?.name) ? { ...line, quantity: Math.min(line.quantity + quantity, MAX_LINE_QUANTITY) } : line,
  );
}

export function setQuantity(items: CartItem[], offerId: number, quantity: number, color?: string | null): CartItem[] {
  if (quantity <= 0) {
    return removeFromCart(items, offerId, color);
  }

  return items.map((line) => (sameLine(line, offerId, color) ? { ...line, quantity: Math.min(quantity, MAX_LINE_QUANTITY) } : line));
}

export function removeFromCart(items: CartItem[], offerId: number, color?: string | null): CartItem[] {
  return items.filter((line) => !sameLine(line, offerId, color));
}

export function cartCount(items: CartItem[]): number {
  return items.length;
}

export function cartSubtotalAmount(items: CartItem[]): number {
  return items.reduce((total, line) => total + line.priceAmount * line.quantity, 0);
}
