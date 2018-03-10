const RequestHandler = require('../RequestHandler');
const httpServer = require('../../HttpServer');
const Settings = require('../../Settings');
const MovieDB = require('moviedb-api');

const movieDB = new MovieDB({
  consume: true,
  apiKey: Settings.getValue('tmdb_apikey'),
});
let genreCache;

class TMDBApiHandler extends RequestHandler {
  async handleRequest() {
    if (genreCache) {
      this.context.body = genreCache;
      return;
    }

    const res = (await movieDB.genreMovieList()).genres;
    const res2 = (await movieDB.genreTvList()).genres;
    const haveIds = [];
    genreCache = res.map((item) => {
      haveIds[item.id] = true;
      return item;
    });
    genreCache.concat(res2.filter(item => !haveIds[item.id]));
    genreCache.sort((a, b) => a.name.localeCompare(b.name));

    this.context.body = genreCache;
  }
}

httpServer.registerRoute('get', '/api/tmdb/genres', TMDBApiHandler);

module.exports = TMDBApiHandler;
