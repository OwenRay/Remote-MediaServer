const server = require('../http');
const http = require('http');
const fs = require('fs');
const util = require('util');

const mkdir = util.promisify(fs.mkdir);

module.exports = {
  async setUp(callback) {
    await mkdir('cache');
    server.preflight();
    await server.start();
    setTimeout(callback, 1000);
  },

  testConnection(test) {
    test.expect(1);
    http.get('http://localhost:8234/index.html', (res) => {
      test.strictEqual(res.statusCode, 200);
      test.done();
    });
  },

  tearDown(callback) {
    fs.unlinkSync('cache/httpCache');
    fs.rmdirSync('cache');
    server.stop();
    callback();
  },
};
