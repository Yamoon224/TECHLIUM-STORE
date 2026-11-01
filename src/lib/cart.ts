import type { CurrencyCode } from "./money";

export const CART_STORAGE_KEY = "TechniLium_cart";

export interface CartItem {
  offerId: number;
  productSlug: string;
  productName: string;
  brand: string;
  priceAmount: number;
  currency: CurrencyCode;
  maxQuantity: number;
  quantity: number;
  /** Product photo captured when added; absent for older carts or products without one. */
  imageUrl?: string | null;
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

/** Adds `quantity` of an offer, capped at its stock, merging with any existing line. */
export function addToCart(items: CartItem[], item: Omit<CartItem, "quantity">, quantity: number): CartItem[] {
  const existing = items.find((line) => line.offerId === item.offerId);

  if (!existing) {
    return [...items, { ...item, quantity: Math.min(quantity, item.maxQuantity) }];
  }

  return items.map((line) =>
    line.offerId === item.offerId
      ? { ...line, quantity: Math.min(line.quantity + quantity, line.maxQuantity) }
      : line,
  );
}

export function setQuantity(items: CartItem[], offerId: number, quantity: number): CartItem[] {
  if (quantity <= 0) {
    return items.filter((line) => line.offerId !== offerId);
  }

  return items.map((line) =>
    line.offerId === offerId ? { ...line, quantity: Math.min(quantity, line.maxQuantity) } : line,
  );
}

export function removeFromCart(items: CartItem[], offerId: number): CartItem[] {
  return items.filter((line) => line.offerId !== offerId);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((total, line) => total + line.quantity, 0);
}

export function cartSubtotalAmount(items: CartItem[]): number {
  return items.reduce((total, line) => total + line.priceAmount * line.quantity, 0);
}
