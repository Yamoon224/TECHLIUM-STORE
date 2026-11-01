/**
 * Helpers of the installable app (PWA): when to offer the installation again, and whether the
 * shop runs as an installed app already. Pure, so they are tested without a browser.
 */

export const INSTALL_DISMISSED_KEY = "TechniLium_install_dismissed_at";

/** A visitor who closed the invitation is not asked again for two weeks. */
export const INSTALL_REASK_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

export function shouldOfferInstall(dismissedAt: number | null, now: number): boolean {
  if (dismissedAt === null || !Number.isFinite(dismissedAt)) return true;

  return now - dismissedAt >= INSTALL_REASK_AFTER_MS;
}

export function readDismissedAt(storage: Pick<Storage, "getItem"> | null): number | null {
  try {
    const raw = storage?.getItem(INSTALL_DISMISSED_KEY);
    const value = raw ? Number(raw) : NaN;

    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

/** The service worker is only registered where it is served over HTTPS (or on localhost). */
export function canRegisterServiceWorker(env: { hasServiceWorker: boolean; isSecure: boolean; production: boolean }): boolean {
  return env.hasServiceWorker && env.isSecure && env.production;
}

/** The browser event that offers the installation, kept loosely typed: it is not in the DOM lib. */
export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
