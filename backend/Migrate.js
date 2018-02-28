

const Database = require('./Database');
const Log = require('./helpers/Log');

class Migrate {
  static run() {
    while (this[`version${Database.version}`]) {
      Log.info('running migration', Database.version);
      this[`version${Database.version}`]();
      Database.version += 1;
      Database.save();
    }
  }

  static version0() {
    const items = Database.getAll('media-item');
    items.forEach((item) => {
      const p = item.relationships && item.relationships['play-position'];
      if (p) {
        const i = Database.getById('play-position', p.data.id);
        i.attributes.watched = i.attributes.position > item.attributes.fileduration * 0.97;
      }
    });
  }
}

module.exports = Migrate;
