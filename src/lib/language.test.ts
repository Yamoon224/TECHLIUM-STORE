import { describe, expect, it } from "vitest";
import { languageCookie, languageFromCookieString, languageQuery, parseLanguage } from "./language";

describe("language cookie", () => {
  it("only knows fr and en, French by default", () => {
    expect(parseLanguage("en")).toBe("en");
    expect(parseLanguage("de")).toBe("fr");
    expect(parseLanguage(undefined)).toBe("fr");
  });

  it("is a year-long, site-wide, same-site cookie", () => {
    expect(languageCookie("en")).toBe("TechLium_lang=en; Path=/; Max-Age=31536000; SameSite=Lax");
  });

  it("is found among other cookies", () => {
    expect(languageFromCookieString("a=1; TechLium_lang=en; b=2")).toBe("en");
    expect(languageFromCookieString("a=1")).toBe("fr");
    expect(languageFromCookieString("TechLium_lang=zz")).toBe("fr");
  });

  it("adds a query only for English", () => {
    expect(languageQuery("en")).toBe("lang=en");
    expect(languageQuery("fr")).toBe("");
  });
});
