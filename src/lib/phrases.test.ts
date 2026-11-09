import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PHRASES_EN } from "./phrases";

/** Brand names and example values that read the same in both languages. */
const SAME_IN_BOTH = new Set(["TechLium", "Abidjan", "BIENVENUE10", "(PDF)", "Auto", "Total", "Code", "SKU"]);

// tr("...") with a plain string literal (escaped quotes allowed).
const TRANSLATED_LITERAL = /\btr\(("(?:[^"\\]|\\.)*")\)/g;
// <Tr>plain text</Tr> (JSX text, entities allowed).
const TR_TEXT = /<Tr>([^<>{}]+)<\/Tr>/g;
// <Tr>{cond ? "A" : "B"}</Tr>: the string literals inside.
const TR_CONDITIONAL = /<Tr>\{[^{}<>]*?\?[^{}<>]*\}<\/Tr>/g;
const STRING_LITERAL = /"((?:[^"\\]|\\.)*)"/g;

const decode = (text: string) =>
  text.replace(/\s+/g, " ").trim().replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx$/.test(entry) ? [path] : [];
  });
}

describe("storefront phrases", () => {
  it("has an English wording for every text wrapped in <Tr> or tr(...)", () => {
    const missing: string[] = [];

    for (const file of [...sources(join(__dirname, "../app")), ...sources(join(__dirname, "../components"))]) {
      const source = readFileSync(file, "utf8");
      const found: string[] = [];

      for (const match of source.matchAll(TRANSLATED_LITERAL)) found.push(JSON.parse(match[1]) as string);
      for (const match of source.matchAll(TR_TEXT)) found.push(decode(match[1]));
      for (const block of source.matchAll(TR_CONDITIONAL)) {
        for (const literal of block[0].matchAll(STRING_LITERAL)) found.push(literal[1]);
      }

      for (const french of found) {
        if (!SAME_IN_BOTH.has(french) && !(french in PHRASES_EN)) missing.push(`${file.split(/[\\/]/).slice(-2).join("/")}: ${french}`);
      }
    }

    expect([...new Set(missing)]).toEqual([]);
  });

  it("never leaves an English entry empty", () => {
    for (const [french, english] of Object.entries(PHRASES_EN)) expect(english.trim(), french).not.toBe("");
  });
});
