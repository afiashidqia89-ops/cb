/* Service worker "Pemeriksaan Kondisi Blok" – agar aplikasi bisa dibuka tanpa internet.
   Taruh di folder yang sama dengan index.html. Ganti VERSION setiap kali index.html diperbarui. */
const VERSION = 'cek-blok-v26';
const INDEX = './index.html';
const CORE = ['./', INDEX, './manifest.json', './icon-192.png', './icon-512.png', './menu-hero.png'];
const CDN = ['https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    /* satu per satu & toleran: file yang tidak ada TIDAK menggagalkan instalasi */
    await Promise.allSettled([
      ...CORE.map(u => cache.add(new Request(u, { cache: 'reload' }))),
      ...CDN.map(u => cache.add(u))
    ]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).searchParams.has('cek')) return;   /* pengecekan versi terbaru: selalu langsung ke jaringan */
  if (req.mode === 'navigate') { event.respondWith(handleNavigate(req)); return; }
  event.respondWith(handleAsset(event, req));
});

/* Halaman: coba jaringan (maks 3,5 dtk) agar selalu versi terbaru, jika gagal/lambat/offline pakai cache */
async function handleNavigate(req) {
  const cache = await caches.open(VERSION);
  const cached = (await cache.match(INDEX)) || (await cache.match('./', { ignoreSearch: true }));
  const net = fetch(req).then(r => { if (r && r.ok) cache.put(INDEX, r.clone()); return r; });
  if (!cached) { try { return await net; } catch (e) { return offlinePage(); } }
  const r = await Promise.race([net.catch(() => null), new Promise(res => setTimeout(() => res(null), 3500))]);
  return (r && r.ok) ? r : cached;
}

/* Aset (gambar, ikon, ExcelJS, dll): cache dulu, perbarui di latar belakang */
async function handleAsset(event, req) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req, { ignoreSearch: true });
  const update = fetch(req).then(r => {
    if (r && (r.ok || r.type === 'opaque')) cache.put(req, r.clone());
    return r;
  }).catch(() => null);
  if (hit) { event.waitUntil(update); return hit; }
  const r = await update;
  return r || new Response('', { status: 504, statusText: 'Offline' });
}

function offlinePage() {
  return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><body style="font-family:sans-serif;padding:24px"><h2>Aplikasi belum tersimpan untuk offline</h2><p>Buka aplikasi sekali saat online agar tersimpan, lalu bisa dipakai tanpa internet.</p></body>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
