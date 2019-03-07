const RequestHandler = require('../RequestHandler');
const httpServer = require('..');
const Database = require('../../database/Database');
const MovieScanner = require('../../scanner/MovieScanner');
const ExtendedInfoQueue = require('../../scanner/ExtendedInfoQueue');

class ScannerApiHandler extends RequestHandler {
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
    ExtendedInfoQueue.concat(items);
    this.context.body = { status: 'ok' };
  }

  static getDescription() {
    return `${__dirname}/../doc/scanner.md`;
  }
}

httpServer.registerRoute('get', '/api/rescan', ScannerApiHandler);

module.exports = ScannerApiHandler;
