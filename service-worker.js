const CACHE_NAME = "pomodoro-cache-v4";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/stats.html",
  "/login.html",
  "/app.js",
  "/manifest.json",
  "/assets/css/materialize.min.css",
  "/assets/css/app.css",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png",
  "/assets/javascript/materialize.min.js",
  "/assets/javascript/ui.js",
  "/assets/javascript/dark-mode.js",
  "/assets/javascript/timer.js",
  "/assets/javascript/db-implementation.js",
  "/assets/javascript/firebaseDB.js",
  "/assets/javascript/auth-ui.js",
  "/assets/javascript/login.js"
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
