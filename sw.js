/* Service worker: network-first para TODO (siempre trae lo último online; cae a caché solo
   sin conexión). Evita el problema de "no veo mis cambios" del cache-first. */
const C = "polla-v11";
const SHELL = ["./", "index.html", "styles.css", "app.js", "manifest.webmanifest", "icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(C).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== C).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // network-first: trae fresco y actualiza caché; si no hay red, sirve la última copia
  e.respondWith(
    fetch(e.request).then((r) => {
      const cp = r.clone();
      caches.open(C).then((c) => c.put(e.request, cp));
      return r;
    }).catch(() => caches.match(e.request))
  );
});
