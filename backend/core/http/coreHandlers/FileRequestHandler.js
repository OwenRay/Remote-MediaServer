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
    return this.serveFile(dir + url, false);
  }

  serveFile(filename, andDelete) {
    this.response.header['Content-Type'] = mime.lookup(filename);
    return readFile(filename)
      .then((data) => {
        this.context.body = data;
        if (andDelete) unlink(filename);
        return data;
      });
  }
}

module.exports = FileRequestHandler;
