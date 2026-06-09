/* Service worker minimo: shell offline (cache-first) y datos frescos (network-first). */
const C = "polla-v8";
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
  const url = new URL(e.request.url);
  if (url.pathname.endsWith("/data/polla.json")) {
    // datos: red primero, cae a cache si no hay conexion
    e.respondWith(
      fetch(e.request).then((r) => {
        const cp = r.clone(); caches.open(C).then((c) => c.put(e.request, cp)); return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // shell: cache primero
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
