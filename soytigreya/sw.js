// Service worker de SoyTigreYa: permite instalar la app en el celu y abrirla aunque no haya señal.
// Siempre pide lo último a la web; si no hay conexión, usa la última copia guardada.
const CACHE = "soytigreya-v16";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) =>
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
);
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Guardamos la app y sus librerías (CDN), no las teselas del mapa.
  if (url.origin !== location.origin && url.hostname !== "cdnjs.cloudflare.com" && url.hostname !== "unpkg.com" && url.hostname !== "fonts.googleapis.com" && url.hostname !== "fonts.gstatic.com") return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copia = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copia));
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("./")))
  );
});
