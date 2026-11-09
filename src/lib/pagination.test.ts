import { describe, expect, it } from "vitest";
import { pageHref, pageItems, parsePage } from "./pagination";

describe("parsePage", () => {
  it("falls back to page 1", () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage("2.5")).toBe(1);
  });

  it("reads a valid page", () => {
    expect(parsePage("3")).toBe(3);
  });
});

describe("pageItems", () => {
  it("lists every page when there are few", () => {
    expect(pageItems(1, 3)).toEqual([1, 2, 3]);
  });

  it("collapses the far pages into gaps", () => {
    expect(pageItems(10, 20)).toEqual([1, null, 9, 10, 11, null, 20]);
    expect(pageItems(1, 20)).toEqual([1, 2, null, 20]);
    expect(pageItems(3, 20)).toEqual([1, 2, 3, 4, null, 20]);
  });
});

describe("pageHref", () => {
  it("keeps the filters and drops page 1", () => {
    expect(pageHref({ category: "a", search: "b c" }, 1)).toBe("/?category=a&search=b+c");
    expect(pageHref({ category: "a" }, 2)).toBe("/?category=a&page=2");
    expect(pageHref({}, 1)).toBe("/");
  });
});
