const Settings = require('../Settings');
const Log = require('../helpers/Log');
const { spawn } = require('child_process');


class IPFS {
  constructor() {
    this.BIN = `${__dirname}/../../node_modules/go-ipfs-dep/go-ipfs/ipfs`;
    this.readyListeners = [];
  }

  start() {
    this.exec('init').on('close', () => {
      this.exec('config', 'Addresses.Gateway', Settings.getValue('ipfsgateway')).on('close', () => {
        this.exec('config', '--json', 'Experimental.FilestoreEnabled', 'true').on('close', () => {
          Log.debug('starting IPFS daemon');
          this.proc = this.exec('daemon', '--init', '--enable-namesys-pubsub');
          this.proc.stderr.on('data', this.onLog.bind(this));
          this.proc.stdout.on('data', this.onLog.bind(this));
        });
      });
    });
  }

  onReady() {
    this.ready = true;
    this.readyListeners.forEach(cb => cb());
  }

  exec(...args) {
    return spawn(this.BIN, ['-c', `${process.cwd()}/ipfs`].concat(args));
  }

  execAndReturnOutput(...args) {
    return new Promise((resolve, reject) => {
      const proc = this.exec(...args);
      let data = '';
      proc.stdout.on('data', (d) => {
        data += `${d}`;
      });
      proc.stderr.on('data', (d) => {
        data += `${d}`;
      });
      proc.on('close', (code) => {
        if (code !== 0 || !data) reject(data);
        resolve(data);
      });
    });
  }

  setOnreadyListener(cb) {
    this.readyListeners.push(cb);
    if (this.ready) {
      cb();
    }
  }

  onLog(data) {
    Log.debug('IPFS', `${data}`);
    if (`${data}`.indexOf('Daemon is ready') !== -1) {
      this.onReady();
    }
  }

  async addFile(path) {
    const hash = await this.execAndReturnOutput('add', '-Q', path);
    return hash.split('\n')[0];
  }

  async publishDatabase() {
    const hash = await this.addFile('ipfs/db');
    Log.debug('got new ipfs db hash', hash);

    const proc = this.exec('name', 'publish', hash);
    proc.stdout.on('data', (data) => {
      Log.debug('IPFS publish db', `${data}`);
    });
    proc.on('close', (code) => {
      if (code !== 0) {
        Log.warning('Failed to publish ipns');
      }
      this.getAndSaveKey();
    });
  }

  async getAndSaveKey() {
    const key = await this.execAndReturnOutput('key', 'list', '-l');
    Settings.setValue('sharekey', key.split(' ')[0]);
    Settings.save();
    return key;
  }

  getFile(hash) {
    return this.execAndReturnOutput('cat', hash);
  }
}

module.exports = new IPFS();
