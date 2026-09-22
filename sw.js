// Smooth Jazz Radio – Service Worker
// アプリ本体（HTML / manifest / アイコン）だけをキャッシュし、オフラインでも画面を開けるようにする。
// ラジオのストリームや曲名 API は絶対にキャッシュしない（別オリジンはそのままネットワークへ流す）。
const CACHE = 'sjr-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/icon-180.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // 同一オリジンの GET だけ扱う。ストリーム・API（別オリジン）はブラウザにそのまま任せる
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // ネットワーク優先、失敗したらキャッシュ（更新をすぐ反映しつつオフラインでも開ける）
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
