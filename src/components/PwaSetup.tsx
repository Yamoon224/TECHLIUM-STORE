"use client";

import { Download, RefreshCw, WifiOff, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  canRegisterServiceWorker,
  INSTALL_DISMISSED_KEY,
  readDismissedAt,
  shouldOfferInstall,
  type InstallPromptEvent,
} from "@/lib/pwa";
import { useAppearance } from "./AppearanceProvider";

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Makes the shop an installable app: registers the service worker, offers "add to home screen"
 * once in a while, proposes the update when a new version is waiting, and says so when the
 * connection drops. Draws nothing when there is nothing to say.
 */
export function PwaSetup() {
  const { tr } = useAppearance();
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const syncOnline = () => setOffline(!navigator.onLine);
    syncOnline();
    window.addEventListener("online", syncOnline);
    window.addEventListener("offline", syncOnline);

    const onInstallable = (event: Event) => {
      event.preventDefault();
      if (shouldOfferInstall(readDismissedAt(safeStorage()), Date.now())) setInstallEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => setInstallEvent(null);
    window.addEventListener("beforeinstallprompt", onInstallable);
    window.addEventListener("appinstalled", onInstalled);

    if (canRegisterServiceWorker({ hasServiceWorker: "serviceWorker" in navigator, isSecure: window.isSecureContext, production: process.env.NODE_ENV === "production" })) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((registration) => {
          if (registration.waiting && navigator.serviceWorker.controller) setWaiting(registration.waiting);

          registration.addEventListener("updatefound", () => {
            const worker = registration.installing;
            worker?.addEventListener("statechange", () => {
              if (worker.state === "installed" && navigator.serviceWorker.controller) setWaiting(worker);
            });
          });
        })
        .catch(() => undefined);

      // The new worker took over: load the page it will now serve.
      let reloaded = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloaded) return;
        reloaded = true;
        window.location.reload();
      });
    }

    return () => {
      window.removeEventListener("online", syncOnline);
      window.removeEventListener("offline", syncOnline);
      window.removeEventListener("beforeinstallprompt", onInstallable);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice.catch(() => undefined);
    setInstallEvent(null);
  }

  function dismissInstall() {
    try {
      safeStorage()?.setItem(INSTALL_DISMISSED_KEY, String(Date.now()));
    } catch {
      // the invitation simply comes back next time
    }
    setInstallEvent(null);
  }

  return (
    <>
      {offline ? (
        <div role="status" className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-ink px-4 py-2 text-sm text-bg">
          <WifiOff className="h-4 w-4" aria-hidden /> {tr("Vous êtes hors connexion : certaines pages ne s'afficheront pas.")}
        </div>
      ) : null}

      {waiting ? (
        <div role="status" className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-sm border border-line bg-surface p-3 text-sm text-ink shadow-lg">
          <RefreshCw className="h-5 w-5 shrink-0 text-gold" aria-hidden />
          <span className="flex-1">{tr("Une nouvelle version de TechniLium est disponible.")}</span>
          <button type="button" onClick={() => waiting.postMessage("SKIP_WAITING")} className="rounded-sm bg-gold px-3 py-1.5 text-xs font-medium text-on-primary">
            {tr("Mettre à jour")}
          </button>
        </div>
      ) : installEvent ? (
        <div role="dialog" aria-label={tr("Installer l'application")} className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-sm border border-line bg-surface p-3 text-sm text-ink shadow-lg">
          <Download className="h-5 w-5 shrink-0 text-gold" aria-hidden />
          <span className="flex-1">{tr("Installez TechniLium sur votre téléphone pour y accéder en un geste.")}</span>
          <button type="button" onClick={() => void install()} className="rounded-sm bg-gold px-3 py-1.5 text-xs font-medium text-on-primary">
            {tr("Installer")}
          </button>
          <button type="button" onClick={dismissInstall} aria-label={tr("Plus tard")} className="rounded-sm p-1 text-ink-soft hover:text-ink">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : null}
    </>
  );
}
