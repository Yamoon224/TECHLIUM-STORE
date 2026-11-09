import type { MetadataRoute } from "next";

/** The web app manifest: what makes the shop installable on a phone's home screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
<<<<<<< HEAD
    name: "TechLium - Produits tech authentiques",
    short_name: "TechLium",
=======
    name: "TechniLium - Produits tech authentiques",
    short_name: "TechniLium",
>>>>>>> dde13f7e9ef378354971238907150faefa52b6bb
    description: "Smartphones, ordinateurs et accessoires vérifiés, avec garantie et paiement à la livraison.",
    lang: "fr",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#f68b1e",
    categories: ["shopping"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Mon panier", url: "/panier", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Suivre ma commande", url: "/suivi", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Mon compte", url: "/compte", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
