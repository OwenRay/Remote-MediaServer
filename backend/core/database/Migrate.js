const fs = require('fs');
const Database = require('./Database');
const Log = require('../Log');
const core = require('../');

class Migrate {
  static run() {
    while (this[`version${Database.version}`]) {
      Log.info('running migration', Database.version);
      this[`version${Database.version}`]();
      Database.version += 1;
      Database.doSave('version');
    }
  }

  static version0() {
    const items = Database.getAll('media-item', true);
    items.forEach((item) => {
      const p = item.relationships && item.relationships['play-position'];
      if (p) {
        const i = Database.getById('play-position', p.data.id);
        i.attributes.watched = i.attributes.position > item.attributes.fileduration * 0.97;
      }
    });
  }

  /**
   * Migrates the database to multiple files, saves a lot of disk writes
   */
  static version1() {
    const items = JSON.parse(fs.readFileSync('db', 'utf8'));
    Object.keys(items).forEach((key) => { Database[key] = items[key]; });
    Database.writeTimeout = {};
    Object.keys(items.tables).forEach((item) => {
      Database.doSave(item);
    });
    Database.doSave('ids');
  }
}

core.addBeforeStartListener(Migrate.run);

module.exports = Migrate;
