/* Demo removed: this worker deletes its own offline copy and unregisters itself. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  const scope = new URL(self.registration.scope).pathname;
  for (const k of await caches.keys()) if (k.includes(scope)) await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url);
})()));
