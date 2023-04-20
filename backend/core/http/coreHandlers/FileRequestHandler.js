/**
 * Created by owenray on 08-04-16.
 */

const fs = require('fs');
const mime = require('mime');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

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

  serveFile(filename, andDelete) {
    this.response.header['Content-Type'] = mime.lookup(filename);
    return readFile(filename)
      .then((data) => {
        if (andDelete) unlink(filename);
        return data;
      });
  }
}

module.exports = FileRequestHandler;
