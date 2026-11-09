"use client";

import { Tr } from "@/components/Tr";
import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useAppearance } from "./AppearanceProvider";
import { useCart } from "./CartProvider";
import type { CurrencyCode } from "@/lib/money";

export interface AddToCartButtonProps {
  offerId: number;
  productSlug: string;
  productName: string;
  brand: string;
  priceAmount: number;
  currency: CurrencyCode;
  stockQuantity: number;
  imageUrl?: string | null;
  /** Denser padding/label for grid cards, where space is tight. */
  compact?: boolean;
}

export function AddToCartButton({
  offerId,
  productSlug,
  productName,
  brand,
  priceAmount,
  currency,
  stockQuantity,
  imageUrl,
  compact = false,
}: AddToCartButtonProps) {
  const { add, items, updateQuantity } = useCart();
  const { tr } = useAppearance();
  const [added, setAdded] = useState(false);

  const alreadyInCart = items.find((line) => line.offerId === offerId)?.quantity ?? 0;
  const outOfStock = stockQuantity <= 0;
  const atStockLimit = alreadyInCart >= stockQuantity;
  const sizeClasses = compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm";

  function handleClick() {
    add(
      { offerId, productSlug, productName, brand, priceAmount, currency, maxQuantity: stockQuantity, imageUrl },
      1,
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  if (outOfStock) {
    return (
      <button
        type="button"
        disabled
        className={`w-full cursor-not-allowed rounded-sm border border-line bg-surface text-ink-soft ${sizeClasses}`}
      >
        <Tr>Rupture de stock</Tr>
      </button>
    );
  }

  // Already in the cart: the quantity is changed here, the product is not added a second time.
  if (alreadyInCart > 0) {
    const stepper = `flex items-center justify-center rounded-sm border border-line text-ink transition-colors hover:border-gold disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line ${compact ? "h-8 w-8" : "h-10 w-10"}`;

    return (
      <div className="flex w-full items-center justify-between gap-2" role="group" aria-label={tr("Quantité dans le panier")}>
        <button type="button" onClick={() => updateQuantity(offerId, alreadyInCart - 1)} disabled={alreadyInCart <= 1} aria-label={tr("Diminuer la quantité")} className={stepper}>
          <Minus className="h-4 w-4" aria-hidden />
        </button>
        <span className={`min-w-8 text-center font-medium text-ink ${compact ? "text-xs" : "text-sm"}`} aria-live="polite">
          {alreadyInCart}
        </span>
        <button type="button" onClick={() => updateQuantity(offerId, alreadyInCart + 1)} disabled={atStockLimit} aria-label={tr("Augmenter la quantité")} className={stepper}>
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={atStockLimit}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-sm bg-gold font-medium text-white transition-colors hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-60 ${sizeClasses}`}
    >
      {!atStockLimit && !added && <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden />}
      {atStockLimit ? <Tr>Stock maximum</Tr> : added ? <Tr>Ajouté ✓</Tr> : <Tr>Ajouter au panier</Tr>}
    </button>
  );
}
