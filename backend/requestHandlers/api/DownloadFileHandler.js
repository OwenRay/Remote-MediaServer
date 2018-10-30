const RequestHandler = require('../RequestHandler');
const httpServer = require('../../HttpServer');
const Database = require('../../Database');
const fs = require('fs');
const mime = require('mime');
const MediaFetcher = require('../../sharing/MediaFetcher');
const MediaItemHelper = require('../../helpers/MediaItemHelper');

class DownloadFileHandler extends RequestHandler {
  async handleRequest() {
    const item = Database.getById('media-item', this.context.params.id);

    const range = this.context.get('Range');
    let offset = 0;
    if (range) {
      offset = parseInt(range.split('=')[1].split('-')[0], 10);
    }
    this.context.set('Accept-Ranges', 'none');

    this.context.type = 'video/webm';
    const lib = MediaItemHelper.getLibrary(item);
    if (lib.type === 'shared') {
      this.context.body = new MediaFetcher(item).startStream();
      return;
    }
    this.context.set('Accept-Ranges', 'bytes');
    this.context.set('Content-Length', item.attributes.filesize - offset);

    const { filepath } = item.attributes;
    this.context.type = mime.lookup(filepath);
    this.context.body = fs.createReadStream(filepath, { offset });
  }
}

httpServer.registerRoute('get', '/download/:id', DownloadFileHandler);

module.exports = DownloadFileHandler;
