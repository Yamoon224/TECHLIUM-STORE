"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Tr } from "@/components/Tr";
import { useAppearance } from "@/components/AppearanceProvider";
import { ProductCard } from "@/components/ProductCard";
import { ShelfControls } from "@/components/ShelfControls";
import type { Product } from "@/lib/catalog";
import { categoryIcon } from "@/lib/categoryIcons";
import { brandRanges, compareBrands, rangeModels } from "@/lib/compare";
import { brandColor, categoryTiles, TILE_TINTS } from "@/lib/explore";

const SHELF_ID = "explore-shelf";
const SHELF_SIZE = 12;

const CHIP = "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors";
const CHIP_OFF = "border-line text-ink hover:border-gold";
const CHIP_ON = "border-gold bg-gold text-white";

/**
 * "Explorer": the categories as tinted tiles (photos, main brands), then the
 * brands - pick one to see its banner, its ranges and its products on a
 * scrolling shelf. Everything comes from the catalogue.
 */
export function ExploreSection({ products }: { products: Product[] }) {
  const { tr } = useAppearance();
  const tiles = useMemo(() => categoryTiles(products), [products]);
  const brands = useMemo(() => compareBrands(products), [products]);

  const [brand, setBrand] = useState<string | null>(brands[0]?.name ?? null);
  const [range, setRange] = useState<string | null>(null);

  const ranges = useMemo(() => (brand ? brandRanges(products, brand) : []), [products, brand]);
  const shelf = useMemo(() => (brand ? rangeModels(products, brand, range).slice(0, SHELF_SIZE) : []), [products, brand, range]);

  if (tiles.length === 0) return null;

  const total = brand ? rangeModels(products, brand, null).length : 0;
  const shelfTitle = range ? (ranges.find((entry) => entry.slug === range)?.name ?? "") : brand;

  return (
    <section aria-labelledby="explore-title" className="flex flex-col gap-5">
      <h2 id="explore-title" className="text-center font-display text-3xl font-bold text-ink">
        <span className="inline-block border-b-2 border-gold pb-1"><Tr>Explorer</Tr></span>
      </h2>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-ink"><Tr>Catégories</Tr></h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((tile, index) => {
            const Icon = categoryIcon(tile);

            return (
              <div
                key={tile.slug}
                className="group relative flex min-h-36 flex-col justify-between gap-3 overflow-hidden rounded-xl p-4 text-[#111827] transition-shadow hover:shadow-card-hover"
                style={{ backgroundColor: TILE_TINTS[index % TILE_TINTS.length] }}
              >
                {/* The whole tile opens the category; the brand chips sit above this layer. */}
                <Link href={`/?category=${tile.slug}`} aria-label={tile.name} className="absolute inset-0 z-0" />

                <div className="relative z-10 flex items-start justify-between gap-2 pointer-events-none">
                  <span className="font-display text-base font-bold">{tile.name}</span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#111827] text-white">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                </div>

                <div className="relative z-10 flex items-end justify-between gap-2 pointer-events-none">
                  <ul className="flex max-w-[55%] flex-wrap gap-1.5">
                    {tile.brands.map((name) => (
                      <li key={name} className="pointer-events-auto">
                        <Link
                          href={`/?category=${tile.slug}&search=${encodeURIComponent(name)}`}
                          className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-[#111827] transition-colors hover:bg-white"
                        >
                          {name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <span className="flex items-end gap-1">
                    {tile.images.map((src) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={src} src={src} alt="" loading="lazy" className="h-20 w-16 rounded-md bg-white object-contain p-1" />
                    ))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {brands.length > 0 && brand ? (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-ink"><Tr>Marques</Tr></h3>

          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {brands.map((entry) => (
              <button
                key={entry.name}
                type="button"
                aria-pressed={entry.name === brand}
                onClick={() => {
                  setBrand(entry.name);
                  setRange(null);
                }}
                className={`${CHIP} ${entry.name === brand ? CHIP_ON : CHIP_OFF}`}
              >
                {entry.name}
              </button>
            ))}
          </div>

          <div className="rounded-xl p-5 text-white sm:p-6" style={{ backgroundColor: brandColor(brand) }}>
            <p className="font-display text-3xl font-bold">{brand}</p>
            <p className="mt-1 text-sm opacity-90">
              {total} {tr(total > 1 ? "produits" : "produit")}
              {ranges.length > 0 ? ` · ${ranges.map((entry) => entry.name).join(", ")}` : ""}
            </p>
          </div>

          {ranges.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button type="button" aria-pressed={range === null} onClick={() => setRange(null)} className={`${CHIP} ${range === null ? CHIP_ON : CHIP_OFF}`}>
                <Tr>Tout</Tr>
              </button>
              {ranges.map((entry) => (
                <button
                  key={entry.slug}
                  type="button"
                  aria-pressed={entry.slug === range}
                  onClick={() => setRange(entry.slug)}
                  className={`${CHIP} ${entry.slug === range ? CHIP_ON : CHIP_OFF}`}
                >
                  {entry.name}
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <h4 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
              <span aria-hidden className="h-2 w-2 rounded-full bg-gold" />
              {shelfTitle}
            </h4>
            <ShelfControls key={`${brand}-${range ?? "all"}`} target={SHELF_ID} tone="dark" />
          </div>

          <div id={SHELF_ID} key={`${brand}-${range ?? "all"}`} className="flex gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {shelf.map((product) => (
              <div key={product.id} className="w-[calc((100%-0.5rem)/2)] flex-none snap-start sm:w-[calc((100%-1rem)/3)] lg:w-[calc((100%-2rem)/5)] [&>*]:h-full">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
