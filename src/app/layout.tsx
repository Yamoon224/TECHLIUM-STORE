import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import { AppearanceProvider } from "@/components/AppearanceProvider";
import { AccountPreferencesSync } from "@/components/AccountPreferencesSync";
import { AuthProvider } from "@/components/AuthProvider";
import { CartProvider } from "@/components/CartProvider";
import { PwaSetup } from "@/components/PwaSetup";
import { Suspense } from "react";
import { BackToMarketplace } from "@/components/BackToMarketplace";
import { FooterBanner } from "@/components/FooterBanner";
import { SideBanners } from "@/components/SideBanners";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { STORAGE_KEY } from "@/lib/appearance";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "TechLium - Produits tech authentiques, livrés chez vous",
  description:
    "Smartphones, ordinateurs et accessoires vérifiés, avec garantie et paiement à la livraison.",
  applicationName: "TechLium",
  appleWebApp: { capable: true, title: "TechLium", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#f68b1e",
};

/**
 * Runs before the first paint: applies the stored theme (or the system's, in
 * automatic mode) so a dark-mode visitor never sees a white flash. The
 * provider takes over after hydration.
 */
const THEME_SCRIPT = `try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})||"{}");var t=s.theme;if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${spaceGrotesk.variable} ${plexSans.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <AppearanceProvider>
          <AuthProvider>
            <AccountPreferencesSync />
            <PwaSetup />
            <CartProvider>
              <SiteHeader />
              <Suspense fallback={null}>
                <BackToMarketplace />
              </Suspense>
              <div className="flex flex-1 flex-col">{children}</div>
              <Suspense fallback={null}>
                <FooterBanner />
              </Suspense>
              <SiteFooter />
              <Suspense fallback={null}>
                <SideBanners />
              </Suspense>
            </CartProvider>
          </AuthProvider>
        </AppearanceProvider>
      </body>
    </html>
  );
}
