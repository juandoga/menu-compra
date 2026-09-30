/* Menuse — service worker: la app y la lista funcionan sin conexión.
   Cada vez que cambies este archivo, sube el número de CACHE (v2, v3…).
   Si creas un archivo nuevo en js/ o css/, añádelo a la lista ASSETS. */
const CACHE = "menuse-v9";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/app.js",
  "./js/model/calendar.js",
  "./js/model/defaultMenu.js",
  "./js/model/repository.js",
  "./js/model/rules.js",
  "./js/model/sections.js",
  "./js/model/storage.js",
  "./js/model/text.js",
  "./js/view/compraView.js",
  "./js/view/dishBlock.js",
  "./js/view/dom.js",
  "./js/view/hoyView.js",
  "./js/view/install.js",
  "./js/view/semanaView.js",
  "./js/view/sheets/dataSheet.js",
  "./js/view/sheets/dishSheet.js",
  "./js/view/sheets/searchSheet.js",
  "./js/view/sheets/settingsSheet.js",
  "./js/view/sheets/shopSheets.js",
  "./js/view/sheets/weekSheets.js",
  "./js/viewmodel/appViewModel.js",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-192.png",
  "./icon-maskable-512.png",
  "./icon-180.png",
  "./favicon.png"
];

/* Se recuerda si ya se descargó una versión nueva, por si la app pregunta después */
let pendingUpdate = false;

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS.map(a => new Request(a, { cache: "reload" }))))
      .catch(() => null)
      .then(() => self.skipWaiting())
  );
});

/* Al activarse una versión nueva se borra lo guardado de las anteriores
   (la app detecta el cambio y ofrece «Recargar») */
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Guarda una copia de lo que llega de internet */
function keep(req, res) {
  if (res && res.status === 200 && (res.type === "basic" || res.type === "cors")) {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
  }
  return res;
}

/* Espera a internet como mucho unos segundos; si no llega, usa lo guardado */
function withTimeout(p, ms) {
  return new Promise((ok, ko) => {
    const t = setTimeout(() => ko(new Error("lento")), ms);
    p.then(r => { clearTimeout(t); ok(r); }, err => { clearTimeout(t); ko(err); });
  });
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const own = new URL(req.url).origin === self.location.origin;

  if (own) {
    /* Archivos de la app: primero internet (así nunca se mezclan versiones viejas y nuevas);
       sin conexión, o si tarda más de 4 s, lo guardado. «no-cache» pregunta al servidor si
       ha cambiado: si no, la respuesta es mínima. */
    e.respondWith(
      withTimeout(fetch(req, { cache: "no-cache" }), 4000)
        .then(res => keep(req, res))
        .catch(() => caches.match(req, { ignoreSearch: true })
          .then(hit => hit || (req.mode === "navigate" ? caches.match("./index.html") : Response.error())))
    );
    return;
  }

  /* Tipografías de Google: no cambian, lo guardado primero */
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => keep(req, res)))
  );
});
