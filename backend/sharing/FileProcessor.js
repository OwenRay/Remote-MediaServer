const Settings = require('../Settings');
const Database = require('../Database');
const Log = require('../helpers/Log');
const extendedInfoQueue = require('../scanner/ExtendedInfoQueue').getInstance();
const fs = require('fs');
const EDHT = require('./EDHT');
const crypto = require('crypto');
const Crypt = require('./Crypt');
const DebugApiHandler = require('../requestHandlers/api/DebugApiHandler');
const { promisify } = require('util');

const stat = promisify(fs.stat);

/**
 * @todo, cache hashes locally
 */
class FileProcessor {
  constructor() {
    DebugApiHandler.registerDebugInfoProvider('sharing', this.debugInfo.bind(this));
    Settings.addObserver('libraries', this.publishDatabase.bind(this));
    EDHT.setOnreadyListener(this.onReady.bind(this));
    extendedInfoQueue.setOnDrain(this.publishDatabase.bind(this));
  }

  onReady() {
    this.publishDatabase();
    this.reannounce();
    setInterval(this.reannounce.bind(this), 30 * 60 * 1000);
  }

  async reannounce() {
    if (this.announcing) return;
    this.announcing = true;
    await this.doReannounce(FileProcessor.getAllSharedItems());
  }

  async doReannounce(items) {
    if (!items.length) {
      this.announcing = false;
      return;
    }
    const item = items.pop();
    try {
      await Promise.all(FileProcessor.putItem(item));
    } catch (e) {
      Log.debug(e);
    }
    this.doReannounce(items);
  }

  static getAllSharedItems() {
    const key = Settings.getValue('sharekey');
    const items = Database
      .getAll('media-item', true)
      .filter(item => !!item.attributes.shared);

    return JSON.parse(JSON.stringify(items))
      .map((item) => {
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
    const changed = await this.publishDatabaseFiles();
    if (changed) {
      Log.debug('start write and publish edht database');
      fs.writeFile(
        'share/db',
        JSON.stringify(FileProcessor.getAllSharedItems()),
        () => {
          EDHT.publishDatabase(true);
        },
      );
    }
    this.publishing = false;
  }

  publishDatabaseFiles() {
    const libIds = Settings.getValue('libraries')
      .filter(lib => lib.shared && lib.shared !== 'off')
      .map(lib => lib.uuid);
    this.toProcess = Database.getAll('media-item', true)
      .filter(({ attributes }) => (
        libIds.indexOf(attributes.libraryId) !== -1 &&
        !attributes.shared &&
        !attributes.hashes &&
        attributes.filesize &&
        attributes.fileduration
      ));
    if (!this.toProcess.length) return false;

    return new Promise(async (resolve) => {
      // first make sure we have a clientid
      await EDHT.publishDatabase();
      this.announceNext(resolve);
    });
  }

  async announceNext(resolve) {
    if (!this.toProcess.length) {
      return resolve(true);
    }

    const item = this.toProcess.pop();
    const hashes = await Promise.all(FileProcessor.putItem(item));
    item.attributes.hashes = hashes.map(hash => hash.toString('hex'));
    item.attributes.shareparts = hashes.length;
    item.attributes.nonce = crypto.randomBytes(16).toString('hex');
    item.attributes.shared = true;
    Database.update('media-item', item);

    return this.announceNext(resolve);
  }

  static putItem(item) {
    const parts = Math.ceil(item.attributes.fileduration / 300);
    const hashes = new Array(parts).fill('');
    return hashes.map((val, index) => EDHT.share(`${Settings.getValue('sharekey')}-${item.id}-${index}`));
  }

  async getReadStream(id, hash) {
    Log.debug('new request for file', id, hash, this.announcing);
    const item = Database.getById('media-item', id);
    if (!item ||
      !item.attributes.shared ||
      !item.attributes.hashes ||
      item.attributes.hashes.indexOf(hash) === -1) {
      try {
        if (!hash.match(/^[0-9a-f]{40}$/)) return null;
        await stat(`share/${hash}`);
        return fs.createReadStream(`share/${hash}`);
      } catch (e) {
        Log.debug('items or hashes not found');
        return null;
      }
    }
    const { hashes } = item.attributes;
    const { filesize } = item.attributes;
    const chunkSize = Math.ceil(filesize / hashes.length);
    const start = hashes.indexOf(hash) * chunkSize;

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

  debugInfo() {
    return {
      announcing: this.announcing,
      publishQueueSize: this.toProcess ? this.toProcess.length : 0,
      publishing: this.publishing,
    };
  }
}

module.exports = new FileProcessor();
