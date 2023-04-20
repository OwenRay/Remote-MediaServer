jest.useFakeTimers()

const http = require('http');
const fs = require('fs');
const util = require('util');
const server = require('../http');

const mkdir = util.promisify(fs.mkdir);

describe('HttpServer', () => {
  afterEach(() => {
    try {
      fs.unlinkSync('cache/httpCache');
    } catch (e) {
      console.log('no cache dir');
    }
    try {
      fs.rmdirSync('cache');
    } catch (e) {
      console.log('no cache dir');
    }
  });

  it('starts and connects', async () => {
    await mkdir('cache');
    server.preflight();
    await server.start();

    let resolve;
    const promise = new Promise((r) => { resolve = r; });
    http.get('http://localhost:8234/index.html', resolve);

    const res = await promise;
    expect(res.statusCode).toEqual(200);
    await new Promise(server.stop);
  });
});
