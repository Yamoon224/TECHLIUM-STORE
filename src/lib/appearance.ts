/**
 * Appearance choices of the storefront (theme, accent colour, language),
 * kept on this device. Pure helpers; the provider applies them to the page.
 */

export type ThemeChoice = "light" | "dark" | "auto";
export type Language = "fr" | "en";

export interface Appearance {
  theme: ThemeChoice;
  accent: string;
  language: Language;
}

<<<<<<< HEAD
export const STORAGE_KEY = "TechLium_store_appearance";
=======
export const STORAGE_KEY = "TechniLium_store_appearance";
>>>>>>> dde13f7e9ef378354971238907150faefa52b6bb

/** The brand orange first (the default), then a few alternatives. */
export const ACCENT_COLORS = ["#f68b1e", "#2563eb", "#7c3aed", "#e11d48", "#059669", "#0e7490"] as const;

export const DEFAULT_APPEARANCE: Appearance = { theme: "auto", accent: ACCENT_COLORS[0], language: "fr" };

const HEX = /^#[0-9a-f]{6}$/i;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX.test(value);
}

export function resolveTheme(choice: ThemeChoice, systemPrefersDark: boolean): "light" | "dark" {
  return choice === "auto" ? (systemPrefersDark ? "dark" : "light") : choice;
}

/** Mixes a colour toward white (amount > 0) or black (amount < 0). */
export function shade(hex: string, amount: number): string {
  if (!isHexColor(hex)) return hex;

  const target = amount < 0 ? 0 : 255;
  const ratio = Math.min(1, Math.abs(amount));
  const mix = (offset: number) =>
    Math.round(parseInt(hex.slice(offset, offset + 2), 16) * (1 - ratio) + target * ratio)
      .toString(16)
      .padStart(2, "0");

  return `#${mix(1)}${mix(3)}${mix(5)}`;
}

/** Reads what was stored, keeping only valid values. */
export function parseAppearance(raw: string | null): Appearance {
  if (!raw) return DEFAULT_APPEARANCE;

  let data: Partial<Record<keyof Appearance, unknown>>;
  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    return DEFAULT_APPEARANCE;
  }
  if (typeof data !== "object" || data === null) return DEFAULT_APPEARANCE;

  return {
    theme: data.theme === "light" || data.theme === "dark" || data.theme === "auto" ? data.theme : DEFAULT_APPEARANCE.theme,
    accent: isHexColor(data.accent) ? data.accent : DEFAULT_APPEARANCE.accent,
    language: data.language === "fr" || data.language === "en" ? data.language : DEFAULT_APPEARANCE.language,
  };
}

export function loadAppearance(): Appearance {
  try {
    return parseAppearance(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function saveAppearance(appearance: Appearance): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance));
  } catch {
    // Storage unavailable: the choice lasts for this visit only.
  }
}

/** CSS variables for the accent: the text-accent shade follows the theme so it stays readable. */
export function accentVariables(accent: string, theme: "light" | "dark"): Record<string, string> {
  return {
    "--gold": accent,
    "--gold-bright": theme === "dark" ? shade(accent, 0.25) : shade(accent, -0.2),
    "--gold-deep": shade(accent, -0.15),
    // A soft tint for badges and highlights, dark in the dark theme.
    "--gold-highlight": theme === "dark" ? shade(accent, -0.75) : shade(accent, 0.88),
  };
}

export const MANAGED_VARIABLES = ["--gold", "--gold-bright", "--gold-deep", "--gold-highlight"] as const;
