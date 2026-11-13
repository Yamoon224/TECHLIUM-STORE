import { describe, expect, it } from "vitest";
import type { Product } from "./catalog";
import { attributeLabel, attributeValue, brandRanges, compareBrands, defaultPicks, modelName, rangeModels, specRows } from "./compare";

function product(id: number, brand: string, category: string, attributes: Product["attributes"] = null, priced = true): Product {
  return {
    id,
    brand,
    name: `P${id}`,
    slug: `p${id}`,
    description: null,
    image_url: null,
    attributes,
    condition_state: "neuf",
    category: { id: 1, name: category, slug: category, description: null, children: [] },
    best_offer: priced
      ? {
          id,
          seller: "TechLium",
          vendor_id: null,
          price: { amount: 1000 * id, currency: "XOF" },
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

const catalogue = [
  product(1, "Huawei", "watches"),
  product(2, "Huawei", "watches"),
  product(3, "Huawei", "phones"),
  product(4, "Apple", "phones"),
  product(5, "Apple", "phones", null, false),
];

describe("compareBrands", () => {
  it("counts the priced products of each brand, the best represented first", () => {
    expect(compareBrands(catalogue)).toEqual([
      { name: "Huawei", count: 3 },
      { name: "Apple", count: 1 },
    ]);
  });
});

describe("brandRanges", () => {
  it("lists the categories a brand sells in, with counts", () => {
    expect(brandRanges(catalogue, "Huawei").map((r) => [r.slug, r.count])).toEqual([["watches", 2], ["phones", 1]]);
  });
});

describe("rangeModels and defaultPicks", () => {
  it("narrows to one brand and range, and picks the first three", () => {
    const models = rangeModels(catalogue, "Huawei", "watches");
    expect(models.map((p) => p.id)).toEqual([1, 2]);
    expect(defaultPicks(catalogue, 3)).toEqual([1, 2, 3]);
  });
});

describe("attribute wording", () => {
  it("labels known keys and spells out unknown ones", () => {
    expect(attributeLabel("storage_gb")).toBe("Stockage");
    expect(attributeLabel("battery_life")).toBe("Battery life");
  });

  it("adds the unit a key implies, and words for booleans", () => {
    expect(attributeValue("storage_gb", 256)).toBe("256 Go");
    expect(attributeValue("network", "5G")).toBe("5G");
    expect(attributeValue("subwoofer", true)).toBe("Oui");
  });
});

describe("specRows", () => {
  it("unites the specs, with a gap where a product does not say", () => {
    const rows = specRows([product(1, "H", "c", { ram_gb: 8, cpu: "A" }), product(2, "H", "c", { ram_gb: 12 })]);
    expect(rows).toEqual([
      { key: "ram_gb", label: "Mémoire vive", values: ["8 Go", "12 Go"] },
      { key: "cpu", label: "Processeur", values: ["A", null] },
    ]);
  });

  it("leaves the colour spec out when the product lists its colours", () => {
    const withColors = { ...product(1, "H", "c", { color: "Noir" }), colors: [{ name: "Noir", hex: "#000000" }] };
    expect(specRows([withColors])).toEqual([]);
  });
});

describe("modelName", () => {
  it("does not repeat a brand the name already starts with", () => {
    expect(modelName({ brand: "Dahua", name: "Dahua Caméra dôme 5 MP" })).toBe("Dahua Caméra dôme 5 MP");
    expect(modelName({ brand: "Apple", name: "iPhone 17" })).toBe("Apple iPhone 17");
  });
});

describe("specRows without the range's own category", () => {
  it("leaves a raw category attribute out", () => {
    expect(specRows([product(1, "H", "c", { category: "security", ram_gb: 8 })]).map((row) => row.key)).toEqual(["ram_gb"]);
  });
});
