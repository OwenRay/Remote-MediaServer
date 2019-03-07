const RequestHandler = require('../RequestHandler');
const httpServer = require('..');
const fs = require('fs');

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
    return Object.keys(routes).map((priority) => {
      const [method, url] = name.split('@');
      const r = routes[priority];
      return {
        method,
        url,
        priority,
        classname: r.name,
        description: DocumentationRequestHandler.parseDescription(r.getDescription(method, url)),
      };
    });
  }

  static parseDescription(description) {
    if (description.substr(-3) !== '.md') return description || 'No description available';
    return `${fs.readFileSync(description)}`;
  }
}

httpServer.registerRoute('get', '/api/documentation', DocumentationRequestHandler);

module.exports = DocumentationRequestHandler;
