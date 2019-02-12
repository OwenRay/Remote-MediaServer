const RequestHandler = require('../../core/http/RequestHandler');
const httpServer = require('../../core/http');
const Database = require('../../core/database/Database');
const fs = require('fs');
const mime = require('mime');
const MediaFetcher = require('./MediaFetcher');
const MediaItemHelper = require('../../core/MediaItemHelper');

class DownloadFileHandler extends RequestHandler {
  async handleRequest() {
    const item = Database.getById('media-item', this.context.params.id);

    const range = this.context.get('Range');
    let offset = 0;
    if (range) {
      offset = parseInt(range.split('=')[1].split('-')[0], 10);
    }
    this.context.set('Accept-Ranges', 'bytes');

    this.context.type = mime.lookup(item.attributes.extension);
    const lib = MediaItemHelper.getLibrary(item);
    if (lib.type === 'shared') {
      const s = new MediaFetcher(item);
      s.setContextHeaders(this.context, offset);
      this.context.body = s.startStream(offset);
      return;
    }
    this.context.set('Content-Length', item.attributes.filesize - offset);

    const { filepath } = item.attributes;
    this.context.type = mime.lookup(filepath);
    this.context.body = fs.createReadStream(filepath, { offset });
  }
}

httpServer.registerRoute('get', '/download/:id', DownloadFileHandler);

module.exports = DownloadFileHandler;
