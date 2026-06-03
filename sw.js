// Service Worker — 飲食日記 PWA
const CACHE = 'diet-diary-v13';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 安裝：用 reload 強制抓最新檔案進快取
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })));
    self.skipWaiting();
  })());
});

// 啟用：清掉舊版本快取
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // 動態資料（雲端 / API）一律走網路、不快取
  if (req.url.includes('supabase') || req.url.includes('api.anthropic.com')) return;

  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    // 網路優先：有網路就拿最新頁面，離線才用快取
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const c = await caches.open(CACHE);
        c.put('./index.html', fresh.clone());
        return fresh;
      } catch (err) {
        return (await caches.match('./index.html')) || (await caches.match(req));
      }
    })());
    return;
  }
  // 其他靜態資源：快取優先
  e.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
});
