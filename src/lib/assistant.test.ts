import { describe, expect, it } from "vitest";
import type { Product } from "./catalog";
import { detectIntent, normalize, parseBudget, productWords, reply, searchProducts } from "./assistant";

function product(id: number, brand: string, name: string, category: string, price: number, inStock = true): Product {
  return {
    id,
    brand,
    name,
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
      stock_quantity: inStock ? 4 : 0,
      in_stock: inStock,
      status: "published",
    },
    variants: [],
  };
}

const catalogue = [
  product(1, "Apple", "iPhone 18 Pro", "Téléphones", 990_000),
  product(2, "Apple", "iPhone 17", "Téléphones", 615_000),
  product(3, "Samsung", "Galaxy A55", "Téléphones", 185_000),
  product(4, "Dell", "XPS 13", "Ordinateurs portables", 800_000),
  product(5, "Apple", "iPhone 16", "Téléphones", 500_000, false),
];

describe("normalize", () => {
  it("drops accents and punctuation", () => {
    expect(normalize("Téléphone, à 300 000 F !")).toBe("telephone a 300 000 f");
  });
});

describe("parseBudget", () => {
  it.each([
    ["moins de 300 000", 300_000, "max"],
    ["500000", 500_000, "max"],
    ["environ 500k", 500_000, "max"],
    ["budget 1,5 M", 1_500_000, "max"],
    ["plus de 700 000 fcfa", 700_000, "min"],
  ] as const)("reads %s", (question, amount, kind) => {
    expect(parseBudget(question)).toMatchObject({ amount, kind });
  });

  it("takes a model number for a model, not a price", () => {
    expect(parseBudget("iPhone 18 Pro")).toBeNull();
  });
});

describe("productWords", () => {
  it("keeps the product words only", () => {
    expect(productWords("Je cherche un iPhone 18 pas cher", null)).toEqual(["iphone", "18", "cher"]);
  });
});

describe("detectIntent", () => {
  it.each([
    ["Livraison", "delivery"],
    ["comment payer ?", "payment"],
    ["la garantie c'est combien de temps", "warranty"],
    ["je veux un remboursement", "returns"],
    ["vous faites des trocs ?", "tradein"],
    ["numéro whatsapp", "contact"],
    ["où est la boutique", "location"],
    ["suivre ma commande", "tracking"],
    ["salut", "greeting"],
  ] as const)("%s -> %s", (question, intent) => {
    expect(detectIntent(question)).toBe(intent);
  });

  it("does not mistake a product search for a service question", () => {
    expect(detectIntent("Trouver un téléphone")).toBeNull();
    expect(detectIntent("iPhone 18 Pro")).toBeNull();
  });
});

describe("searchProducts", () => {
  it("finds a model by its words, in stock only", () => {
    const { found, exact } = searchProducts(catalogue, ["iphone"], null);
    expect(found.map((p) => p.id)).toEqual([2, 1]);
    expect(exact).toBe(true);
  });

  it("matches a category by its plural or singular", () => {
    expect(searchProducts(catalogue, ["telephone"], null).found.map((p) => p.id)).toEqual([3, 2, 1]);
  });

  it("applies the budget", () => {
    const { found } = searchProducts(catalogue, ["iphone"], { amount: 700_000, kind: "max", matched: "" });
    expect(found.map((p) => p.id)).toEqual([2]);
  });

  it("falls back to the best partial match and says so", () => {
    const { found, exact } = searchProducts(catalogue, ["galaxy", "zzz"], null);
    expect(found.map((p) => p.id)).toEqual([3]);
    expect(exact).toBe(false);
  });
});

describe("reply", () => {
  const facts = { returnWindowDays: 7, whatsapp: "+225 07 00 00 00 00" };

  it("answers a product question with products", () => {
    const answer = reply("Trouver un téléphone", catalogue, facts, "fr");
    expect(answer.products.length).toBeGreaterThan(0);
  });

  it("answers a budget question", () => {
    const answer = reply("un téléphone à moins de 300 000", catalogue, facts, "fr");
    expect(answer.products.map((p) => p.id)).toEqual([3]);
  });

  it("uses the shop's own return window", () => {
    expect(reply("retour", catalogue, facts, "fr").text).toContain("7 jours");
  });

  it("offers WhatsApp when it has nothing to show, and answers in English on request", () => {
    const answer = reply("zzzz", catalogue, facts, "en");
    expect(answer.text).toMatch(/cannot find|did not/);
    expect(answer.links[0]?.href).toBe("https://wa.me/225070000000000".replace("225070000000000", "2250700000000"));
  });

  it("answers about delivery with the shop's own wording when it wrote one", () => {
    expect(reply("livraison", catalogue, { deliveryInfo: "Sous 24 h à Abidjan." }, "fr").text).toBe("Sous 24 h à Abidjan.");
    expect(reply("livraison", catalogue, {}, "fr").text).toContain("On livre à l'adresse");
  });

  it("gives the address and hours when asked where the shop is", () => {
    const answer = reply("où est la boutique", catalogue, { address: "Treichville", hours: "8h-19h" }, "fr");
    expect(answer.text).toContain("Treichville");
    expect(answer.text).toContain("8h-19h");
  });

  it("does not guess a return window it was not given", () => {
    expect(reply("retour", catalogue, {}, "fr").text).not.toMatch(/\d jours/);
  });
});
