"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tr } from "@/components/Tr";

/** Pages that already are, or carry their own link back to, the marketplace. */
const HIDDEN_ON = ["/", "/connexion"];

/** A link back to the marketplace (the home page), shown under the header on every other public page. */
export function BackToMarketplace() {
  const pathname = usePathname();
  if (HIDDEN_ON.includes(pathname)) return null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-3">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-gold-bright underline-offset-4 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> <Tr>Retour à la marketplace</Tr>
      </Link>
    </div>
  );
}
