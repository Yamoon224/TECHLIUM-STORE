import { describe, expect, it } from "vitest";
import { addToCart, cartCount, cartSubtotalAmount, removeFromCart, setQuantity, type CartItem } from "./cart";

function item(overrides: Partial<Omit<CartItem, "quantity">> = {}) {
  return {
    offerId: 1,
    productSlug: "samsung-galaxy-a55",
    productName: "Samsung Galaxy A55",
    brand: "Samsung",
    priceAmount: 185_000,
    currency: "XOF" as const,
    maxQuantity: 10,
    ...overrides,
  };
}

describe("addToCart", () => {
  it("adds a new line for an offer not yet in the cart", () => {
    const result = addToCart([], item(), 2);
    expect(result).toEqual([{ ...item(), quantity: 2 }]);
  });

  it("merges quantity into an existing line for the same offer", () => {
    const cart = [{ ...item(), quantity: 2 }];
    const result = addToCart(cart, item(), 3);
    expect(result).toHaveLength(1);
    expect(result[0]?.quantity).toBe(5);
  });

  it("caps the quantity at the offer's stock", () => {
    const result = addToCart([], item({ maxQuantity: 3 }), 10);
    expect(result[0]?.quantity).toBe(3);
  });

  it("caps a merge at the offer's stock too", () => {
    const cart = [{ ...item({ maxQuantity: 3 }), quantity: 2 }];
    const result = addToCart(cart, item({ maxQuantity: 3 }), 5);
    expect(result[0]?.quantity).toBe(3);
  });
});

describe("setQuantity", () => {
  it("updates the quantity of a line", () => {
    const cart = [{ ...item(), quantity: 2 }];
    const result = setQuantity(cart, 1, 5);
    expect(result[0]?.quantity).toBe(5);
  });

  it("caps the new quantity at stock", () => {
    const cart = [{ ...item({ maxQuantity: 4 }), quantity: 2 }];
    const result = setQuantity(cart, 1, 99);
    expect(result[0]?.quantity).toBe(4);
  });

  it("removes the line when the quantity drops to zero", () => {
    const cart = [{ ...item(), quantity: 2 }];
    expect(setQuantity(cart, 1, 0)).toEqual([]);
  });
});

describe("removeFromCart", () => {
  it("removes only the targeted line", () => {
    const cart = [{ ...item({ offerId: 1 }), quantity: 1 }, { ...item({ offerId: 2 }), quantity: 1 }];
    const result = removeFromCart(cart, 1);
    expect(result).toHaveLength(1);
    expect(result[0]?.offerId).toBe(2);
  });
});

describe("cartCount and cartSubtotalAmount", () => {
  it("counts distinct articles and sums amounts across lines", () => {
    const cart = [
      { ...item({ offerId: 1, priceAmount: 100 }), quantity: 2 },
      { ...item({ offerId: 2, priceAmount: 50 }), quantity: 3 },
    ];

    expect(cartCount(cart)).toBe(2);
    expect(cartSubtotalAmount(cart)).toBe(100 * 2 + 50 * 3);
  });

  it("returns zero for an empty cart", () => {
    expect(cartCount([])).toBe(0);
    expect(cartSubtotalAmount([])).toBe(0);
  });
});
