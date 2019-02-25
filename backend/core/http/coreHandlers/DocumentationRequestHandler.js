const RequestHandler = require('../RequestHandler');
const httpServer = require('..');

class DocumentationRequestHandler extends RequestHandler {
  async handleRequest() {
    const routes = httpServer.getRoutes();
    this.context.body = {
      apiDoc: Object.keys(routes)
        .reduce(
          (acc, route) => acc.concat(DocumentationRequestHandler.parseRoutes(route, routes[route])),
          [],
        ),
    };
  }

  static parseRoutes(name, routes) {
    return Object.values(routes).map((val) => {
      const [method, url] = name.split('@');
      return { method, url, description: val.getDescription(method, url) };
    });
  }
}

httpServer.registerRoute('get', '/api/documentation', DocumentationRequestHandler);

module.exports = DocumentationRequestHandler;
