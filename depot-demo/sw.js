/* Depot Management service worker — works offline; updates when you replace files on the server */
const VERSION = '717902ab4d';
const SCOPE = new URL(self.registration.scope).pathname;
const PREFIX = 'depotmgmt-' + SCOPE + '@';   /* each app (hero, depot, demos) keeps its own offline copy */
const CACHE = PREFIX + VERSION;
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
/* updates are mandatory: a new version installs fresh files (never the browser's HTTP cache) and takes over at once */
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && (k.startsWith(PREFIX) || /^herobill-(?!fonts$)[^/]+$/.test(k))).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    const scopePath = new URL(self.registration.scope).pathname;
    if (req.mode === 'navigate' && (url.pathname === scopePath || url.pathname === scopePath + 'index.html')) {   // app page: cached copy instantly, works offline
      e.respondWith(caches.match('./index.html').then(r => r || fetch(req)));
      return;
    }
    if (req.mode === 'navigate' || !url.pathname.startsWith(scopePath) || url.pathname.slice(scopePath.length).includes('/')) return;   // other apps under this site (e.g. /depot/) handle themselves
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c)); return res; })));
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {   // fonts: keep a copy for offline use
    e.respondWith(caches.open('depotmgmt-fonts').then(c => c.match(req).then(r => r || fetch(req).then(res => { c.put(req, res.clone()); return res; }))));
  }
});
