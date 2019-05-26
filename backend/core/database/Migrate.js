const fs = require('fs');
const Database = require('./Database');
const Log = require('../Log');
const Settings = require('../Settings');

class Migrate {
  /**
   * Migration is started from the core (../)
   */
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

  /**
   * enable modules that are new since the previous release
   */
  static version2() {
    const modules = Settings.getValue('modules');
    if (modules.indexOf('ssl') === -1) modules.push('ssl');
    if (modules.indexOf('socketio') === -1) modules.push('socketio');
    Settings.setValue('modules', modules);
    Settings.save();
  }
}

module.exports = Migrate;
