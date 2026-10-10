'use strict';
/* =====================================================================
   SERVICE WORKER — installable app + offline play (GitHub Pages / any http server;
   never registered from file:// or dist/).
   · game code (HTML, CSS, JS): network first, so an update shows on the next load;
     offline the cached copy is used
   · assets (sprites, fonts, icons): served from the cache and refreshed in the background
   · music: passed through (browsers stream it with range requests, which can't be cached)
   ===================================================================== */
const CACHE = 'vh-v1';

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // the file list comes from index.html itself, so new scripts are picked up automatically
    const html = await (await fetch('index.html', { cache: 'no-cache' })).text();
    const files = new Set(['./', 'index.html', 'manifest.json']);
    for (const m of html.matchAll(/(?:src|href)="((?:js|css|assets)\/[^"]+)"/g)) files.add(m[1]);
    const fonts = await (await fetch('css/fonts.css', { cache: 'no-cache' })).text();
    for (const m of fonts.matchAll(/url\(\.\.\/(assets\/fonts\/[^)]+)\)/g)) files.add(m[1]);
    await c.addAll([...files]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function networkFirst(req) {
  const c = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) c.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await c.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await c.match('index.html') : null);
    if (hit) return hit;
    throw err;
  }
}
async function cacheFirst(req, ev) {
  const c = await caches.open(CACHE), hit = await c.match(req);
  const fresh = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; });
  if (hit) { ev.waitUntil(fresh.catch(() => {})); return hit; }
  return fresh;
}

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.includes('/assets/music/')) return;
  if (url.pathname.includes('/assets/')) e.respondWith(cacheFirst(req, e));
  else e.respondWith(networkFirst(req));
});
