/* jshint loopfunc: true */

const fs = require('fs');
const uuid = require('node-uuid');
const Log = require('../Log.js');

const TYPES = ['media-item', 'play-position', 'chunks'];

class Database {
  constructor() {
    this.writeTimeout = {};
    this.ids = {};
    this.tables = {};
    this.dataProviders = [];
    this.updateOverwriters = [];
    this.version = 3;
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
    o.attributes.created = new Date().getTime();
    o.attributes.updated = new Date().getTime();
    this.tables[type][o.id] = o;
    this.save(type);
    this.save('ids');
    return o;
  }

  deleteObject(type, id) {
    this.checkTable();
    if (this.tables[type][id]) {
      delete this.tables[type][id];
    }
    this.save(type);
  }

  update(type, obj) {
    obj.attributes.updated = new Date().getTime();
    if (this.updateOverwriters.reduce((red, f) => f(obj) || red, false)) {
      return obj;
    }
    this.checkTable(type);
    this.tables[type][obj.id] = obj;
    this.save(type);
    return obj;
  }

  findBy(type, key, value) {
    const table = this.getAll(type);
    if (!table) {
      return [];
    }
    return Object.keys(table)
      .filter(k => table[k] && table[k].attributes[key] === value)
      .map(k => table[k]);
  }

  findByMatchFilters(tableType, filters) {
    const items = this.getAll(tableType);
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
        const f = `${filters[key]}`;
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
          return filter.split(',').every(i => value.includes(i) || value.includes(parseInt(filter, 10)));
        }
        return value === filter;
    }
  }

  getById(type, id) {
    if (!this.tables[type]) {
      return null;
    }
    let item = this.tables[type][id];
    if (!item) item = this.getAll(type).find(i => i.id === id);
    if (!item) return null;
    // clone item before returning
    return JSON.parse(JSON.stringify(item));
  }

  getAll(type, skipDataProviders = false) {
    this.checkTable(type);
    let items = Object.values(this.tables[type]);
    if (skipDataProviders) return items;
    this.dataProviders.forEach((func) => {
      items = items.concat(func(type));
    });
    return items;
  }

  load() {
    try {
      TYPES.forEach((type) => {
        try {
          this.tables[type] = JSON.parse(fs.readFileSync(`store/${type}`, 'utf8'));
        } catch (e) {
          Log.debug(`database file ${type} doees not exist`);
        }
      });
      this.ids = JSON.parse(fs.readFileSync('store/ids', 'utf8'));
      this.version = JSON.parse(fs.readFileSync('store/version', 'utf8'));
    } catch (e) {
      Log.debug('some database file does not exist');
      this.save('version');
    }
  }

  save(type) {
    if (this.writeTimeout[type]) {
      clearTimeout(this.writeTimeout[type]);
    }
    this.writeTimeout[type] = setTimeout(() => {
      this.doSave(type);
    }, 3000);
  }

  doSave(type, callback) {
    Log.debug('Did write db');
    if (this.writeTimeout[type]) {
      clearTimeout(this.writeTimeout[type]);
    }
    this.writeTimeout[type] = null;
    if (!callback) {
      callback = () => {};
    }
    fs.writeFile(
      `store/${type}.swap`,
      JSON.stringify(this.tables[type] ? this.tables[type] : this[type]),
      () => {
        fs.rename(`store/${type}.swap`, `store/${type}`, callback);
      },
    );
  }

  addDataProvider(func) {
    this.dataProviders.push(func);
  }

  /**
   *
   * @param func should return true if update has been overwritten by func
   */
  addUpdateOverwriter(func) {
    this.updateOverwriters.push(func);
  }
}


const db = new Database();
db.load();

module.exports = db;
