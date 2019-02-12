const RequestHandler = require('../../core/http/RequestHandler');
const httpServer = require('../../core/http');

const providers = [];

class DebugApiHandler extends RequestHandler {
  handleRequest() {
    const result = {};
    providers.forEach(({ category, target }) => {
      result[category] = Object.assign({}, target(), result[category]);
    });
    this.context.body = result;
  }

  static registerDebugInfoProvider(category, target) {
    providers.push({ category, target });
  }
}

httpServer.registerRoute('get', '/debug', DebugApiHandler);

module.exports = DebugApiHandler;
