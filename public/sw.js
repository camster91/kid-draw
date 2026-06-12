/* Kid Draw service worker — v6
 *
 * Strategy:
 *   - Precache the app shell on install (index, manifest, icons).
 *   - Network-first for navigations (HTML); on success, scrape <script>/<link>
 *     asset URLs from the response and warm the runtime cache so the JS/CSS
 *     bundles survive going offline. On failure, fall back to cached "/".
 *   - Cache-first for static assets (JS/CSS/SVG/icons) with background revalidate.
 *   - Old caches evicted on activate.
 *
 * Bump CACHE_NAME (e.g. kid-draw-v7) when shipping breaking asset changes so
 * old caches are evicted cleanly on activate.
 */

const CACHE_NAME = "kid-draw-v6";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Use { cache: "reload" } so install never serves stale HTTP cache.
      await cache.addAll(
        APP_SHELL.map((url) => new Request(url, { cache: "reload" }))
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

function isAssetRequest(req) {
  const dest = req.destination;
  return (
    dest === "script" ||
    dest === "style" ||
    dest === "image" ||
    dest === "font" ||
    dest === "manifest"
  );
}

async function warmAssetsFromHTMLText(cache, htmlText, baseURL) {
  try {
    const urls = new Set();
    const scriptRe = /<script[^>]+src=["']([^"']+)["']/g;
    const linkRe = /<link[^>]+href=["']([^"']+)["']/g;
    let m;
    while ((m = scriptRe.exec(htmlText))) {
      urls.add(new URL(m[1], baseURL).toString());
    }
    while ((m = linkRe.exec(htmlText))) {
      if (/(rel=["'](?:stylesheet|icon|apple-touch-icon|manifest)["'])/.test(m[0])) {
        urls.add(new URL(m[1], baseURL).toString());
      }
    }
    await Promise.all(
      [...urls].map(async (u) => {
        try {
          const res = await fetch(u, { cache: "reload" });
          if (res && res.ok) await cache.put(u, res.clone());
        } catch (_) {
          // Offline during warm — we'll pick it up on first online fetch
        }
      })
    );
  } catch (_) {
    // Best-effort warmup
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first, scrape assets into cache, fall back to cached "/".
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          // Read body once, then store both the response and use the text for warmup.
          const body = await fresh.clone().text();
          const cachedResponse = new Response(body, {
            status: fresh.status,
            statusText: fresh.statusText,
            headers: fresh.headers,
          });
          // Fire-and-forget: cache index + warm assets
          cache.put(request, cachedResponse.clone()).catch(() => {});
          warmAssetsFromHTMLText(cache, body, url).catch(() => {});
          return cachedResponse;
        } catch (_) {
          const cache = await caches.open(CACHE_NAME);
          const cached =
            (await cache.match(request)) ||
            (await cache.match("/")) ||
            (await cache.match("/index.html"));
          if (cached) return cached;
          return new Response("Offline", { status: 503, statusText: "Offline" });
        }
      })()
    );
    return;
  }

  // Static assets: cache-first, background revalidate.
  if (isAssetRequest(request)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        if (cached) {
          fetch(request)
            .then((res) => {
              if (res && res.ok) cache.put(request, res.clone());
            })
            .catch(() => {});
          return cached;
        }
        try {
          const res = await fetch(request);
          if (res && res.ok) cache.put(request, res.clone());
          return res;
        } catch (_) {
          return new Response("Offline asset", {
            status: 504,
            statusText: "Offline",
          });
        }
      })()
    );
  }
});
