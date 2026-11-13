import { describe, expect, it } from "vitest";
import type { Product } from "./catalog";
import { catalogueBrands, marqueeHalf } from "./brands";

const withBrand = (brand: string) => ({ brand }) as Product;

describe("catalogueBrands", () => {
  it("lists each brand once, the best represented first", () => {
    const products = ["Apple", "Samsung", "apple", "Apple", "Sony", " Sony "].map(withBrand);
    expect(catalogueBrands(products)).toEqual(["Apple", "Sony", "Samsung"]);
  });

  it("ignores empty brands", () => {
    expect(catalogueBrands([withBrand(" ")])).toEqual([]);
  });
});

describe("marqueeHalf", () => {
  it("repeats a short list until it fills the strip", () => {
    expect(marqueeHalf(["A", "B", "C"])).toHaveLength(12);
  });

  it("keeps a long list as it is, and an empty one empty", () => {
    const many = Array.from({ length: 14 }, (_, i) => `B${i}`);
    expect(marqueeHalf(many)).toEqual(many);
    expect(marqueeHalf([])).toEqual([]);
  });
});
