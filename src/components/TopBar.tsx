"use client";

import Link from "next/link";
import { CircleHelp, MapPin, MessageCircle, ShieldCheck, Truck, type LucideIcon } from "lucide-react";
import { Tr } from "@/components/Tr";
import { useShop } from "@/components/ShopInfoProvider";
import { whatsappHref } from "@/lib/help";

interface Info {
  key: string;
  Icon: LucideIcon;
  text: string;
  /** Written by the shop in the visitor's language: shown as is, not translated. */
  own?: boolean;
  href?: string;
  external?: boolean;
  strong?: boolean;
}

/** What the storefront says by itself when the shop has written no message of its own. */
const DEFAULT_MESSAGES: Info[] = [
  { key: "cod", Icon: Truck, text: "Paiement à la livraison" },
  { key: "verified", Icon: ShieldCheck, text: "Produits vérifiés avant expédition" },
  { key: "warranty", Icon: ShieldCheck, text: "Garantie sur chaque appareil" },
];

/**
 * What the shop wants every visitor to see, scrolling above the header: the
 * messages written in the backoffice (or the defaults), then the links to the
 * shop's location, WhatsApp and the help centre when they exist.
 */
export function TopBar() {
  const shop = useShop();
  const whatsapp = shop?.contact.whatsapp;
  const written = shop?.topbar_messages ?? [];

  const infos: Info[] = [
    ...(written.length > 0 ? written.map((text, index): Info => ({ key: `msg-${index}`, Icon: ShieldCheck, text, own: true })) : DEFAULT_MESSAGES),
    ...(shop?.location ? [{ key: "shop", Icon: MapPin, text: "Notre boutique : voir l'emplacement", href: "/boutique" }] : []),
    ...(whatsapp ? [{ key: "whatsapp", Icon: MessageCircle, text: `WhatsApp ${whatsapp}`, own: true, href: whatsappHref(whatsapp), external: true, strong: true }] : []),
    { key: "help", Icon: CircleHelp, text: "Besoin d'aide ?", href: "/aide" },
  ];

  // One half is repeated to be wider than any screen; two halves make the loop seamless.
  const half = Array.from({ length: 3 }, () => infos).flat();

  return (
    <div className="brand-marquee overflow-hidden bg-chrome py-1.5 text-xs text-white">
      <div className="brand-marquee-track flex w-max" style={{ animationDuration: `${half.length * 5}s` }}>
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1 ? true : undefined}>
            {half.map((info, index) => {
              const content = (
                <>
                  <info.Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {info.own ? info.text : <Tr>{info.text}</Tr>}
                </>
              );
              const classes = `flex items-center gap-1.5 whitespace-nowrap ${info.strong ? "font-semibold" : "text-white/85"}`;

              return (
                <li key={`${info.key}-${index}`} className="px-6">
                  {info.href ? (
                    <Link
                      href={info.href}
                      tabIndex={copy === 1 ? -1 : undefined}
                      {...(info.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className={`${classes} underline-offset-4 hover:underline`}
                    >
                      {content}
                    </Link>
                  ) : (
                    <span className={classes}>{content}</span>
                  )}
                </li>
              );
            })}
          </ul>
        ))}
      </div>
    </div>
  );
}
