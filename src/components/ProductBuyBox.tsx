"use client";

import { useState } from "react";
import { AddToCartButton, type AddToCartButtonProps } from "@/components/AddToCartButton";
import { ColorSwatches } from "@/components/ColorSwatches";
import type { ProductColor } from "@/lib/catalog";

/** Colour picker and add-to-cart on the product page: the button adds the colour picked. */
export function ProductBuyBox({
  colors,
  ...cart
}: { colors: ProductColor[] } & Omit<AddToCartButtonProps, "color" | "compact">) {
  const [selected, setSelected] = useState(0);
  const color = colors[selected] ?? null;

  return (
    <>
      {colors.length > 0 ? <ColorSwatches colors={colors} size="lg" selected={selected} onSelect={setSelected} /> : null}
      <div className="max-w-sm">
        <AddToCartButton {...cart} color={color} />
      </div>
    </>
  );
}
