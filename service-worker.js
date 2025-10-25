const CACHE_NAME = "pomodoro-cache-v3";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/assets/css/materialize.min.css",
  "/assets/javascript/materialize.min.js",
  "/assets/javascript/ui.js",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png",
  "/assets/javascript/dark-mode.js",
  "/assets/css/app.css",
  "/assets/javascript/timer.js",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', event => {
  const keep = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => !keep.includes(k)).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});


self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
