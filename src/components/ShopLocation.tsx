"use client";

import { MapPin, Navigation } from "lucide-react";
import { Tr } from "@/components/Tr";
import { useShop } from "@/components/ShopInfoProvider";
import { mapDirectionsUrl, mapEmbedUrl, mapOpenUrl } from "@/lib/location";

/**
 * The shop on a map, with links to open it or get directions. The point, the
 * address and the opening hours come from the backoffice; without a point
 * there is nothing to show, so the section stays out of the page (the
 * dedicated page, `standalone`, says so instead).
 */
export function ShopLocation({ standalone = false }: { standalone?: boolean }) {
  const shop = useShop();
  const Heading = standalone ? "h1" : "h2";

  if (shop === undefined) return null;

  if (!shop?.location) {
    return standalone ? (
      <section className="rounded-sm bg-surface p-6 shadow-card border-b-4 border-b-gold">
        <Heading className="font-display text-xl font-semibold text-ink"><Tr>Notre boutique</Tr></Heading>
        <p className="mt-2 text-sm text-ink-soft"><Tr>L&apos;emplacement de la boutique n&apos;est pas encore renseigné.</Tr></p>
      </section>
    ) : null;
  }

  const point = shop.location;
  const hours = shop.contact.hours;

  return (
    <section aria-labelledby="shop-location-title" className="flex flex-col gap-4 rounded-sm bg-surface p-4 shadow-card border-b-4 border-b-gold md:p-6">
      <div className="flex flex-col gap-1">
        <Heading id="shop-location-title" className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
          <MapPin className="h-5 w-5 text-gold" aria-hidden /> <Tr>Notre boutique</Tr>
        </Heading>
        {shop.address ? <p className="text-sm font-medium text-ink">{shop.address}</p> : null}
        {hours ? <p className="text-sm text-ink-soft">{hours}</p> : null}
        <p className="text-sm text-ink-soft">
          <Tr>Venez voir et essayer les produits sur place.</Tr>
        </p>
      </div>

      <iframe
        title="Carte : emplacement de la boutique TechLium"
        src={mapEmbedUrl(point)}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className="h-72 w-full rounded-sm border border-line md:h-96"
      />

      <div className="flex flex-wrap gap-3">
        <a
          href={mapDirectionsUrl(point)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-sm bg-gold px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gold-bright"
        >
          <Navigation className="h-4 w-4" aria-hidden /> <Tr>Itinéraire</Tr>
        </a>
        <a
          href={mapOpenUrl(point)}
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
