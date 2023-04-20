/**
 * Created by Owen on 14-4-2016.
 */

const pluralize = require('pluralize');
const Database = require('../../database/Database');
const RequestHandler = require('../RequestHandler');
const httpServer = require('..');
const DatabaseSearch = require('../../database/DatabaseSearch');

class DatabaseApiHandler extends RequestHandler {
  handleRequest() {
    const urlParts = this.path.split('/');
    const type = urlParts[2];
    const singularType = pluralize.singular(type);

    switch (this.request.method) {
      case 'PATCH':
      case 'POST':
      case 'PUT':
        this.handlePost(singularType);
        break;
      default:
        this.handleGet(this.context.query, singularType, this.context.params.id);
        break;
    }
    return true;
  }

  handlePost(singularType) {
    const i = this.context.request.body.data;
    const item = Database.getById(singularType, i.id);

    if (item) {
      item.attributes = Object.assign(item.attributes, i.attributes);
      item.relationships = i.relationships;
      this.respond(Database.update(singularType, item));
      return;
    }

    this.respond(Database.setObject(singularType, i.attributes));
  }

  handleGet(query, singularType, itemId) {
    this.response.header['Content-Type'] = 'text/json';
    const { sort, distinct, join } = query;
    let offset;
    let limit;
    let filterValues;
    const relationConditions = [];

    // parse all the query items
    if (query['page[limit]']) {
      limit = parseInt(query['page[limit]'], 10);
      delete query['page[limit]'];
    }
    if (query['page[offset]']) {
      offset = parseInt(query['page[offset]'], 10);
      delete query['page[offset]'];
    }
    delete query.sort;
    delete query.distinct;
    delete query.join;

    // all the query items left become "where conditions"
    Object.keys(query)
      .forEach((key) => {
        const item = query[key];
        if (key.indexOf('.') !== -1) {
          const s = key.split('.');
          if (!relationConditions[s[0]]) {
            relationConditions[s[0]] = {};
          }
          relationConditions[s[0]][s[1]] = query[key];
          delete query[key];
        }
        if (!item) {
          delete query[key];
        }
      });

    if (query.filterValues) {
      filterValues = query.filterValues.split(',');
      delete query.filterValues;
    }

    let data;
    let included = [];
    if (itemId) {
      data = Database.getById(singularType, itemId);
    } else {
      ({ data, included } = DatabaseSearch.query(singularType, {
        where: query,
        sort,
        distinct,
        join,
        relationConditions,
      }));
    }

    // build the possible filter values.
    if (filterValues) {
      const values = {};
      filterValues.forEach((a) => {
        const items = {};
        data.forEach((i) => {
          i = i.attributes[a];
          if (Array.isArray(i)) {
            i.forEach((entry) => { items[entry] = true; });
            return;
          }
          items[i] = true;
        });
        values[a] = Object.keys(items).sort();
      });
      filterValues = values;
    }

    let metadata = {};
    if (offset || limit) {
      metadata.totalPages = Math.ceil(data.length / limit);
      metadata.totalItems = data.length;
      data = data.splice(offset, limit);
    }

    // build return data
    metadata = { filterValues, ...metadata };

    this.respond(data, metadata, included);
    return true;
  }

  respond(data, metadata, included) {
    const obj = {};
    obj.data = data;
    obj.meta = metadata;
    obj.included = included;
    this.context.body = obj;
    if (this.resolve) {
      this.resolve();
    }
  }
}

httpServer.registerRoute('all', '/api/media-items', DatabaseApiHandler);
httpServer.registerRoute('all', '/api/media-items/:id', DatabaseApiHandler);
httpServer.registerRoute('all', '/api/media-item/:id', DatabaseApiHandler);
httpServer.registerRoute('all', '/api/play-positions', DatabaseApiHandler);
httpServer.registerRoute('all', '/api/play-positions/:id', DatabaseApiHandler);

module.exports = DatabaseApiHandler;
