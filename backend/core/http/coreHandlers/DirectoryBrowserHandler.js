/**
 * Created by owenray on 18-4-2016.
 */

const fs = require('fs');
const RequestHandler = require('../RequestHandler');
const httpServer = require('..');

class DirectoryBrowserHandler extends RequestHandler {
  handleRequest() {
    const { query } = this.context;
    if (!query.directory) {
      query.directory = '/';
    }
    if (query.directory[query.directory.length - 1] !== '/') {
      query.directory += '/';
    }
    this.dir = query.directory;

    fs.readdir(
      query.directory,
      this.onDirectoryList.bind(this),
    );
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  onDirectoryList(err, result) {
    if (err) {
      this.context.body = { error: err };
      return this.resolve();
    }

    this.pos = 0;
    this.result = result;
    this.stat();
    return null;
  }

  /**
     * function to loop over files to see if they are directories
     * @param err
     * @param res
     */
  stat(err, res) {
    if (res || err) {
      if (res && res.isDirectory()) { // is the file a directory? move along
        this.pos += 1;
      } else { // file is not a directory remove from the results
        this.result.splice(this.pos, 1);
      }

      if (this.pos === this.result.length) { // all files processed, return result
        this.context.body = { result: this.result };
        this.resolve();
        return;
      }
    }
    fs.stat(this.dir + this.result[this.pos], this.stat.bind(this));
  }
}

httpServer.registerRoute('get', '/api/browse', DirectoryBrowserHandler);

module.exports = DirectoryBrowserHandler;
