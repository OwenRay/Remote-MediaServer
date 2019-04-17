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
  cache = caches.open(CACHE);
  evt.waitUntil(cache);
  cache.then((res) => {
    cache = res;
    cache.addAll([
      '/',
      '/sw.js',
    ]);
  });
});

// On fetch, use cache but update the entry with the latest contents
// from the server.
self.addEventListener('fetch', (evt) => {
  const { url } = evt.request;
  evt.request.originalUrl = url;
  let matchesCache = TO_CACHE.find(c => url.indexOf(c) !== -1);
  if (!matchesCache && !url.match(/^.*?:\/\/.+?\/(api|img|ply|static|socket|sockjs|(.+\.))/)) {
    console.log("rewriting", evt.request.url, ' to ./ ');
    evt.request.url = './';
    matchesCache = true;
  }
  console.log(url, matchesCache);
  if (!matchesCache) return false;


  const hasCache = cache.match(evt.request);
  if (hasCache){
    evt.respondWith(hasCache);
    update(evt.request).catch(e=>console.log('failed to update'));
    return;
  }

  evt.waitUntil(update(evt.request));
});


// Update consists in opening the cache, performing a network request and
// storing the new response data.
function update(request) {
  return fetch(request)
    .then(response => cache.put(request, response.clone())
      .then(() => response));
}
