/* jshint loopfunc: true */

const fs = require('fs');
const uuid = require('node-uuid');
const Log = require('./helpers/Log.js');

class Database {
  constructor() {
    this.ids = {};
    this.tables = {};
    this.version = 0;
    this.writeTimeout = null;
  }

  checkTable(type) {
    if (!this.tables[type]) {
      this.tables[type] = {};
    }
  }

  setObject(type, obj) {
    this.checkTable(type);
    if (!this.ids[type]) {
      this.ids[type] = 1;
    }

    const o = { id: obj.id };
    if (!o.id) {
      o.id = this.ids[type];
      this.ids[type] += 1;
    }
    if (!obj.uuid) {
      obj.uuid = uuid.v4();
    }
    o.type = type;
    o.attributes = obj;
    this.tables[type][o.id] = o;
    this.save();
    return o;
  }

  deleteObject(type, id) {
    this.checkTable();
    if (this.tables[type][id]) {
      delete this.tables[type][id];
    }
    this.save();
  }

  update(type, obj) {
    this.checkTable(type);

    this.tables[type][obj.id] = obj;
    this.save();
    return obj;
  }

  fileExists(type, id) {
    return !!this.tables[type] && !!this.tables[type][id];
  }

  findBy(type, key, value) {
    const table = this.tables[type];
    if (!table) {
      return [];
    }
    return Object.keys(table)
      .filter(k => table[k] && table[k].attributes[key] === value)
      .map(k => table[k]);
  }

  findByMatchFilters(tableType, filters) {
    const items = this.tables[tableType];
    if (!items) {
      return [];
    }

    // loop over the filters and apply search arguments
    // %test%       match test somwhere in the string
    // test%        starts with test
    // %test        ends with test
    // >1           greater then 1
    // <1           less then 1
    // 2><6         value between 2 and 6
    filters = Object.keys(filters)
      .map((key) => {
        const f = filters[key];
        let type = 'normal';
        let value;
        const a = f[0] === '%';
        const b = f[f.length - 1] === '%';
        if (a && b) {
          type = 'search';
          value = f.substring(1, f.length - 1).toLocaleLowerCase();
        } else if (a) {
          type = 'endsWith';
          value = f.substring(1);
        } else if (b) {
          type = 'startsWith';
          value = f.substring(0, f.length - 1);
        } else if (f[0] === '<') {
          type = 'lt';
          value = f.substring(1);
        } else if (f[0] === '>') {
          type = 'gt';
          value = parseFloat(f.substring(1));
        } else if (f.match(/^[0-9.]+><?[0-9.]+$/)) {
          type = 'ltgt';
          value = f.split('><').map(flt => parseFloat(flt));
        } else {
          value = (`${f}`).toLocaleLowerCase();
        }
        return { type, key, value };
      });

    return Object.keys(items)
      .filter((itemKey) => {
        const item = items[itemKey];
        if (!item.id) {
          return false;
        }
        return filters.every(({ type, key, value }) => {
          // when we're looking for (for example) extra=false,
          // we also want items that don't have the extra attribute, thats why:
          if (item.attributes[key] === undefined) {
            item.attributes[key] = false;
          }

          return Database.matches(
            item.attributes[key],
            value,
            type,
          );
        });
      })
      .map(key => items[key]);
  }

  static matches(value, filter, filterProp) {
    if (['lt', 'gt', 'ltgt'].includes(filterProp)) {
      if (!value) {
        value = 0;
      }
      value = parseFloat(value);
    } else if (!Array.isArray(value)) {
      value = (`${value}`).toLowerCase();
    } else {
      value = value.map(v => (`${v}`).toLocaleLowerCase());
    }

    switch (filterProp) {
      case 'endsWith':
        return value.indexOf(filter) + filter.length === value.length;
      case 'startsWith':
        return value.indexOf(filter) === 0;
      case 'search':
        return value.indexOf(filter) >= 0;
      case 'lt':
        return value < filter;
      case 'gt':
        return value > filter;
      case 'ltgt':
        return value > filter[0] && value < filter[1];
      default:
        if (Array.isArray(value)) {
          return value.includes(filter) ||
                           value.includes(parseInt(filter, 10));
        }
        return value === filter;
    }
  }

  getById(type, id) {
    if (!this.tables[type]) {
      return null;
    }
    return this.tables[type][id];
  }

  getAll(type) {
    Log.debug('getall');
    this.checkTable(type);
    return Object.values(this.tables[type]);
  }

  load() {
    try {
      if (fs.existsSync('db')) {
        const items = JSON.parse(fs.readFileSync('db', 'utf8'));
        Object.keys(items).forEach((key) => { this[key] = items[key]; });
      }
    } catch (e) {
      Log.exception(e);
    }
  }

  save() {
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
    }
    this.writeTimeout = setTimeout(this.doSave.bind(this), 3000);
  }

  doSave(callback) {
    Log.debug('Did write db');
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
    }
    this.writeTimeout = null;
    if (!callback) {
      callback = () => {};
    }
    fs.writeFile('db', JSON.stringify(this), callback);
  }
}


const db = new Database();
db.load();

module.exports = db;
