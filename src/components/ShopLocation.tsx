import { MapPin, Navigation } from "lucide-react";
import { Tr } from "@/components/Tr";
import { MAP_DIRECTIONS_URL, MAP_EMBED_URL, MAP_OPEN_URL, SHOP_LOCATION } from "@/lib/location";

/** The shop on a map, with links to open it or get directions. */
export function ShopLocation({ headingLevel = 2 }: { headingLevel?: 1 | 2 }) {
  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <section aria-labelledby="shop-location-title" className="flex flex-col gap-4 rounded-sm bg-surface p-4 shadow-card border-b-4 border-b-gold md:p-6">
      <div className="flex flex-col gap-1">
        <Heading id="shop-location-title" className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
          <MapPin className="h-5 w-5 text-gold" aria-hidden /> <Tr>Notre boutique</Tr>
        </Heading>
        <p className="text-sm text-ink-soft">
          <Tr>Venez voir et essayer les produits sur place.</Tr> <span className="whitespace-nowrap">{SHOP_LOCATION.dms}</span>
        </p>
      </div>

      <iframe
        title="Carte : emplacement de la boutique TechLium"
        src={MAP_EMBED_URL}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className="h-72 w-full rounded-sm border border-line md:h-96"
      />

      <div className="flex flex-wrap gap-3">
        <a
          href={MAP_DIRECTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-sm bg-gold px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gold-bright"
        >
          <Navigation className="h-4 w-4" aria-hidden /> <Tr>Itinéraire</Tr>
        </a>
        <a
          href={MAP_OPEN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-sm border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-gold"
        >
          <Tr>Ouvrir dans Google Maps</Tr>
        </a>
      </div>
    </section>
  );
}
