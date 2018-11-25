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
      items.forEach(({ attributes }) => { attributes.gotfileinfo = false; });
    }
    if (this.context.query.reshare) {
      items.forEach(({ attributes }) => { attributes.shared = false; });
    }
    if (this.context.query.tmdb) {
      items.forEach(({ attributes }) => {
        attributes.gotExtendedInfo = 0;
        attributes.gotSeriesAndSeasonInfo = 0;
      });
    }
    ExtendedInfoQueue.getInstance().concat(items);
    this.context.body = { status: 'ok' };
  }
}

httpServer.registerRoute('get', '/api/rescan', TMDBApiHandler);

module.exports = TMDBApiHandler;
