// Change this version whenever a shell asset changes. Updates wait for all
// existing windows to close so a battle never mixes old and new game files.
// Each installed edition owns its own cache and cleanup boundary.
const CACHE_PREFIX = 'utah-command-shell-' + new URL(self.registration.scope).pathname + ':';
const CACHE = CACHE_PREFIX + 'v0.24.0';
const ASSETS = ['index.html', 'style.css', 'engine.js', 'terrain.js', 'app.js', 'frontage.js', 'builder.js', 'logistics-ui.js', 'command-services.js', 'command-desk.js', 'pwa.js',
  'normandy-map-v2.jpg', 'manifest.webmanifest', 'icon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'quickstart.html', 'field-manual.html', 'support.html', 'privacy.html', 'distribution.js'];
const assetURLs = ASSETS.map(path => new URL(path, self.registration.scope).href);
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const url of assetURLs) {
      // Sites redirects /index.html to /. Download the canonical home URL
      // directly while keeping the index.html key for offline navigation.
      const requestURL = url === assetURLs[0] ? self.registration.scope : url;
      const response = await fetch(new Request(requestURL, {cache: 'reload'}));
      if (!response.ok || response.redirected || response.type === 'opaque') {
        throw new Error('Offline shell asset unavailable');
      }
      // Never store a sign-in HTML page in place of a game asset.
      const type = response.headers.get('content-type') || '';
      if (url.endsWith('.js') && !/javascript/.test(type)) throw new Error('Invalid script response');
      if (url.endsWith('index.html') && !(await response.clone().text()).includes('id="map"')) throw new Error('Invalid game page');
      await cache.put(url, response);
    }
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith(CACHE_PREFIX) && name !== CACHE) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data !== 'CHECK_OFFLINE') return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const complete = (await Promise.all(assetURLs.map(url => cache.match(url)))).every(Boolean);
    event.ports[0]?.postMessage(complete ? 'OFFLINE_READY' : 'OFFLINE_INCOMPLETE');
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Cache only the known game shell. Never intercept authentication or API calls.
  const navigation = event.request.mode === 'navigate' &&
    (url.pathname === new URL(self.registration.scope).pathname || url.href.split('?')[0] === assetURLs[0]);
  const asset = assetURLs.includes(url.href);
  if (!navigation && !asset) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(navigation ? assetURLs[0] : url.href);
    return cached || fetch(event.request);
  })());
});

