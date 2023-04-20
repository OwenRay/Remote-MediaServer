/**
 * Created by owenray on 7/9/16.
 */
const http = require('http');
const IImageHandler = require('../../core/http/IImageHandler');
const httpServer = require('../../core/http');
const ImageCacheHandler = require('../../core/http/coreHandlers/ImageCacheHandler');

class TmdbImageHandler extends IImageHandler {
  handleRequest() {
    if (!this.item) {
      return null;
    }
    let w = 'w300';
    if (this.type === IImageHandler.TYPE_BACKDROP) {
      w = 'w1280';
    } else if (this.type === IImageHandler.TYPE_POSTER_LARGE) {
      w = 'w1280';
      this.type = 'poster';
    } else if (this.type === IImageHandler.TYPE_POSTER_SMALL) {
      w = 'w154';
      this.type = 'poster';
    }

    if (!this.item.attributes[`${this.type}-path`]) {
      return false;
    }

    const img = `http://image.tmdb.org/t/p/${w}/${this.item.attributes[`${this.type}-path`]}`;
    const p = new Promise((resolve) => {
      http.get(img, (response) => {
        const bytes = [];
        response.on('data', (data) => {
          bytes.push(data);
        });
        response.on('end', () => {
          const b = Buffer.concat(bytes);
          new ImageCacheHandler(this.context).put(b);
          this.context.body = b;
          resolve();
        });
      });
    });
    return p;
  }

  static getDescription() {
    return `will get an image from TheMovieDB  \n${IImageHandler.getDescription()}`;
  }
}

httpServer.registerRoute('get', '/img/:image.jpg', TmdbImageHandler, 0, 2);

module.exports = TmdbImageHandler;
