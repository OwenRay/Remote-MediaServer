/**
 * Created by owenray on 08-04-16.
 */

const fs = require('fs');
const mime = require('mime');

const RequestHandler = require('../RequestHandler');

class FileRequestHandler extends RequestHandler {
  handleRequest() {
    const { url } = this.context;
    const dir = `${__dirname}/../../../frontend/dist/`;
    const promise = new Promise((resolve) => {
      this.resolve = resolve;
    });
    this.serveFile(dir + url, false, this.resolve);
    return promise;
  }

  serveFile(filename, andDelete, callback) {
    this.response.header['Content-Type'] = mime.lookup(filename);
    this.andDelete = andDelete;
    this.file = filename;
    this.resolve = callback;
    fs.readFile(filename, this.fileRead.bind(this));
  }

  fileRead(err, data) {
    if (err) {
      this.resolve();
      return;
    }

    this.context.body = data;
    if (this.resolve) {
      this.resolve();
    }

    if (this.andDelete) {
      fs.unlink(this.file, () => { });
    }
  }
}

// export RequestHandler;
module.exports = FileRequestHandler;
