"use client";

import Link from "next/link";
import { MapPin, MessageCircle } from "lucide-react";
import { Tr } from "@/components/Tr";
import { useShop } from "@/components/ShopInfoProvider";
import { whatsappHref } from "@/lib/help";

const PILL =
  "inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/5";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.6 2h-3.2v13.2a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9.1a6.1 6.1 0 1 0 5.2 6V8.7a7.6 7.6 0 0 0 4.4 1.4V6.9a4.4 4.4 0 0 1-4.4-4.4V2z" />
    </svg>
  );
}

/** WhatsApp, TikTok and the shop's location as pills: each only when the shop has filled it in. */
export function FooterSocial() {
  const shop = useShop();
  if (!shop) return null;

  const whatsapp = shop.contact.whatsapp;
  if (!whatsapp && !shop.tiktok_url && !shop.location) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {whatsapp ? (
        <a href={whatsappHref(whatsapp)} target="_blank" rel="noopener noreferrer" className={PILL}>
          <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
        </a>
      ) : null}
      {shop.tiktok_url ? (
        <a href={shop.tiktok_url} target="_blank" rel="noopener noreferrer" className={PILL}>
          <TikTokIcon className="h-4 w-4" /> TikTok
        </a>
      ) : null}
      {shop.location ? (
        <Link href="/boutique" className={PILL}>
          <MapPin className="h-4 w-4" aria-hidden /> <Tr>Lieu</Tr>
        </Link>
      ) : null}
    </div>
  );
}
