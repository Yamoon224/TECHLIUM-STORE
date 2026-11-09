/**
 * Slides of the storefront banners, managed from the backoffice (/bannieres).
 * A failure is not an error for the page: without slides the page simply shows
 * its static content instead.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export type BannerPlacement = "hero" | "footer" | "left" | "right";

export interface BannerSlide {
  id: number;
  image_url: string;
  title: string | null;
  link_url: string | null;
}

export async function getBanners(placement: BannerPlacement): Promise<BannerSlide[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/catalog/banners?placement=${placement}`, { next: { revalidate: 60 } });
    if (!response.ok) return [];
    return (await response.json()) as BannerSlide[];
  } catch {
    return [];
  }
}

/** Index of the slide after `current`, wrapping around; `step` is 1 (next) or -1 (previous). */
export function stepIndex(current: number, count: number, step: 1 | -1): number {
  if (count <= 0) return 0;
  return (current + step + count) % count;
}
