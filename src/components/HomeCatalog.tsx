import { BadgeCheck, ShieldCheck, Wallet, Zap, type LucideIcon } from "lucide-react";
import { Tr } from "@/components/Tr";
import { BannerCarousel } from "@/components/BannerCarousel";
import { getBanners, type BannerSlide } from "@/lib/banners";
import Link from "next/link";
import { CategoryRail } from "@/components/CategoryRail";
import { ProductCard } from "@/components/ProductCard";
import { ShelfControls } from "@/components/ShelfControls";
import { cookies } from "next/headers";
import { getCategories, getProducts, getProductsPage, type Category, type Product } from "@/lib/catalog";
import { Pagination } from "@/components/Pagination";
import { parsePage, PRODUCTS_PER_PAGE } from "@/lib/pagination";
import { LANGUAGE_COOKIE, parseLanguage } from "@/lib/language";
import { categoryRows, flashDeals } from "@/lib/home";
import { getHelpInfo } from "@/lib/help";
import { BrandMarquee } from "@/components/BrandMarquee";
import { catalogueBrands } from "@/lib/brands";
import { ShopLocation } from "@/components/ShopLocation";
import { ExploreSection } from "@/components/ExploreSection";
import { ProductComparator } from "@/components/ProductComparator";
import { ProductFinder } from "@/components/ProductFinder";

/**
 * Reads `searchParams` and the catalog inside the page's Suspense boundary:
 * doing it at the top of the page would block the static shell (Cache Components).
 */
