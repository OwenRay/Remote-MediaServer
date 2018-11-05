const RequestHandler = require('../RequestHandler');
const httpServer = require('../../HttpServer');
const Database = require('../../Database');
const MovieScanner = require('../../scanner/MovieScanner');
const ExtendedInfoQueue = require('../../scanner/ExtendedInfoQueue');

class TMDBApiHandler extends RequestHandler {
  async handleRequest() {
    MovieScanner.scan();
    const items = Database.getAll('media-item', true);
    if (this.context.query.ffprobe) {
      items.forEach((item) => { item.gotfileinfo = false; });
    }
    if (this.context.query.tmdb) {
      items.forEach((item) => {
        item.gotExtendedInfo = 0;
        item.gotSeriesAndSeasonInfo = 0;
      });
    }
    ExtendedInfoQueue.getInstance().concat(items);
    this.context.body = { status: 'ok' };
  }
}

httpServer.registerRoute('get', '/api/rescan', TMDBApiHandler);

module.exports = TMDBApiHandler;
