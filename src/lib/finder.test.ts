import { describe, expect, it } from "vitest";
import type { Product } from "./catalog";
import { finderBrands, finderCategories, findProducts, selectionMessage } from "./finder";

function product(id: number, brand: string, category: string, price: number, inStock = true): Product {
  return {
    id,
    brand,
    name: `P${id}`,
    slug: `p${id}`,
    description: null,
    image_url: null,
    attributes: null,
    condition_state: "neuf",
    category: { id: 1, name: category, slug: category, description: null, children: [] },
    best_offer: {
      id,
      seller: "TechLium",
      vendor_id: null,
      price: { amount: price, currency: "XOF" },
      compare_at_price: null,
      condition_grade: null,
      warranty_months: 12,
      stock_quantity: inStock ? 5 : 0,
      in_stock: inStock,
      status: "published",
    },
    variants: [],
  };
}

const catalogue = [
  product(1, "Apple", "phones", 665_000),
  product(2, "Apple", "phones", 430_000),
  product(3, "Samsung", "phones", 250_000),
  product(4, "Apple", "phones", 900_000, false),
  product(5, "Dell", "laptops", 800_000),
];

describe("finderCategories", () => {
  it("lists categories with something to buy, biggest first", () => {
    expect(finderCategories(catalogue).map((c) => [c.slug, c.count])).toEqual([["phones", 4], ["laptops", 1]]);
  });
});

describe("finderBrands", () => {
  it("lists the brands of a category, most present first, out-of-stock products included", () => {
    expect(finderBrands(catalogue, "phones")).toEqual(["Apple", "Samsung"]);
  });

  it("covers every category when none is given", () => {
    expect(finderBrands(catalogue, null)).toContain("Dell");
  });
});

describe("findProducts", () => {
  it("filters on category, budget and brand, cheapest first", () => {
    const found = findProducts(catalogue, { category: "phones", budget: "300-700", brand: "Apple" });
    expect(found.map((p) => p.id)).toEqual([2, 1]);
  });

  it("treats the budget lower bound as inclusive and the upper bound as exclusive", () => {
    const edge = [product(1, "A", "c", 300_000), product(2, "A", "c", 700_000)];
    expect(findProducts(edge, { category: null, budget: "300-700", brand: null }).map((p) => p.id)).toEqual([1]);
    expect(findProducts(edge, { category: null, budget: "700-1500", brand: null }).map((p) => p.id)).toEqual([2]);
  });

  it("has no ceiling on the top tier", () => {
    const rich = [product(1, "A", "c", 5_000_000)];
    expect(findProducts(rich, { category: null, budget: "gt-1500", brand: null })).toHaveLength(1);
  });

  it("returns at most the limit, and nothing when nothing fits", () => {
    expect(findProducts(catalogue, { category: "phones", budget: null, brand: null }, 2)).toHaveLength(2);
    expect(findProducts(catalogue, { category: "laptops", budget: "lt-300", brand: null })).toEqual([]);
  });
});

describe("selectionMessage", () => {
  it("writes the wishes and the chosen products", () => {
    const text = selectionMessage({
      categoryName: "Téléphones",
      budgetLabel: "300 000 – 700 000",
      brand: "Apple",
      lines: [{ name: "Apple iPhone 17", price: "615 000 F CFA", url: "https://shop.test/produits/p1" }],
    });
    expect(text).toContain("je cherche : Téléphones, budget : 300 000 – 700 000 F CFA, marque : Apple");
    expect(text).toContain("- Apple iPhone 17 (615 000 F CFA)\n  https://shop.test/produits/p1");
  });

  it("still makes sense with no choice at all", () => {
    expect(selectionMessage({ categoryName: null, budgetLabel: null, brand: null, lines: [] })).toBe(
      "Bonjour TechLium, j'ai besoin de conseils.",
    );
  });
});
