import Link from "next/link";
import { marqueeHalf } from "@/lib/brands";

/**
 * The brands on sale, scrolling sideways in an endless loop. The list is drawn
 * twice and the track slides by half its width, so the loop has no jump. It
 * pauses under the pointer, and holds still (scrollable by hand) for visitors
 * who ask for reduced motion. Each name searches the catalogue for that brand.
 */
export function BrandMarquee({ brands }: { brands: string[] }) {
  const half = marqueeHalf(brands);
  if (half.length === 0) return null;

  return (
    <section aria-label="Nos marques" className="brand-marquee overflow-hidden rounded-sm bg-surface py-4 shadow-card">
      <div className="brand-marquee-track flex w-max" style={{ animationDuration: `${half.length * 3}s` }}>
        {[0, 1].map((copy) => (
          // The second copy only completes the loop: hidden from assistive technology and the tab order.
          <ul key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1 ? true : undefined}>
            {half.map((brand, index) => (
              <li key={`${brand}-${index}`} className="px-6 sm:px-8">
                <Link
                  href={`/?search=${encodeURIComponent(brand)}`}
                  tabIndex={copy === 1 ? -1 : undefined}
                  className="font-display text-lg font-bold uppercase tracking-wider text-ink-soft transition-colors hover:text-gold-bright sm:text-xl"
                >
                  {brand}
                </Link>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
