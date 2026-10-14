/* Menuse — service worker: la app y la lista funcionan sin conexión.
   Cada vez que cambies este archivo, sube el número de CACHE (v2, v3…).
   Si creas un archivo nuevo en js/ o css/, añádelo a la lista ASSETS. */
const CACHE = "menuse-v13";
const PLAN_CACHE = "menuse-avisos";   /* plan de avisos del congelador (lo escribe la app) */
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
  "./js/view/notify.js",
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
      .then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== PLAN_CACHE).map(k => caches.delete(k))))
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

/* ---------- avisos del congelador ---------- */
/* Android despierta la app de vez en cuando (periodic background sync). Si hoy toca sacar algo
   del congelador y aún no se ha avisado, se muestra la notificación. */
function hoyISO() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
async function avisoCongelador() {
  const c = await caches.open(PLAN_CACHE);
  const r = await c.match("./__avisos.json");
  if (!r) return;
  const data = await r.json().catch(() => null);
  if (!data || !data.on) return;
  const today = hoyISO();
  const entry = (data.plan || []).find(p => p.date === today);
  if (!entry) return;
  if (new Date().getHours() < 8) return;              /* de noche no */
  const shown = await c.match("./__avisos-mostrado");
  if (shown && (await shown.text()) === today) return; /* ya avisado hoy */
  await self.registration.showNotification("Saca hoy del congelador", {
    body: entry.text, icon: "icon-192.png", badge: "icon-192.png", tag: "congelador-" + today
  });
  await c.put("./__avisos-mostrado", new Response(today));
}
self.addEventListener("periodicsync", e => {
  if (e.tag === "congelador") e.waitUntil(avisoCongelador());
});
/* Al tocar la notificación, abre la app */
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window" }).then(cs => {
    if (cs.length) return cs[0].focus();
    return self.clients.openWindow("./index.html");
  }));
});
