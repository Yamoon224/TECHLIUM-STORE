"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  addToCart,
  cartCount,
  cartSubtotalAmount,
  loadCart,
  removeFromCart,
  saveCart,
  setQuantity,
  type CartItem,
} from "@/lib/cart";

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotalAmount: number;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (offerId: number, quantity: number, color?: string | null) => void;
  remove: (offerId: number, color?: string | null) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Deliberately deferred to after mount: localStorage isn't available
    // during SSR, and reading it synchronously on the server render would
    // produce a client/server markup mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      saveCart(items);
    }
  }, [items, hydrated]);

  const value: CartContextValue = {
    items,
    count: cartCount(items),
    subtotalAmount: cartSubtotalAmount(items),
    add: (item, quantity = 1) => setItems((current) => addToCart(current, item, quantity)),
    updateQuantity: (offerId, quantity, color) => setItems((current) => setQuantity(current, offerId, quantity, color)),
    remove: (offerId, color) => setItems((current) => removeFromCart(current, offerId, color)),
    clear: () => setItems([]),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
