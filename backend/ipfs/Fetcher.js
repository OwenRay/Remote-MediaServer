const Database = require('../Database');
const IPFS = require('./IPFS');
const Settings = require('../Settings');
const Log = require('../helpers/Log');

// @todo handle library delete
class Fetcher {
  constructor() {
    Database.addDataProvider(this.provide.bind(this));
    this.cached = { 'media-item': {} };
    IPFS.setOnreadyListener(this.onReady.bind(this));
  }

  onReady() {
    this.refreshDatabase();
    Settings.addObserver('libraries', this.refreshDatabase.bind(this));
  }

  refreshDatabase() {
    const libs = Settings.getValue('libraries').filter(lib => lib.type === 'ipfs');
    libs.forEach(this.fetchLib.bind(this));
  }

  async fetchLib(lib) {
    const hash = await IPFS.execAndReturnOutput('name', 'resolve', lib.uuid);
    let data = await IPFS.getFile(hash.split('\n')[0]);
    data = JSON.parse(data).map((item) => {
      item.attributes.filepath = `http://localhost:8234/${item.attributes.filepath}`;
      return item;
    });
    this.cached['media-item'][lib.uuid] = data;
    Log.debug('IPFS fetched', lib.uuid);
  }

  provide(type) {
    if (!this.cached[type]) { return []; }
    let items = Object.values(this.cached[type]);
    if (!items.length) return [];
    items = items.reduce((red, arr) => (red ? red.concat(arr) : arr));
    return items;
  }
}

module.exports = new Fetcher();
