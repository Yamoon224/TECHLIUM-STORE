"use client";

import Link from "next/link";
import { CircleHelp, MapPin, MessageCircle, ShieldCheck, Truck, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Tr } from "@/components/Tr";
import { getHelpInfo, whatsappHref } from "@/lib/help";

interface Info {
  key: string;
  Icon: LucideIcon;
  text: string;
  href?: string;
  external?: boolean;
  strong?: boolean;
}

/** What the shop wants every visitor to see, scrolling above the header. */
export function TopBar() {
  const [whatsapp, setWhatsapp] = useState<string | null>(null);

  useEffect(() => {
    getHelpInfo().then((info) => setWhatsapp(info?.contact.whatsapp || null));
  }, []);

  const infos: Info[] = [
    { key: "cod", Icon: Truck, text: "Paiement à la livraison" },
    { key: "verified", Icon: ShieldCheck, text: "Produits vérifiés avant expédition" },
    { key: "warranty", Icon: ShieldCheck, text: "Garantie sur chaque appareil" },
    { key: "shop", Icon: MapPin, text: "Notre boutique : voir l'emplacement", href: "/boutique" },
    ...(whatsapp ? [{ key: "whatsapp", Icon: MessageCircle, text: `WhatsApp ${whatsapp}`, href: whatsappHref(whatsapp), external: true, strong: true }] : []),
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
                  {info.external ? info.text : <Tr>{info.text}</Tr>}
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
