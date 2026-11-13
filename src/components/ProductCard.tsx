import Link from "next/link";
import { Tr } from "@/components/Tr";
import { formatMoneyParts } from "@/lib/money";
import { discountPercent } from "@/lib/pricing";
import type { Product } from "@/lib/catalog";
import { AddToCartButton } from "./AddToCartButton";
import { ColorSwatches } from "./ColorSwatches";
import { ProductTile } from "./ProductTile";

const CONDITION_LABEL: Record<Product["condition_state"], string> = {
  neuf: "Neuf",
  reconditionne: "Reconditionné",
  occasion: "Occasion",
};

/** Few units left: a nudge, shown only when it is true. */
const LOW_STOCK_THRESHOLD = 5;

export function ProductCard({ product }: { product: Product }) {
  const offer = product.best_offer;
  const price = offer ? formatMoneyParts(offer.price) : null;
  const reference = offer?.compare_at_price ? formatMoneyParts(offer.compare_at_price) : null;
  const percent = offer ? discountPercent(offer) : null;

  return (
    <div className="group flex h-full flex-col gap-2 rounded-sm bg-surface p-2 shadow-card border-b-4 border-b-gold transition-shadow hover:shadow-card-hover">
      <Link href={`/produits/${product.slug}`} className="relative flex flex-1 flex-col gap-2">
        <div className="relative">
          <ProductTile
            id={product.id}
            brand={product.brand}
            categoryName={product.category?.name ?? null}
            imageUrl={product.image_url}
            alt={`${product.brand} ${product.name}`}
          />
          {percent ? (
            <span className="absolute right-2 top-2 rounded-sm bg-gold-highlight px-1.5 py-0.5 text-xs font-semibold text-gold-bright">
              -{percent}%
            </span>
          ) : null}
        </div>

        <h3 className="line-clamp-2 text-sm leading-snug text-ink">
          {product.brand} {product.name}
        </h3>

        {product.colors?.length ? <ColorSwatches colors={product.colors} size="sm" /> : null}

        {price ? (
          <div className="flex flex-col">
            <span className="text-base font-semibold text-ink">
              {price.amount} {price.label}
            </span>
            {reference && percent ? (
              <span className="text-xs text-ink-soft line-through">
                {reference.amount} {reference.label}
              </span>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-ink-soft"><Tr>Bientôt disponible</Tr></p>
        )}

        {offer && !offer.in_stock ? (
          // Still orderable: an active product is never hidden or blocked for lack of stock.
          <p className="text-xs font-medium text-gold-bright"><Tr>Sur commande</Tr></p>
        ) : offer && offer.stock_quantity <= LOW_STOCK_THRESHOLD ? (
          <p className="text-xs font-medium text-gold-bright">{offer.stock_quantity} <Tr>{offer.stock_quantity > 1 ? "articles restants" : "article restant"}</Tr></p>
        ) : null}

        <p className="text-xs text-ink-soft">
          <Tr>{CONDITION_LABEL[product.condition_state]}</Tr>
          {offer && offer.warranty_months > 0 ? (
            <>
              , <Tr>garanti</Tr> {offer.warranty_months} <Tr>mois</Tr>
            </>
          ) : null}
        </p>

        {offer && offer.seller === "vendor" ? <p className="text-xs text-gold-bright"><Tr>Vendeur vérifié</Tr></p> : null}
      </Link>

      {offer && product.colors?.length ? (
        <Link
          href={`/produits/${product.slug}`}
          className="inline-flex w-full items-center justify-center rounded-sm border border-gold px-3 py-2 text-xs font-medium text-gold-bright transition-colors hover:bg-gold-highlight"
        >
          <Tr>Choisir une couleur</Tr>
        </Link>
      ) : offer ? (
        <AddToCartButton
          offerId={offer.id}
          productSlug={product.slug}
          productName={product.name}
          brand={product.brand}
          priceAmount={offer.price.amount}
          currency={offer.price.currency}
          imageUrl={product.image_url}
          compact
        />
      ) : null}
    </div>
  );
}
