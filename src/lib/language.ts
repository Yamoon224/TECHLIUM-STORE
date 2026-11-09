/**
 * The visitor's language also lives in a cookie, because the catalogue pages
 * are rendered on the server and must ask the API for the right texts.
 * localStorage (appearance) stays the source for the interface itself.
 */

import type { Language } from "./appearance";

<<<<<<< HEAD
export const LANGUAGE_COOKIE = "TechLium_lang";
=======
export const LANGUAGE_COOKIE = "TechniLium_lang";
>>>>>>> dde13f7e9ef378354971238907150faefa52b6bb
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function parseLanguage(value: string | null | undefined): Language {
  return value === "en" ? "en" : "fr";
}

/** The Set-Cookie string for the language (no secret in it, readable by the server on every request). */
export function languageCookie(language: Language): string {
  return `${LANGUAGE_COOKIE}=${language}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}

/** Reads the language out of a document.cookie string. */
export function languageFromCookieString(cookieString: string): Language {
  const match = cookieString.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${LANGUAGE_COOKIE}=`));
  return parseLanguage(match?.slice(LANGUAGE_COOKIE.length + 1));
}

/** "?lang=en" only for English: French is the API's default, so the URL (and its cache entry) stays unchanged. */
export function languageQuery(language: Language): string {
  return language === "en" ? "lang=en" : "";
}
