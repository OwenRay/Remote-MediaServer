const CACHE = 'cache-update-and-refresh';
const TO_CACHE = [
  '/static/',
  '/api/settings',
  'min.js',
  '.woff2',
  '/assets/',
  '.ico',
  '.json',
  '/api/watchNext',
  '.jpg',
  '/api/media-items',
  '/api/tmdb',
];

// On install, cache some resource.
self.addEventListener('install', (evt) => {
  // Open a cache and use `addAll()` with an array of assets to add all of them
  // to the cache. Ask the service worker to keep installing until the
  // returning promise resolves.
  evt.waitUntil(caches.open(CACHE).then((cache) => {
    cache.addAll([
      '/',
      '/api/watchNext',
    ]);
  }));
});

// On fetch, use cache but update the entry with the latest contents
// from the server.
self.addEventListener('fetch', (evt) => {
  const { url } = evt.request;
  if (url.match('(socket|hot.update)')) return;

  evt.request.originalUrl = url;
  let matchesCache = TO_CACHE.find(c => url.indexOf(c) !== -1);
  let cacheKey = evt.request;
  if (evt.request.method !== 'GET') return;
  if (!matchesCache && !url.match(/^.*?:\/\/.+?\/(api|img|ply|static|socket|sockjs|(.+\.))/)) {
    cacheKey = '/';
    matchesCache = true;
  }
  if (!matchesCache) return false;
  evt.respondWith(cacheOrFetch(evt.request, cacheKey));
});

function cacheOrFetch(request, cacheKey) {
  return caches.open(CACHE)
    .then(cache => cache.match(cacheKey))
    .then((r) => {
      if (r) {
        update(request, cacheKey)
          .catch(e => console.log('failed to fetch', e));
        return r;
      }
      return update(request, cacheKey);
    });
}


// Update consists in opening the cache, performing a network request and
// storing the new response data.
function update(request, cacheKey) {
  return caches
    .open(CACHE)
    .then(cache => fetch(request)
      .then(response => cache.put(cacheKey, response.clone())
        .then(() => response)));
}
