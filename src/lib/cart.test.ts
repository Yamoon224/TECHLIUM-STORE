import { describe, expect, it } from "vitest";
import { addToCart, cartCount, cartSubtotalAmount, removeFromCart, setQuantity, unitsOfOffer, type CartItem } from "./cart";

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

describe("colours", () => {
  const blue = { name: "Bleu ciel", hex: "#a9c7e8" };
  const black = { name: "Noir", hex: "#1c1c1e" };

  it("keeps the same offer in two colours as two lines", () => {
    const cart = addToCart(addToCart([], item({ color: blue }), 1), item({ color: black }), 1);
    expect(cart).toHaveLength(2);
  });

  it("merges the same offer in the same colour", () => {
    const cart = addToCart(addToCart([], item({ color: blue }), 1), item({ color: blue }), 2);
    expect(cart).toHaveLength(1);
    expect(cart[0]?.quantity).toBe(3);
  });

  it("shares the stock between colours", () => {
    const cart = addToCart(addToCart([], item({ color: blue, maxQuantity: 3 }), 2), item({ color: black, maxQuantity: 3 }), 5);
    expect(unitsOfOffer(cart, 1)).toBe(3);
  });

  it("changes and removes only the line of the colour given", () => {
    const cart = addToCart(addToCart([], item({ color: blue }), 1), item({ color: black }), 1);
    expect(setQuantity(cart, 1, 4, "Noir").map((l) => l.quantity)).toEqual([1, 4]);
    expect(removeFromCart(cart, 1, "Bleu ciel").map((l) => l.color?.name)).toEqual(["Noir"]);
  });
});