export async function HomeCatalog({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const params = await searchParams;
  const language = parseLanguage((await cookies()).get(LANGUAGE_COOKIE)?.value);
  const category = typeof params.category === "string" ? params.category : undefined;
  const search = typeof params.search === "string" ? params.search : undefined;

  let categories: Category[] = [];
  let products: Product[] = [];
  let catalogUnavailable = false;
  let pageInfo = { page: 1, lastPage: 1 };
  const wantedPage = parsePage(params.page);
  const heroSlides = category || search ? [] : await getBanners("hero");
  const whatsapp = category || search ? null : ((await getHelpInfo())?.contact.whatsapp ?? null);

  try {
    if (category || search) {
      // A category or a search is paginated, PRODUCTS_PER_PAGE at a time.
      const filters = { category, search, language };
      let result;
      [categories, result] = await Promise.all([getCategories(language), getProductsPage(filters, wantedPage, PRODUCTS_PER_PAGE)]);
      // A page number past the end shows the last page rather than nothing.
      if (result.products.length === 0 && wantedPage > result.lastPage) {
        result = await getProductsPage(filters, result.lastPage, PRODUCTS_PER_PAGE);
      }
      products = result.products;
      pageInfo = { page: result.page, lastPage: result.lastPage };
    } else {
      [categories, products] = await Promise.all([getCategories(language), getProducts({ language, perPage: 100 })]);
    }
  } catch {
    catalogUnavailable = true;
  }

  const activeCategoryName = categories.find((c) => c.slug === category)?.name;
  const filtered = Boolean(category || search);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-4">
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <CategoryRail categories={categories} activeSlug={category} />

        <div className="flex min-w-0 flex-col gap-6">
          {!filtered ? <Hero slides={heroSlides} /> : null}

          {catalogUnavailable ? (
            <p className="py-12 text-ink-soft">
              <Tr>Le catalogue est momentanément indisponible. Réessayez dans un instant.</Tr>
            </p>
          ) : products.length === 0 ? (
            <EmptyState search={search} categoryName={activeCategoryName} />
          ) : filtered ? (
            <>
              <Shelf
                title={search ? "Résultats pour" : (activeCategoryName ?? "Produits")}
                suffix={search ? ` « ${search} »` : undefined}
                products={products}
                grid
              />
              <Pagination page={pageInfo.page} lastPage={pageInfo.lastPage} params={{ category, search }} />
            </>
          ) : (
            <>
              <BrandMarquee brands={catalogueBrands(products)} />
              <ExploreSection products={products} />
              <ProductFinder products={products} whatsapp={whatsapp} />
              <ProductComparator products={products} />
              <Shelves products={products} />
              <ShopLocation />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

const PROMISES: { title: string; text: string; Icon: LucideIcon }[] = [
  { title: "Paiement à la livraison", text: "Payez quand vous recevez", Icon: Wallet },
  { title: "Garantie incluse", text: "Sur chaque appareil", Icon: ShieldCheck },
  { title: "Vendeurs vérifiés", text: "Des offres contrôlées", Icon: BadgeCheck },
];

function Hero({ slides }: { slides: BannerSlide[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-[1fr_220px]" aria-labelledby="hero-title">
      {slides.length > 0 ? (
        <BannerCarousel slides={slides} label="TechLium" />
      ) : (
      <div className="flex min-h-48 flex-col justify-center gap-3 rounded-sm bg-gold p-6 text-white sm:p-8">
        <p className="text-sm font-medium uppercase tracking-wide opacity-90"><Tr>TechLium</Tr></p>
        <h1 id="hero-title" className="font-display text-2xl font-bold leading-tight sm:text-4xl">
          <Tr>Le marché tech où chaque produit est authentique et garanti</Tr>
        </h1>
        <p className="max-w-md text-sm opacity-95">
          <Tr>Smartphones, ordinateurs et accessoires vérifiés avant expédition, livrés chez vous.</Tr>
        </p>
      </div>
      )}

      <ul className="grid grid-cols-3 gap-2 md:grid-cols-1">
        {PROMISES.map(({ title, text, Icon }) => (
          <li key={title} className="flex items-center gap-3 rounded-sm bg-surface p-3 shadow-card border-b-4 border-b-gold">
            <Icon className="hidden h-6 w-6 shrink-0 text-gold sm:block" aria-hidden />
            <span className="flex flex-col">
              <span className="text-sm font-semibold text-ink"><Tr>{title}</Tr></span>
              <span className="text-xs text-ink-soft"><Tr>{text}</Tr></span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Shelves({ products }: { products: Product[] }) {
  const deals = flashDeals(products, 12);
  const rows = categoryRows(products);

  return (
    <>
      {deals.length > 0 ? <Shelf title="Ventes Flash" products={deals} accent Icon={Zap} /> : null}
      {rows.map((row) => (
        <Shelf key={row.slug} title={row.name} products={row.products} href={`/?category=${row.slug}`} />
      ))}
      {deals.length === 0 && rows.length === 0 ? <Shelf title="Tous les produits" products={products} grid /> : null}
    </>
  );
}

function Shelf({
  title,
  products,
  href,
  accent = false,
  grid = false,
  Icon,
  suffix,
}: {
  title: string;
  products: Product[];
  href?: string;
  accent?: boolean;
  grid?: boolean;
  Icon?: LucideIcon;
  /** Text shown after the translated title (e.g. the search term). */
  suffix?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-sm bg-surface shadow-card border-b-4 ${accent ? "border-b-[#e11d48]" : "border-b-gold"}`}>
      {/* The flash sale keeps its own hot colours, whatever accent colour the visitor picked. */}
      <div
        className={`flex items-center justify-between gap-3 px-4 py-2.5 ${accent ? "text-white" : "border-b border-line text-ink"}`}
        style={accent ? { backgroundImage: "linear-gradient(100deg, #e11d48 0%, #be123c 45%, #7e22ce 100%)" } : undefined}
      >
        <h2 className="flex items-center gap-2 font-display text-base font-semibold">
          {Icon ? (
            <Icon className={`h-5 w-5 ${accent ? "fill-yellow-300 text-yellow-300 motion-safe:animate-pulse" : ""}`} aria-hidden />
          ) : null}
          <Tr>{title}</Tr>
          {suffix}
        </h2>
        {accent ? <ShelfControls target="flash-deals-row" /> : null}
        {href ? (
          <Link href={href} className={`text-sm font-medium underline-offset-4 hover:underline ${accent ? "" : "text-gold-bright"}`}>
            <Tr>Voir plus</Tr>
          </Link>
        ) : null}
      </div>

      {accent ? (
        // The flash sale is one scrolling row, moved one product at a time by the header buttons.
        <div id="flash-deals-row" className="flex gap-2 overflow-x-auto scroll-smooth bg-bg p-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {products.map((product) => (
            <div key={product.id} className="w-[calc((100%-0.5rem)/2)] flex-none snap-start sm:w-[calc((100%-1rem)/3)] lg:w-[calc((100%-2.5rem)/6)] [&>*]:h-full">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        <div
          className={
            grid
              ? "grid grid-cols-2 gap-2 bg-bg p-2 sm:grid-cols-3 lg:grid-cols-4"
              : "grid grid-cols-2 gap-2 bg-bg p-2 sm:grid-cols-3 lg:grid-cols-6"
          }
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyState({ search, categoryName }: { search?: string; categoryName?: string }) {
  const message = search ? (
    <>
      <Tr>Aucun produit ne correspond à</Tr> « {search} ».
    </>
  ) : categoryName ? (
    <>
      <Tr>Aucun produit disponible dans</Tr> {categoryName} <Tr>pour le moment.</Tr>
    </>
  ) : (
    <Tr>Le catalogue est vide pour le moment.</Tr>
  );

  return (
    <div className="flex flex-col items-start gap-2 rounded-sm bg-surface p-6 shadow-card border-b-4 border-b-gold">
      <p className="text-ink-soft">{message}</p>
      {search || categoryName ? (
        <Link href="/" className="text-sm text-gold-bright underline-offset-4 hover:underline">
          <Tr>Voir tous les produits</Tr>
        </Link>
      ) : null}
    </div>
  );
}
