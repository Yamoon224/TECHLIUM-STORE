import { CircleHelp, ShieldCheck, User, type LucideIcon } from "lucide-react";
import { Tr } from "@/components/Tr";
import Link from "next/link";

const COLUMNS: { title: string; Icon: LucideIcon; links: { label: string; href: string }[] }[] = [
  {
    title: "Besoin d'aide ?",
    Icon: CircleHelp,
    links: [
      { label: "Centre d'aide", href: "/aide" },
      { label: "Suivre ma commande", href: "/suivi" },
      { label: "Retours et remboursements", href: "/aide#retours" },
      { label: "Contacter le support", href: "/support" },
    ],
  },
  {
    title: "Mon compte",
    Icon: User,
    links: [
      { label: "Connexion", href: "/connexion" },
      { label: "Mes commandes et factures", href: "/compte" },
      { label: "Mon panier", href: "/panier" },
    ],
  },
  {
    title: "Pourquoi TechniLium",
    Icon: ShieldCheck,
    links: [
      { label: "Produits vérifiés avant expédition", href: "/" },
      { label: "Garantie sur chaque appareil", href: "/" },
      { label: "Paiement à la livraison", href: "/" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-12 bg-chrome text-white">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
        {COLUMNS.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-gold">
              <column.Icon className="h-4 w-4" aria-hidden />
              <Tr>{column.title}</Tr>
            </h2>
            <ul className="flex flex-col gap-2 text-sm text-white/80">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="underline-offset-4 hover:text-white hover:underline">
                    <Tr>{link.label}</Tr>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/60">
        <Tr>© TechniLium - Produits tech authentiques, livrés chez vous.</Tr>
      </p>
    </footer>
  );
}
