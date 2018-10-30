const Settings = require('../Settings');
const Database = require('../Database');
const Log = require('../helpers/Log');
const extendedInfoQueue = require('../scanner/ExtendedInfoQueue').getInstance();
const fs = require('fs');
const EDHT = require('./EDHT');
const crypto = require('crypto');
const Crypt = require('./Crypt');

/**
 * @todo, cache hashes locally
 */
class FileProcessor {
  constructor() {
    this.hashes = [];
    Settings.addObserver('libraries', this.publishDatabase.bind(this));
    EDHT.setOnreadyListener(this.onReady.bind(this));
    extendedInfoQueue.setOnDrain(this.publishDatabase.bind(this));
  }

  onReady() {
    this.publishDatabase();
    setInterval(this.reannounce.bind(this), 10000);
  }

  reannounce() {
    this.hashes.forEach(moreHashes => moreHashes.forEach(hash => EDHT.announce(hash)));
    this.hashes.forEach(moreHashes => moreHashes.forEach(hash => EDHT.share(hash)));
  }

  getAllSharedItems() {
    const key = Settings.getValue('sharekey');
    const items = Database
      .getAll('media-item', true)
      .filter(item => !!item.attributes.shared);

    return JSON.parse(JSON.stringify(items))
      .map((item) => {
        item.attributes.hashes = this.hashes[item.id].map(hash => hash.toString('hex'));
        item.id = `${key}-${item.id}`;
        item.attributes.libraryId = key;
        item.attributes.extension = item.attributes.filepath.replace(/^.*\.(.*)$/, '$1');
        item.attributes.filepath = `/download/${item.id}`;
        delete item.relationships;
        return item;
      });
  }

  publishDatabase() {
    if (!EDHT.ready) {
      return;
    }
    if (this.publishTimeout) {
      clearTimeout(this.publishTimeout);
    }
    this.publishTimeout = setTimeout(this.doPublishDatabase.bind(this), 1000);
  }

  async doPublishDatabase() {
    if (this.publishing) return;
    this.publishing = true;
    await this.publishDatabaseFiles();

    Log.debug('start write and publish edht database');
    fs.writeFile(
      'share/db',
      JSON.stringify(this.getAllSharedItems()),
      EDHT.publishDatabase.bind(EDHT),
    );
    this.publishing = false;
  }

  publishDatabaseFiles() {
    return new Promise(async (resolve) => {
      // first make sure we have a clientid
      await EDHT.publishDatabase();
      const libIds = Settings.getValue('libraries')
        .map(lib => lib.uuid);
      this.toProcess = Database.getAll('media-item', true)
        .filter(item => libIds.indexOf(item.attributes.libraryId) !== -1);

      this.announceNext(resolve);
    });
  }

  async announceNext(resolve) {
    if (!this.toProcess.length) {
      return resolve();
    }

    const item = this.toProcess.pop();

    if (!item.attributes.shared || !this.hashes[item.id]) {
      const { filesize, fileduration } = item.attributes;
      if (!filesize || !fileduration) {
        return this.announceNext(resolve);
      }
      const parts = Math.ceil(fileduration / 300);
      item.attributes.shareparts = parts;
      let hashes = new Array(parts).fill('');
      hashes = await Promise.all(hashes.map((val, index) => EDHT.share(`${Settings.getValue('sharekey')}-${item.attributes.id}-${index}`)));
      this.hashes[item.id] = hashes;
      item.attributes.shared = true;
      item.attributes.nonce = crypto.randomBytes(16).toString('hex');
      Database.update('media-item', item);
    }

    Promise.all(this.hashes[item.id].map(hash => EDHT.announce(hash)));

    return this.announceNext(resolve);
  }

  getReadStream(id, hash) {
    Log.debug('new request for file', id, hash);
    const item = Database.getById('media-item', id);
    const hashes = this.hashes[id];
    if (!hashes || !item) {
      Log.debug('items or hashes not found', item, hashes);
      return null;
    }
    const { filesize } = item.attributes;
    const chunkSize = Math.ceil(filesize / hashes.length);
    const start = hashes.map(h => h.toString('hex')).indexOf(hash) * chunkSize;

    if (start < 0) {
      Log.debug('hash not found between', hashes);
      return null;
    }
    let end = (start + chunkSize) - 1;
    if (end >= filesize) end = undefined;
    Log.debug('serving up', id, start, end, filesize);
    const filestream = fs.createReadStream(item.attributes.filepath, { start, end });
    return Crypt.encrypt(
      filestream,
      Buffer.from(Settings.getValue('dbKey'), 'hex'),
      Buffer.from(item.attributes.nonce, 'hex'),
    );
  }
}

module.exports = new FileProcessor();
