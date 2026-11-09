import type { CurrencyCode } from "./money";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export interface OrderItem {
  offer_id: number;
  product_name: string;
  brand: string;
  quantity: number;
  unit_price: { amount: number; currency: CurrencyCode };
  line_total: { amount: number; currency: CurrencyCode };
}

/** One seller's parcel within an order, with its own status (cahier §5.7). */
export interface SubOrder {
  id: number;
  vendor_id: number | null;
  status: string;
  subtotal: { amount: number; currency: CurrencyCode };
  delivered_at: string | null;
  /** What this parcel contains (tracking page). */
  items?: { product_name: string; brand: string; quantity: number }[] | null;
  /** When this parcel reached each status, oldest first. */
  status_history?: { status: string; at: string }[] | null;
}

export interface Order {
  order_number: string;
  status: string;
  payment_method: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_city: string | null;
  notes: string | null;
  /** What the customer owes, after any coupon. */
  subtotal: { amount: number; currency: CurrencyCode };
  discount?: { amount: number; currency: CurrencyCode };
  coupon_code?: string | null;
  items: OrderItem[];
  sub_orders?: SubOrder[];
  /** Six-digit code to give the courier at handover - keep it private until then. */
  delivery_code?: string | null;
  /** True when the parcels are at different stages. */
  partial?: boolean;
  /** When each status was reached, oldest first (the tracking timeline). */
  status_history?: { status: string; at: string }[];
  created_at: string | null;
}

/** The code is only useful until the parcel is handed over. */
export function showDeliveryCode(order: Pick<Order, "delivery_code" | "status">): boolean {
  return Boolean(order.delivery_code) && order.status !== "delivered" && order.status !== "cancelled";
}

/**
 * The status line shown to the customer: "Partiellement livrée / expédiée"
 * when the parcels of a multi-seller order are at different stages,
 * otherwise null (the plain order status applies).
 */
export function partialLabel(order: Pick<Order, "partial" | "sub_orders">): string | null {
  if (!order.partial) return null;
  const statuses = (order.sub_orders ?? []).map((subOrder) => subOrder.status);
  if (statuses.includes("delivered")) return "Partiellement livrée";
  if (statuses.includes("shipped")) return "Partiellement expédiée";
  return null;
}

export interface PlaceOrderInput {
  items: { offer_id: number; quantity: number }[];
  customer_name: string;
  customer_phone: string;
  /** Optional: also receive order updates by e-mail. */
  customer_email?: string;
  delivery_address: string;
  delivery_city?: string;
  notes?: string;
  coupon_code?: string;
  /** Language of the SMS / e-mails about this order. */
  locale?: "fr" | "en";
}

export class CheckoutError extends Error {}

const LAST_ORDER_STORAGE_KEY = "TechLium_last_order";

/**
 * Hands the just-placed order to the confirmation page via sessionStorage
 * instead of the URL - putting the checkout phone in a query string would
 * land it in browser history, server access logs and any shared link.
 */
export function rememberLastOrder(order: Order): void {
  try {
    window.sessionStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(order));
  } catch {
    // Storage unavailable - the confirmation page falls back to asking for the phone.
  }
}

export function recallLastOrder(orderNumber: string): Order | null {
  try {
    const raw = window.sessionStorage.getItem(LAST_ORDER_STORAGE_KEY);
    if (!raw) return null;

    const order = JSON.parse(raw) as Order;
    return order.order_number === orderNumber ? order : null;
  } catch {
    return null;
  }
}

/**
 * `token` is optional: guest checkout (cahier §5.1) stays fully supported.
 * When present, the backend attaches the order to that customer's account
 * so it shows up in listMyOrders() - the whole reason this is a parameter
 * here rather than a hardcoded anonymous request.
 */
export async function placeOrder(input: PlaceOrderInput, token?: string | null): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new CheckoutError(body?.message ?? "La commande n'a pas pu être enregistrée.");
  }

  return response.json() as Promise<Order>;
}

export class OrdersError extends Error {}

export async function listMyOrders(token: string): Promise<Order[]> {
  const response = await fetch(`${API_BASE_URL}/orders/mine`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new OrdersError(`/orders/mine responded with ${response.status}`);
  }

  const body = (await response.json()) as { data: Order[] };
  return body.data;
}

/**
 * The order number alone isn't a secret - the API requires the phone used at
 * checkout as proof of ownership, returning 404 (not 403) on a mismatch so a
 * guessed order number can't be confirmed to exist.
 */
export async function getOrder(orderNumber: string, phone: string): Promise<Order | null> {
  const params = new URLSearchParams({ phone });
  const response = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderNumber)}?${params}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`/orders/${orderNumber} responded with ${response.status}`);
  }

  return response.json() as Promise<Order>;
}

/** "Colis 2 - vendeur vérifié" / "Colis 1 - TechLium": the parcel's seller, as the customer sees it. */
export function parcelLabel(parcel: Pick<SubOrder, "vendor_id">, index: number): string {
  return `Colis ${index + 1} - ${parcel.vendor_id === null ? "expédié par TechLium" : "vendeur vérifié"}`;
}

/** One order of the signed-in customer, with its parcels and histories; null when it is not theirs. */
export async function getMyOrder(token: string, orderNumber: string): Promise<Order | null> {
  const response = await fetch(`${API_BASE_URL}/orders/mine/${encodeURIComponent(orderNumber)}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new OrdersError(`/orders/mine/${orderNumber} responded with ${response.status}`);

  return response.json() as Promise<Order>;
}

/** What a visitor typed as an order number: trimmed, upper-cased, inner spaces removed ("tch 2026..." -> "TCH2026..."). */
export function normalizeOrderNumber(input: string): string {
  return input.replace(/\s+/g, "").toUpperCase();
}
