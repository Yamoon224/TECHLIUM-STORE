/**
 * The error pages of the shop: each HTTP code with its title, a sentence a customer understands
 * and the way out. The texts are French (the source language, translated by <Tr>).
 */

export interface ErrorInfo {
  code: number;
  title: string;
  message: string;
  /** Worth trying again: a temporary problem rather than a missing or forbidden page. */
  retryable: boolean;
  /** Offer the sign-in page as the way out. */
  signIn?: boolean;
}

export const ERROR_PAGES: readonly ErrorInfo[] = [
  { code: 400, title: "Requête invalide", message: "Nous n'avons pas compris cette demande. Revenez en arrière et recommencez.", retryable: false },
  { code: 401, title: "Connexion requise", message: "Connectez-vous à votre compte pour accéder à cette page.", retryable: false, signIn: true },
  { code: 403, title: "Accès refusé", message: "Vous n'avez pas le droit d'ouvrir cette page.", retryable: false },
  { code: 404, title: "Page introuvable", message: "Cette page ou ce produit n'existe pas ou n'est plus disponible.", retryable: false },
  { code: 408, title: "Délai dépassé", message: "La connexion a pris trop de temps. Vérifiez votre réseau et réessayez.", retryable: true },
  { code: 429, title: "Trop de demandes", message: "Vous avez fait beaucoup de demandes en peu de temps. Patientez un instant, puis réessayez.", retryable: true },
  { code: 500, title: "Erreur du serveur", message: "Un problème est survenu de notre côté. Réessayez dans un instant.", retryable: true },
  { code: 502, title: "Service momentanément injoignable", message: "Notre serveur ne répond pas correctement. Réessayez dans un instant.", retryable: true },
  { code: 503, title: "Service indisponible", message: "TechniLium est en maintenance ou très sollicité. Réessayez dans quelques minutes.", retryable: true },
  { code: 504, title: "Le serveur met trop de temps à répondre", message: "La réponse tarde trop. Réessayez dans un instant.", retryable: true },
];

/** The page of a code, or null when the shop has none for it. */
export function errorInfo(code: number | string): ErrorInfo | null {
  const wanted = typeof code === "string" ? Number(code) : code;

  return ERROR_PAGES.find((page) => page.code === wanted) ?? null;
}

/** The codes that have a page (for static generation of /erreur/[code]). */
export function errorCodes(): string[] {
  return ERROR_PAGES.map((page) => String(page.code));
}
