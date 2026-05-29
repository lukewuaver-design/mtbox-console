const CACHE_NAME = 'mtbox-console-v1';
const FILES_TO_CACHE = [
  './index.html',
  './manifest.json'
];

// 安裝：快取核心檔案
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 啟動：清除舊版快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList =>
      Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

// 攔截請求：App Shell 使用快取，API 請求直接走網路
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 攝影機 API 請求（http://IP/...）直接走網路，不快取
  if (url.protocol === 'http:') {
    event.respondWith(fetch(event.request));
    return;
  }

  // CDN 外部資源（Tailwind、Google Fonts）直接走網路
  if (url.hostname !== self.location.hostname) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  // App 本身的檔案：優先用快取，失敗才走網路
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
