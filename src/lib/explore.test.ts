import { describe, expect, it } from "vitest";
import type { Product } from "./catalog";
import { brandColor, categoryTiles } from "./explore";

function product(id: number, brand: string, category: string, image: string | null = `/img/${id}.jpg`, priced = true): Product {
  return {
    id,
    brand,
    name: `P${id}`,
    slug: `p${id}`,
    description: null,
    image_url: image,
    attributes: null,
    condition_state: "neuf",
    category: { id: 1, name: category, slug: category, description: null, children: [] },
    best_offer: priced
      ? {
          id,
          seller: "TechLium",
          vendor_id: null,
          price: { amount: 1000, currency: "XOF" },
          compare_at_price: null,
          condition_grade: null,
          warranty_months: 12,
          stock_quantity: 3,
          in_stock: true,
          status: "published",
        }
      : null,
    variants: [],
  };
}

describe("categoryTiles", () => {
  const catalogue = [
    product(1, "Apple", "phones"),
    product(2, "Apple", "phones"),
    product(3, "Samsung", "phones"),
    product(4, "Google", "phones", null),
    product(5, "Dell", "laptops"),
    product(6, "Ghost", "unpriced", "/img/6.jpg", false),
  ];

  it("lists the categories with priced products, the biggest first", () => {
    expect(categoryTiles(catalogue).map((tile) => [tile.slug, tile.count])).toEqual([["phones", 4], ["laptops", 1]]);
  });

  it("keeps two photos at most, skipping products without one", () => {
    expect(categoryTiles(catalogue)[0].images).toEqual(["/img/1.jpg", "/img/2.jpg"]);
  });

  it("names the best represented brands first", () => {
    expect(categoryTiles(catalogue)[0].brands).toEqual(["Apple", "Google", "Samsung"]);
  });

  it("honours the limit", () => {
    expect(categoryTiles(catalogue, 1)).toHaveLength(1);
  });
});

describe("brandColor", () => {
  it("gives the same brand the same colour whatever the case", () => {
    expect(brandColor("Samsung")).toBe(brandColor("samsung"));
    expect(brandColor("Samsung")).toMatch(/^#[0-9a-f]{6}$/);
  });
});
