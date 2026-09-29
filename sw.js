/* Menuse — service worker: la app y la lista funcionan sin conexión.
   Cada vez que cambies este archivo, sube el número de CACHE (v2, v3…). */
const CACHE = "menuse-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
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

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function tellEveryone() {
  pendingUpdate = true;
  return self.clients.matchAll({ type: "window" })
    .then(cs => cs.forEach(c => c.postMessage({ type: "update" })));
}

/* La app pregunta al arrancar: «¿hay algo nuevo?» */
self.addEventListener("message", e => {
  if (e.data && e.data.type === "hello" && pendingUpdate && e.source) {
    e.source.postMessage({ type: "update" });
  }
});

/* Firma de una respuesta: sirve para saber si la página ha cambiado */
function stamp(res) {
  return res.headers.get("etag") || res.headers.get("last-modified") || "";
}

/* Sirve lo guardado al instante y refresca por detrás.
   Si la página que llega de internet es distinta de la guardada, avisa a la app. */
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const isPage = req.mode === "navigate" || /\/(index\.html)?$/.test(new URL(req.url).pathname);
  const hitP = caches.match(req);
  const netP = hitP.then(hit => fetch(req).then(res => ({ hit, res, copy: res.clone() })));
  /* trabajo de fondo: guardar lo nuevo y, si la página cambió, avisar */
  e.waitUntil(
    netP.then(({ hit, res, copy }) => {
      if (!(res && res.status === 200 && (res.type === "basic" || res.type === "cors"))) return;
      const changed = isPage && hit && stamp(hit) && stamp(res) && stamp(hit) !== stamp(res);
      return caches.open(CACHE)
        .then(c => c.put(req, copy))
        .then(() => changed ? new Promise(r => setTimeout(r, 1500)).then(tellEveryone) : null);
    }).catch(() => {})
  );
  e.respondWith(
    hitP.then(hit => hit || netP.then(x => x.res).catch(() => hit))
  );
});
