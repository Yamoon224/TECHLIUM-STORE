import type { ProductColor } from "@/lib/catalog";

/** A colour as a small dot followed by its name, for cart and order lines. */
export function ColorLabel({ color }: { color: ProductColor }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
      <span aria-hidden className="h-3 w-3 rounded-full border border-line" style={{ backgroundColor: color.hex }} />
      {color.name}
    </span>
  );
}
