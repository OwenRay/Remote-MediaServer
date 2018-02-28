/**
 * Created by Owen on 14-4-2016.
 */


const Database = require('../../Database');
const pluralize = require('pluralize');
const RequestHandler = require('../RequestHandler');
const httpServer = require('../../HttpServer');

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
        return new Promise((resolve) => {
          this.resolve = resolve;
        });
      default:
        this.handleGet(this.context.query, singularType, this.context.params.id);
        break;
    }
    return null;
  }

  handlePost(singularType) {
    let body = [];

    this.context.req.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = JSON.parse(`${body}`);
      const i = body.data;
      const item = Database.getById(singularType, i.id);

      if (item) {
        item.attributes = Object.assign(item.attributes, i.attributes);
        item.relationships = i.relationships;
        this.respond(Database.update(singularType, item));
        return;
      }

      this.respond(Database.setObject(singularType, i.attributes));
    });
  }

  handleGet(query, singularType, itemId) {
    this.response.header['Content-Type'] = 'text/json';

    let data;
    let offset = 0;
    let limit = 0;
    let filterValues = null;
    const relationConditions = {};
    const { sort, distinct, join } = query;

    delete query.sort;
    delete query.distinct;
    delete query.join;
    // parse all the query items
    if (query['page[limit]']) {
      limit = parseInt(query['page[limit]'], 10);
      delete query['page[limit]'];
    }
    if (query['page[offset]']) {
      offset = parseInt(query['page[offset]'], 10);
      delete query['page[offset]'];
    }

    if (query.filterValues) {
      filterValues = query.filterValues.split(',');
      delete query.filterValues;
    }

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


    if (parseInt(itemId, 10)) {
      // find single item
      data = Database.getById(singularType, itemId);
    } else if (Object.keys(query).length > 0) {
      // find items with given filters
      data = Database.findByMatchFilters(singularType, query);
    } else {
      // get all items
      data = Database.getAll(singularType);
    }

    // parse sort params, example params: key:ASC,key2:DESC
    let sortArray = [];
    if (sort) {
      sortArray = sort.split(',').map(i => i.split(':'));
    }
    const sortFunction = (a, b) => {
      // eslint-disable-next-line guard-for-in,no-restricted-syntax
      for (const key in sortArray) {
        const sortItem = sortArray[key][0];
        let direction = sortItem.length > 1 ? sortItem[1] : 'ASC';
        direction = direction === 'ASC' ? 1 : -1;
        if (a.attributes[sortItem] === undefined || a.attributes[sortItem] === null) {
          return 1;
        }
        if (b.attributes[sortItem] === undefined || b.attributes[sortItem] === null) {
          return -1;
        }
        if (a.attributes[sortItem].localeCompare) {
          if (a.attributes[sortItem].localeCompare(b.attributes[sortItem]) !== 0) {
            return a.attributes[sortItem].localeCompare(b.attributes[sortItem]) * direction;
          }
        }
        if (a.attributes[sortItem] - b.attributes[sortItem] !== 0) {
          return (a.attributes[sortItem] - b.attributes[sortItem] > 0 ? 1 : -1) * direction;
        }
      }
      return 0;
    };


    // add relationships
    let included = [];
    if (join) {
      for (let key = 0; key < data.length; key += 1) {
        let meetsConditions = true;
        let relObject;
        const rel = data[key].relationships ? data[key].relationships[join] : null;
        if (rel) {
          relObject = Database.getById(join, rel.data.id);
        }

        if (relationConditions[join] !== undefined) {
          meetsConditions = relationConditions[join].every((what, conditionKey) => {
            if (!relObject) {
              if (what === 'true') {
                return false;
              }
            }
            return `${relObject.attributes[conditionKey]}` === what;
          });
        }

        if (!meetsConditions) {
          data.splice(key, 1);
          key -= 1;
        }
      }
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

    if (sort) {
      data = data.sort(sortFunction);
    }

    // make sure all the items have a unique "distinct" value
    const got = [];
    if (distinct) {
      data = data.filter((item) => {
        const distinctVal = item.attributes[distinct];
        if (got[distinctVal]) {
          return false;
        }
        got[distinctVal] = true;
        return true;
      });
    }


    // build return data
    const metadata = { filterValues };
    if (offset || limit) {
      metadata.totalPages = Math.ceil(data.length / limit);
      metadata.totalItems = data.length;
      data = data.splice(offset, limit);
    }

    // get relationships
    const rels = {};
    if (join) {
      for (let c = 0; c < data.length; c += 1) {
        const relation = data[c].relationships ? data[c].relationships[join] : null;
        if (relation) {
          if (!rels[relation.data.id]) {
            rels[relation.data.id] = Database.getById(join, relation.data.id);
          }
        }
      }
    }
    included = Object.values(rels);

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
