

/**
 * Created by owenray on 7/9/16.
 */
const IImageHandler = require('../IImageHandler');
const fs = require('fs');
const httpServer = require('..');

class ImageCacheHandler extends IImageHandler {
  handleRequest() {
    if (!this.item) {
      return null;
    }
    const id = this.item.attributes['external-id'] ?
      `tmdb_${this.item.attributes['external-id']}` :
      this.item.id;
    const filename = `cache/thumb_${id}_${this.type}`;
    try {
      fs.statSync(filename);
    } catch (e) {
      return null;
    }

    return new Promise((resolve) => {
      fs.readFile(filename, (err, data) => {
        this.context.body = data;
        resolve(data);
      });
    });
  }

  put(data) {
    const id = this.item.attributes['external-id'] ?
      `tmdb_${this.item.attributes['external-id']}` :
      this.item.id;
    const filename = `cache/thumb_${id}_${this.type}`;
    fs.writeFile(filename, data, () => {});
  }

  static getDescription() {
    return `Will automatically cache any lower priority request  \n${IImageHandler.getDescription()}`;
  }
}

httpServer.registerRoute('get', '/img/:image.jpg', ImageCacheHandler, 0, 10);

module.exports = ImageCacheHandler;
