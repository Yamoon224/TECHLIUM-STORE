"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Tr } from "@/components/Tr";
import { useAppearance } from "@/components/AppearanceProvider";
import { ProductTile } from "@/components/ProductTile";
import { SearchSelect } from "@/components/SearchSelect";
import type { Product } from "@/lib/catalog";
import { brandRanges, compareBrands, COMPARE_SLOTS, defaultPicks, modelName, rangeModels, specRows } from "@/lib/compare";
import { formatMoneyParts } from "@/lib/money";

const CONDITION_LABEL: Record<Product["condition_state"], string> = {
  neuf: "Neuf",
  reconditionne: "Reconditionné",
  occasion: "Occasion",
};

const CHIP = "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors";
const CHIP_OFF = "border-line text-ink hover:border-gold";
const CHIP_ON = "border-gold bg-gold text-white";

/**
 * "Compare the models": pick a brand, then one of its ranges, then set up to
 * three of its models side by side - price, condition, warranty and every spec
 * the products carry. The choices come from the catalogue itself.
 */
export function ProductComparator({ products }: { products: Product[] }) {
  const { tr } = useAppearance();
  const brands = useMemo(() => compareBrands(products), [products]);

  const [brand, setBrand] = useState<string | null>(brands[0]?.name ?? null);
  const ranges = useMemo(() => (brand ? brandRanges(products, brand) : []), [products, brand]);
  const [category, setCategory] = useState<string | null>(ranges[0]?.slug ?? null);
  const models = useMemo(() => (brand ? rangeModels(products, brand, category) : []), [products, brand, category]);
  const [picks, setPicks] = useState<number[]>(() => defaultPicks(models));

  // The compared models, in column order; a pick that left the range is dropped.
  const compared = useMemo(
    () => picks.map((id) => models.find((model) => model.id === id)).filter((model): model is Product => Boolean(model)),
    [picks, models],
  );
  const rows = useMemo(() => specRows(compared), [compared]);

  if (brands.length === 0 || !brand) return null;

  function chooseBrand(name: string) {
    const nextRanges = brandRanges(products, name);
    const nextCategory = nextRanges[0]?.slug ?? null;
    setBrand(name);
    setCategory(nextCategory);
    setPicks(defaultPicks(rangeModels(products, name, nextCategory)));
  }

  function chooseRange(slug: string) {
    setCategory(slug);
    setPicks(defaultPicks(rangeModels(products, brand as string, slug)));
  }

  function pick(column: number, id: number) {
    setPicks((current) => current.map((existing, index) => (index === column ? id : existing)));
  }

  const columns = { gridTemplateColumns: `repeat(${compared.length}, minmax(9.5rem, 1fr))` };

  return (
    <section aria-labelledby="compare-title" className="flex flex-col gap-4">
      <div className="text-center">
        <h2 id="compare-title" className="font-display text-3xl font-bold text-ink">
          <Tr>Comparer les</Tr> <span className="text-gold-bright"><Tr>modèles</Tr></span>
        </h2>
        <p className="text-sm text-ink-soft"><Tr>Côte à côte, en un coup d&apos;œil.</Tr></p>
      </div>

      <Step number={1} title="Choisis une marque">
        {brands.map((entry) => (
          <button
            key={entry.name}
            type="button"
            aria-pressed={entry.name === brand}
            onClick={() => chooseBrand(entry.name)}
            className={`${CHIP} ${entry.name === brand ? CHIP_ON : CHIP_OFF}`}
          >
            {entry.name}
          </button>
        ))}
      </Step>

      <Step number={2} title="Choisis une gamme">
        {ranges.map((range) => (
          <button
            key={range.slug}
            type="button"
            aria-pressed={range.slug === category}
            onClick={() => chooseRange(range.slug)}
            className={`${CHIP} ${range.slug === category ? CHIP_ON : CHIP_OFF}`}
          >
            {range.name} <span className="text-[10px] opacity-70">{range.count}</span>
          </button>
        ))}
      </Step>

      <div className="overflow-x-auto rounded-sm border border-line bg-surface p-3 shadow-card md:p-4">
        <div className="flex min-w-max flex-col gap-3 md:min-w-0">
          <div className="grid items-start gap-3" style={columns}>
            {compared.map((model, column) => {
              const taken = new Set(picks.filter((_, index) => index !== column));

              return (
                <div key={column} className="flex flex-col items-center gap-3">
                  <label className="field w-full">
                    <SearchSelect
                      value={model.id}
                      onChange={(event) => pick(column, Number(event.target.value))}
                      aria-label={`${tr("Modèle")} ${column + 1}`}
                      className="text-sm font-semibold"
                    >
                      {models.map((option) => {
                        const price = option.best_offer ? formatMoneyParts(option.best_offer.price) : null;
                        return (
                          <option key={option.id} value={option.id} disabled={taken.has(option.id)}>
                            {modelName(option)}
                            {price ? ` · ${price.amount} ${price.label}` : ""}
                          </option>
                        );
                      })}
                    </SearchSelect>
                    <span className="field-label">{`${tr("Modèle")} ${column + 1}`}</span>
                  </label>
                  <Link href={`/produits/${model.slug}`} className="w-24">
                    <ProductTile
                      id={model.id}
                      brand={model.brand}
                      categoryName={null}
                      imageUrl={model.image_url}
                      alt={modelName(model)}
                    />
                  </Link>
                </div>
              );
            })}
          </div>

          <dl className="flex flex-col divide-y divide-line border-t border-line text-center text-xs">
            <Row label="Prix" columns={columns}>
              {compared.map((model) => {
                const price = model.best_offer ? formatMoneyParts(model.best_offer.price) : null;
                return <strong key={model.id} className="text-sm text-ink">{price ? `${price.amount} ${price.label}` : "—"}</strong>;
              })}
            </Row>
            <Row label="État" columns={columns}>
              {compared.map((model) => (
                <span key={model.id} className="text-ink"><Tr>{CONDITION_LABEL[model.condition_state]}</Tr></span>
              ))}
            </Row>
            <Row label="Garantie" columns={columns}>
              {compared.map((model) => (
                <span key={model.id} className="text-ink">
                  {model.best_offer && model.best_offer.warranty_months > 0 ? `${model.best_offer.warranty_months} ${tr("mois")}` : "—"}
                </span>
              ))}
            </Row>
            {rows.map((row) => (
              <Row key={row.key} label={tr(row.label)} columns={columns} raw>
                {row.values.map((value, index) => (
                  <span key={index} className="text-ink">{value ?? "—"}</span>
                ))}
              </Row>
            ))}
          </dl>

          <div className="grid gap-3" style={columns}>
            {compared.map((model) => (
              <Link
                key={model.id}
                href={`/produits/${model.slug}`}
                className="mx-auto inline-flex items-center rounded-full bg-gold px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-gold-bright"
              >
                <Tr>Commander</Tr>
              </Link>
            ))}
          </div>

          {compared.length < COMPARE_SLOTS && models.length <= compared.length ? (
            <p className="text-center text-xs text-ink-soft"><Tr>Cette gamme n&apos;a pas encore d&apos;autre modèle à comparer.</Tr></p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-sm border border-line bg-surface p-3 shadow-card">
      <h3 className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">
        <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[11px] font-bold text-white">
          {number}
        </span>
        <Tr>{title}</Tr>
      </h3>
      <div className="flex flex-wrap justify-center gap-2">{children}</div>
    </div>
  );
}

/** One line of the table: its label on the left, one cell per compared model. */
function Row({
  label,
  columns,
  raw = false,
  children,
}: {
  label: string;
  columns: React.CSSProperties;
  /** The label is already translated. */
  raw?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 py-2.5">
      <dt className="text-left text-[10px] font-medium uppercase tracking-wider text-ink-soft">{raw ? label : <Tr>{label}</Tr>}</dt>
      <dd className="grid items-center gap-3" style={columns}>
        {children}
      </dd>
    </div>
  );
}
