import { BadgeCheck, ShieldCheck, Store, Truck } from "lucide-react";
import { Tr } from "@/components/Tr";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductReviews } from "@/components/ProductReviews";
import { ProductGallery } from "@/components/ProductGallery";
import { formatMoneyParts } from "@/lib/money";
import { discountPercent } from "@/lib/pricing";
import { cookies } from "next/headers";
import { getProduct } from "@/lib/catalog";
import { LANGUAGE_COOKIE, parseLanguage } from "@/lib/language";

const CONDITION_LABEL: Record<string, string> = {
  neuf: "Neuf",
  reconditionne: "Reconditionné",
  occasion: "Occasion",
};

const ATTRIBUTE_LABEL: Record<string, string> = {
  ram_gb: "Mémoire vive",
  storage_gb: "Stockage",
  color: "Couleur",
};

/** Few units left: shown only when it is true. */
const LOW_STOCK_THRESHOLD = 5;

/** Resolves `params` and the product inside the page's Suspense boundary (see HomeCatalog). */
export async function ProductDetail({ params }: Pick<PageProps<"/produits/[slug]">, "params">) {
  const { slug } = await params;
  const language = parseLanguage((await cookies()).get(LANGUAGE_COOKIE)?.value);
  const product = await getProduct(slug, language);

  if (!product) {
    notFound();
  }

  const offer = product.best_offer;
  const price = offer ? formatMoneyParts(offer.price) : null;
  const compareAt = offer?.compare_at_price ? formatMoneyParts(offer.compare_at_price) : null;
  const percent = offer ? discountPercent(offer) : null;

  const specs = Object.entries(product.attributes ?? {});
  const variantAttributes = product.variants[0]?.attributes
    ? Object.entries(product.variants[0].attributes)
    : [];
  const hasDetails = Boolean(product.description) || specs.length > 0 || variantAttributes.length > 0;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-4">
      <nav aria-labelledby="breadcrumb-title" className="flex flex-wrap items-center gap-1.5 text-sm text-ink-soft">
        <h2 id="breadcrumb-title" className="sr-only">
          <Tr>Fil d&apos;Ariane</Tr>
        </h2>
        <Link href="/" className="hover:text-gold">
          <Tr>Accueil</Tr>
        </Link>
        {product.category ? (
          <>
            <span aria-hidden>/</span>
            <Link href={`/?category=${product.category.slug}`} className="hover:text-gold">
              {product.category.name}
            </Link>
          </>
        ) : null}
        <span aria-hidden>/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-6 rounded-sm bg-surface p-4 shadow-card border-b-4 border-b-gold md:grid-cols-[minmax(0,420px)_1fr] md:p-6">
        <ProductGallery
          id={product.id}
          brand={product.brand}
          categoryName={product.category?.name ?? null}
          alt={`${product.brand} ${product.name}`}
          images={product.images ?? []}
        />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-gold-bright">{product.brand}</p>
            <h1 className="font-display text-2xl font-semibold text-ink">{product.name}</h1>
            <p className="text-sm text-ink-soft">
              <Tr>{CONDITION_LABEL[product.condition_state]}</Tr>
              {offer && offer.warranty_months > 0 ? (
                <>
                  , <Tr>garanti</Tr> {offer.warranty_months} <Tr>mois</Tr>
                </>
              ) : null}
            </p>
          </div>

          <hr className="border-line" />

          {price ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-display text-3xl font-semibold text-ink">
                {price.amount} <span className="text-base font-medium">{price.label}</span>
              </p>
              {compareAt && percent ? (
                <>
                  <p className="text-base text-ink-soft line-through">
                    {compareAt.amount} {compareAt.label}
                  </p>
                  <span className="rounded-sm bg-gold-highlight px-2 py-0.5 text-sm font-semibold text-gold-bright">
                    -{percent}%
                  </span>
                </>
              ) : null}
            </div>
          ) : (
            <p className="text-ink-soft"><Tr>Bientôt disponible</Tr></p>
          )}

          {offer && offer.in_stock && offer.stock_quantity <= LOW_STOCK_THRESHOLD ? (
            <p className="text-sm font-medium text-gold-bright"><Tr>Plus que</Tr> {offer.stock_quantity} <Tr>en stock</Tr></p>
          ) : null}

          {offer ? (
            <div className="max-w-sm">
              <AddToCartButton
                offerId={offer.id}
                productSlug={product.slug}
                productName={product.name}
                brand={product.brand}
                priceAmount={offer.price.amount}
                currency={offer.price.currency}
                stockQuantity={offer.stock_quantity}
                imageUrl={product.image_url}
              />
            </div>
          ) : null}

          <ul className="flex flex-col gap-2 rounded-sm bg-bg p-3 text-sm text-ink">
            <li className="flex items-center gap-2.5">
              <Truck className="h-5 w-5 shrink-0 text-gold" aria-hidden /> <Tr>Paiement à la livraison</Tr>
            </li>
            {offer && offer.warranty_months > 0 ? (
              <li className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 shrink-0 text-gold" aria-hidden /> <Tr>Garantie de</Tr> {offer.warranty_months} <Tr>mois</Tr>
              </li>
            ) : null}
            {offer ? (
              <li className="flex items-center gap-2.5">
                {offer.seller === "vendor" ? (
                  <>
<<<<<<< HEAD
                    <BadgeCheck className="h-5 w-5 shrink-0 text-gold" aria-hidden /> <Tr>Vendu par un vendeur vérifié TechLium</Tr>
                  </>
                ) : (
                  <>
                    <Store className="h-5 w-5 shrink-0 text-gold" aria-hidden /> <Tr>Vendu et expédié par TechLium</Tr>
=======
                    <BadgeCheck className="h-5 w-5 shrink-0 text-gold" aria-hidden /> <Tr>Vendu par un vendeur vérifié TechniLium</Tr>
                  </>
                ) : (
                  <>
                    <Store className="h-5 w-5 shrink-0 text-gold" aria-hidden /> <Tr>Vendu et expédié par TechniLium</Tr>
>>>>>>> dde13f7e9ef378354971238907150faefa52b6bb
                  </>
                )}
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      {hasDetails ? (
        <section className="flex flex-col gap-4 rounded-sm bg-surface p-4 shadow-card border-b-4 border-b-gold md:p-6">
          <h2 className="font-display text-lg font-semibold text-ink"><Tr>Détails du produit</Tr></h2>

          {product.description ? (
            <p className="max-w-prose text-sm leading-relaxed text-ink-soft">{product.description}</p>
          ) : null}

          {specs.length > 0 || variantAttributes.length > 0 ? (
            <dl className="flex flex-col divide-y divide-line border-y border-line text-sm md:max-w-xl">
              {[...specs, ...variantAttributes].map(([key, value]) => (
                <div key={key} className="flex justify-between py-2">
                  <dt className="text-ink-soft"><Tr>{ATTRIBUTE_LABEL[key] ?? key}</Tr></dt>
                  <dd className="text-ink">{String(value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>
      ) : null}

      <div className="rounded-sm bg-surface p-4 shadow-card border-b-4 border-b-gold md:p-6">
        <ProductReviews productId={product.id} />
      </div>
    </main>
  );
}
