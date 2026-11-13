import { describe, expect, it } from "vitest";
import type { Product } from "./catalog";
import { categoryRows, flashDeals } from "./home";

function product(id: number, price: number, compare: number | null, category = "phones", inStock = true): Product {
  return {
    id,
    brand: "B",
    name: `P${id}`,
    slug: `p${id}`,
    description: null,
    image_url: null,
    attributes: null,
    condition_state: "neuf",
    category: { id: 1, name: category, slug: category, description: null, children: [] },
    variants: [],
    best_offer: {
      id,
      seller: "TechLium",
      vendor_id: null,
      price: { amount: price, currency: "XOF" },
      compare_at_price: compare === null ? null : { amount: compare, currency: "XOF" },
      condition_grade: null,
      warranty_months: 0,
      stock_quantity: 3,
      in_stock: inStock,
      status: "active",
    },
  };
}

describe("flashDeals", () => {
  it("keeps only discounted products, biggest reduction first, whatever their stock", () => {
    const deals = flashDeals([
      product(1, 90, 100),
      product(2, 50, 100),
      product(3, 100, null),
      product(4, 10, 100, "phones", false),
    ]);

    expect(deals.map((p) => p.id)).toEqual([4, 2, 1]);
  });

  it("respects the limit", () => {
    const many = Array.from({ length: 10 }, (_, index) => product(index + 1, 50, 100));
    expect(flashDeals(many, 3)).toHaveLength(3);
  });
});

describe("categoryRows", () => {
  it("groups by category in order of first appearance and caps each shelf", () => {
    const rows = categoryRows(
      [product(1, 1, null, "phones"), product(2, 1, null, "laptops"), product(3, 1, null, "phones"), product(4, 1, null, "phones")],
      2,
    );

    expect(rows.map((row) => row.slug)).toEqual(["phones", "laptops"]);
    expect(rows[0].products.map((p) => p.id)).toEqual([1, 3]);
  });

  it("limits the number of shelves", () => {
    const products = ["a", "b", "c", "d"].map((slug, index) => product(index, 1, null, slug));
    expect(categoryRows(products, 6, 2)).toHaveLength(2);
  });
});
