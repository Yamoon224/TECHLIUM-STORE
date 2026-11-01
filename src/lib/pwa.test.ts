import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { canRegisterServiceWorker, INSTALL_DISMISSED_KEY, INSTALL_REASK_AFTER_MS, readDismissedAt, shouldOfferInstall } from "./pwa";

// The worker is a plain script in /public: run it here the way a browser would, without a worker scope.
const exported: { strategyFor: (request: { method: string; url: string; mode?: string }, origin: string) => string; OFFLINE_URL: string } = { strategyFor: () => "", OFFLINE_URL: "" };
new Function("module", readFileSync(join(process.cwd(), "public", "sw.js"), "utf8"))({
  set exports(value: typeof exported) {
    Object.assign(exported, value);
  },
});
const { strategyFor, OFFLINE_URL } = exported;

describe("shouldOfferInstall", () => {
  it("offers the installation to a visitor who never closed it", () => {
    expect(shouldOfferInstall(null, 1_000)).toBe(true);
  });

  it("waits two weeks after the invitation was closed", () => {
    expect(shouldOfferInstall(1_000, 1_000 + INSTALL_REASK_AFTER_MS - 1)).toBe(false);
    expect(shouldOfferInstall(1_000, 1_000 + INSTALL_REASK_AFTER_MS)).toBe(true);
  });
});

describe("readDismissedAt", () => {
  it("reads the stored moment, and shrugs off garbage or a blocked storage", () => {
    expect(readDismissedAt({ getItem: (key) => (key === INSTALL_DISMISSED_KEY ? "1234" : null) })).toBe(1234);
    expect(readDismissedAt({ getItem: () => "abc" })).toBeNull();
    expect(readDismissedAt({ getItem: () => null })).toBeNull();
    expect(readDismissedAt({ getItem: () => { throw new Error("blocked"); } })).toBeNull();
    expect(readDismissedAt(null)).toBeNull();
  });
});

describe("canRegisterServiceWorker", () => {
  it("needs support, a secure origin and a production build", () => {
    expect(canRegisterServiceWorker({ hasServiceWorker: true, isSecure: true, production: true })).toBe(true);
    expect(canRegisterServiceWorker({ hasServiceWorker: false, isSecure: true, production: true })).toBe(false);
    expect(canRegisterServiceWorker({ hasServiceWorker: true, isSecure: false, production: true })).toBe(false);
    expect(canRegisterServiceWorker({ hasServiceWorker: true, isSecure: true, production: false })).toBe(false);
  });
});

describe("service worker strategy", () => {
  const origin = "https://TechniLium.example";
  const get = (path: string, mode = "cors") => ({ method: "GET", url: `${origin}${path}`, mode });

  it("never keeps a page: navigations go to the network, with the offline page as fallback", () => {
    expect(strategyFor(get("/compte", "navigate"), origin)).toBe("navigate");
    expect(OFFLINE_URL).toBe("/offline.html");
  });

  it("serves the build files and icons from the cache", () => {
    expect(strategyFor(get("/_next/static/chunks/app.js"), origin)).toBe("static");
    expect(strategyFor(get("/icon-192.png"), origin)).toBe("static");
    expect(strategyFor(get("/icon-maskable-512.png"), origin)).toBe("static");
  });

  it("leaves everything else to the network: data, other origins, writes", () => {
    expect(strategyFor(get("/produits/12"), origin)).toBe("network");
    expect(strategyFor({ method: "GET", url: "https://api.TechniLium.example/api/v1/orders/mine", mode: "cors" }, origin)).toBe("network");
    expect(strategyFor({ method: "POST", url: `${origin}/_next/static/x.js`, mode: "cors" }, origin)).toBe("network");
    expect(strategyFor({ method: "POST", url: `${origin}/compte`, mode: "navigate" }, origin)).toBe("network");
  });
});
