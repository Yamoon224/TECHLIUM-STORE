"use client";

import { Tr } from "@/components/Tr";
import type { ProductColor } from "@/lib/catalog";

const SIZE = { sm: "h-4 w-4", lg: "h-8 w-8" } as const;

/**
 * Colour choices as round swatches. On product cards they only inform; on the
 * product page (`onSelect` given) one can be picked and its name is shown.
 */
export function ColorSwatches({
  colors,
  size,
  selected = 0,
  onSelect,
}: {
  colors: ProductColor[];
  size: keyof typeof SIZE;
  selected?: number;
  onSelect?: (index: number) => void;
}) {
  if (!onSelect) {
    return (
      <ul className="flex items-center gap-1.5" aria-label="Couleurs">
        {colors.map((color) => (
          <li
            key={color.hex + color.name}
            title={color.name}
            className={`${SIZE[size]} rounded-full border border-line`}
            style={{ backgroundColor: color.hex }}
          />
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-ink-soft">
        <Tr>Couleur</Tr> : <span className="text-ink">{colors[selected]?.name}</span>
      </p>
      <div role="radiogroup" aria-label="Couleur" className="flex flex-wrap items-center gap-2.5">
        {colors.map((color, index) => (
          <button
            key={color.hex + color.name}
            type="button"
            role="radio"
            aria-checked={index === selected}
            aria-label={color.name}
            title={color.name}
            onClick={() => onSelect(index)}
            className={`${SIZE[size]} rounded-full border border-line outline-offset-2 transition-transform hover:scale-110 ${
              index === selected ? "outline outline-2 outline-gold" : ""
            }`}
            style={{ backgroundColor: color.hex }}
          />
        ))}
      </div>
    </div>
  );
}
