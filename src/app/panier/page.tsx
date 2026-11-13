"use client";

import { Tr } from "@/components/Tr";
import { MAX_LINE_QUANTITY } from "@/lib/cart";
import { ColorLabel } from "@/components/ColorLabel";
import { useAppearance } from "@/components/AppearanceProvider";
import { ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { ProductTile } from "@/components/ProductTile";
import { formatMoneyParts } from "@/lib/money";

export default function CartPage() {
  const { tr } = useAppearance();
  const { items, updateQuantity, remove, subtotalAmount, count } = useCart();

  if (items.length === 0) {
    return (
      <main className="mx-auto my-4 flex w-[calc(100%-2rem)] max-w-3xl flex-col items-center gap-3 rounded-sm bg-surface p-10 text-center shadow-card border-b-4 border-b-gold">
        <ShoppingCart className="h-12 w-12 text-gold" aria-hidden />
        <h1 className="font-display text-2xl font-semibold text-ink"><Tr>Votre panier est vide</Tr></h1>
        <p className="text-ink-soft"><Tr>Parcourez le catalogue pour y ajouter des produits.</Tr></p>
        <Link
          href="/"
          className="rounded-sm bg-gold px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gold-bright"
        >
          <Tr>Voir le catalogue</Tr>
        </Link>
      </main>
    );
  }

  const currency = items[0]?.currency ?? "XOF";
  const subtotal = formatMoneyParts({ amount: subtotalAmount, currency });

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-4">
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
        <section className="overflow-hidden rounded-sm bg-surface shadow-card border-b-4 border-b-gold">
          <h1 className="border-b border-line px-4 py-3 font-display text-lg font-semibold text-ink">
            <Tr>Panier (</Tr>{count})
          </h1>

          <ul className="flex flex-col divide-y divide-line">
            {items.map((item) => {
              const lineTotal = formatMoneyParts({ amount: item.priceAmount * item.quantity, currency: item.currency });
              const unit = formatMoneyParts({ amount: item.priceAmount, currency: item.currency });

              return (
                <li key={`${item.offerId}-${item.color?.name ?? ""}`} className="flex items-start gap-4 p-4">
                  <div className="w-20 shrink-0">
                    <ProductTile
                      id={item.offerId}
                      brand={item.brand}
                      categoryName={null}
                      imageUrl={item.imageUrl}
                      alt={item.productName}
                    />
                  </div>

                  <div className="flex flex-1 flex-col gap-1">
                    <Link href={`/produits/${item.productSlug}`} className="text-sm font-medium text-ink hover:text-gold">
                      {item.brand} {item.productName}
                    </Link>
                    {item.color ? <ColorLabel color={item.color} /> : null}
                    <p className="text-xs text-ink-soft">
                      <Tr>Prix unitaire :</Tr> {unit.amount} {unit.label}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.offerId, item.quantity - 1, item.color?.name)}
                        disabled={item.quantity <= 1}
                        className="h-8 w-8 rounded-sm border border-line text-ink hover:border-gold disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line"
                        aria-label={tr("Diminuer la quantité")}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm text-ink">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.offerId, item.quantity + 1, item.color?.name)}
                        disabled={item.quantity >= MAX_LINE_QUANTITY}
                        className="h-8 w-8 rounded-sm border border-line text-ink hover:border-gold disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={tr("Augmenter la quantité")}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(item.offerId, item.color?.name)}
                        className="ml-3 flex items-center gap-1 text-xs font-medium text-gold-bright underline-offset-4 hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden /> <Tr>Retirer</Tr>
                      </button>
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-ink">
                    {lineTotal.amount} {lineTotal.label}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <aside className="flex flex-col gap-3 rounded-sm bg-surface p-4 shadow-card border-b-4 border-b-gold lg:sticky lg:top-28">
          <h2 className="font-display text-base font-semibold text-ink"><Tr>Récapitulatif</Tr></h2>
          <div className="flex items-center justify-between border-b border-line pb-3 text-sm">
            <span className="text-ink-soft"><Tr>Sous-total</Tr></span>
            <span className="text-lg font-semibold text-ink">
              {subtotal.amount} {subtotal.label}
            </span>
          </div>
          <p className="text-xs text-ink-soft"><Tr>Paiement à la livraison. Le code promo se saisit à l&apos;étape suivante.</Tr></p>

          <Link
            href="/commande"
            className="rounded-sm bg-gold px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-gold-bright"
          >
            <Tr>Passer la commande</Tr>
          </Link>
        </aside>
      </div>
    </main>
  );
}
