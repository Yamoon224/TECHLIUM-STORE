import { CircleHelp } from "lucide-react";
import { Tr } from "@/components/Tr";
import Link from "next/link";
import { Suspense } from "react";
import { AccountIndicator } from "./AccountIndicator";
import { CartIndicator } from "./CartIndicator";
import { LogoMark } from "./LogoMark";
import { PreferencesMenu } from "./PreferencesMenu";
import { SearchBox } from "./SearchBox";
import { TopBar } from "./TopBar";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 bg-surface shadow-card border-b-4 border-b-gold">
      <TopBar />

      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" aria-labelledby="home-link-title" className="shrink-0">
          <span id="home-link-title" className="sr-only">
            TechLium, <Tr>accueil</Tr>
          </span>
          <LogoMark hideNameOnMobile />
        </Link>

        <div className="order-3 flex w-full sm:order-none sm:w-auto sm:flex-1">
          <Suspense fallback={<div className="h-10 w-full rounded-sm border border-line" />}>
            <SearchBox />
          </Suspense>
        </div>

        <nav className="ml-auto flex items-center gap-1" aria-labelledby="account-nav-title">
          <h2 id="account-nav-title" className="sr-only">
            <Tr>Compte et panier</Tr>
          </h2>
          <AccountIndicator />
          <Link
            href="/aide"
            className="hidden items-center gap-1.5 rounded-sm px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-bg md:flex"
          >
            <CircleHelp className="h-5 w-5" aria-hidden />
            <Tr>Aide</Tr>
          </Link>
          <PreferencesMenu />
          <CartIndicator />
        </nav>
      </div>
    </header>
  );
}
