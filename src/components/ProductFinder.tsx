"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Tr } from "@/components/Tr";
import { useAppearance } from "@/components/AppearanceProvider";
import { ProductTile } from "@/components/ProductTile";
import type { Product } from "@/lib/catalog";
import { BUDGETS, BUDGET_LABELS, finderBrands, finderCategories, findProducts, selectionMessage } from "@/lib/finder";
import { whatsappHref } from "@/lib/help";
import { formatMoneyParts } from "@/lib/money";

const CONDITION_LABEL: Record<Product["condition_state"], string> = {
  neuf: "Nouveau",
  reconditionne: "Reconditionné",
  occasion: "Occasion",
};

const CHIP = "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors";
const CHIP_OFF = "border-line text-ink hover:border-gold";
const CHIP_ON = "border-gold bg-gold text-white";

/**
 * "Find the right product in 3 questions": what, budget, brand. The choices come
 * from the catalogue itself, so every chip leads somewhere; the matches update
 * as the visitor answers and can be sent to the shop on WhatsApp.
 */
export function ProductFinder({ products, whatsapp }: { products: Product[]; whatsapp?: string | null }) {
  const { tr } = useAppearance();
  const categories = useMemo(() => finderCategories(products), [products]);
  const [category, setCategory] = useState<string | null>(categories[0]?.slug ?? null);
  const [budget, setBudget] = useState<string | null>(null);
  const [brand, setBrand] = useState<string | null>(null);

  const brands = useMemo(() => finderBrands(products, category), [products, category]);
  const matches = useMemo(() => findProducts(products, { category, budget, brand }), [products, category, budget, brand]);

  if (categories.length === 0) return null;

  const categoryName = categories.find((entry) => entry.slug === category)?.name ?? null;

  function sendToWhatsApp() {
    if (!whatsapp) return;

    const text = selectionMessage({
      categoryName,
      budgetLabel: budget ? (BUDGET_LABELS[budget] ?? null) : null,
      brand,
      lines: matches.map((product) => {
        const price = product.best_offer ? formatMoneyParts(product.best_offer.price) : null;
        return {
          name: `${product.brand} ${product.name}`,
          price: price ? `${price.amount} ${price.label}` : "",
          url: `${window.location.origin}/produits/${product.slug}`,
        };
      }),
    });

    window.open(`${whatsappHref(whatsapp)}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <section aria-labelledby="finder-title" className="flex flex-col gap-4 rounded-sm bg-surface p-4 shadow-card border-b-4 border-b-gold md:p-6">
      <h2 id="finder-title" className="font-display text-2xl font-bold text-ink">
        <Tr>Trouve le bon produit en 3 questions.</Tr>
      </h2>

      <div className="grid gap-3 md:grid-cols-3">
        <Question step={1} title="Tu cherches...">
          {categories.map((entry) => (
            <button
              key={entry.slug}
              type="button"
              aria-pressed={entry.slug === category}
              onClick={() => {
                setCategory(entry.slug);
                setBrand(null);
              }}
              className={`${CHIP} ${entry.slug === category ? CHIP_ON : CHIP_OFF}`}
            >
              {entry.name}
            </button>
          ))}
        </Question>

        <Question step={2} title="Ton budget">
          {BUDGETS.map((tier) => (
            <button
              key={tier.id}
              type="button"
              aria-pressed={tier.id === budget}
              // Clicking the chosen tier again lifts the limit.
              onClick={() => setBudget(tier.id === budget ? null : tier.id)}
              className={`${CHIP} ${tier.id === budget ? CHIP_ON : CHIP_OFF}`}
            >
              {tr(BUDGET_LABELS[tier.id] ?? tier.id)}
            </button>
          ))}
        </Question>

        <Question step={3} title="Une marque préférée ?">
          {brands.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={name === brand}
              onClick={() => setBrand(name === brand ? null : name)}
              className={`${CHIP} ${name === brand ? CHIP_ON : CHIP_OFF}`}
            >
              {name}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={brand === null}
            onClick={() => setBrand(null)}
            className={`${CHIP} ${brand === null ? CHIP_ON : CHIP_OFF}`}
          >
            <Tr>Peu importe</Tr>
          </button>
        </Question>
      </div>

      <div className="flex flex-col gap-3" aria-live="polite">
        {matches.length > 0 ? (
          matches.map((product) => {
            const price = product.best_offer ? formatMoneyParts(product.best_offer.price) : null;

            return (
              <Link
                key={product.id}
                href={`/produits/${product.slug}`}
                className="flex items-center gap-4 rounded-sm border border-line bg-bg p-3 transition-colors hover:border-gold"
              >
                <div className="w-16 shrink-0 sm:w-20">
                  <ProductTile
                    id={product.id}
                    brand={product.brand}
                    categoryName={null}
                    imageUrl={product.image_url}
                    alt={`${product.brand} ${product.name}`}
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold text-ink">{product.name}</span>
                  <span className="text-xs text-ink-soft">
                    {product.brand} · <Tr>{CONDITION_LABEL[product.condition_state]}</Tr>
                  </span>
                </div>
                {price ? (
                  <span className="shrink-0 text-sm font-semibold text-gold-bright">
                    {price.amount} {price.label}
                  </span>
                ) : null}
              </Link>
            );
          })
        ) : (
          <p className="rounded-sm border border-dashed border-line p-4 text-sm text-ink-soft">
            <Tr>Aucun produit ne correspond à ces choix. Essaie un autre budget ou une autre marque.</Tr>
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {whatsapp ? (
          <button
            type="button"
            onClick={sendToWhatsApp}
            className="inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#15803d]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden /> <Tr>Envoyer ma sélection sur WhatsApp</Tr>
          </button>
        ) : null}
        {category ? (
          <Link
            href={`/?category=${category}`}
            className="inline-flex items-center rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-gold"
          >
            <Tr>Voir tout le rayon</Tr>
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function Question({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-sm border border-line bg-bg p-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
        <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-white">
          {step}
        </span>
        <Tr>{title}</Tr>
      </h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
