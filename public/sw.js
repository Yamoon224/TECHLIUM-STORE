/*
 * TechniLium service worker.
 *
 * Deliberately small and safe for a shop with accounts:
 *  - pages are never stored: a visitor on a shared phone must not find another customer's account,
 *    order or cart in a cache. A page is always asked from the network; offline, the visitor gets
 *    /offline.html (stored at install) instead of the browser's dinosaur;
 *  - the immutable build files (/_next/static) and the app icons are served from the cache first;
 *  - API calls, other origins, and anything that is not a GET go straight to the network.
 */

const VERSION = "v1";
const STATIC_CACHE = `TechniLium-static-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icon-192.png", "/icon-512.png"];

/** What to do with a request: "navigate" | "static" | "network". Pure, so it can be tested. */
function strategyFor(request, ownOrigin) {
  if (request.method !== "GET") return "network";

  const url = new URL(request.url);
  if (url.origin !== ownOrigin) return "network";

  if (request.mode === "navigate") return "navigate";

  if (url.pathname.startsWith("/_next/static/") || /^\/icon[-\w]*\.png$/.test(url.pathname) || url.pathname === "/favicon.ico") {
    return "static";
  }

  return "network";
}

if (typeof self !== "undefined" && typeof self.addEventListener === "function") {
  self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)));
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((names) => Promise.all(names.filter((name) => name.startsWith("TechniLium-") && name !== STATIC_CACHE).map((name) => caches.delete(name))))
        .then(() => self.clients.claim()),
    );
  });

  // The page asks for the new version to take over once the visitor agrees.
  self.addEventListener("message", (event) => {
    if (event.data === "SKIP_WAITING") self.skipWaiting();
  });

  self.addEventListener("fetch", (event) => {
    const strategy = strategyFor(event.request, self.location.origin);

    if (strategy === "navigate") {
      event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
    } else if (strategy === "static") {
      event.respondWith(
        caches.match(event.request).then(
          (cached) =>
            cached ||
            fetch(event.request).then((response) => {
              if (response.ok) {
                const copy = response.clone();
                caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, copy));
              }
              return response;
            }),
        ),
      );
    }
  });
}

if (typeof module !== "undefined") module.exports = { strategyFor, OFFLINE_URL, STATIC_CACHE };
