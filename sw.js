const CACHE = "mastermind-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/game.js",
  "/ai.js",
  "/favicon.svg",
  "/icon-512.svg",
  "/manifest.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
