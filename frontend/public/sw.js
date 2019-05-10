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
  '/api/play-positions',
  '/api/tmdb',
];
let cache;


// On install, cache some resource.
self.addEventListener('install', (evt) => {
  console.log('The service worker is being installed.');
  // Open a cache and use `addAll()` with an array of assets to add all of them
  // to the cache. Ask the service worker to keep installing until the
  // returning promise resolves.
  evt.waitUntil(caches.open(CACHE).then((cache) => {
    cache.addAll([
      '/',
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
  if (!matchesCache && !url.match(/^.*?:\/\/.+?\/(api|img|ply|static|socket|sockjs|(.+\.))/)) {
    console.log('rewriting', evt.request.url, ' to ./ ');
    cacheKey = '/';
    matchesCache = true;
  }
  console.log(url, matchesCache);
  if (!matchesCache) return false;
  evt.respondWith(cacheOrFetch(evt.request, cacheKey));
});

function cacheOrFetch(request, cacheKey) {
  return caches.open(CACHE)
    .then(cache => cache.match(cacheKey))
    .then((r) => {
      if (r) {
        update(request)
          .catch(e => console.log('failed to fetch', e));
        return r;
      }
      console.log('not in cache', request.originalUrl);
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
