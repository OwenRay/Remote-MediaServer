const fs = require('fs');
const uuid = require('node-uuid');
const crypto = require('crypto');

const { env } = process;

const settingsObj = {
  port: 8234,
  bind: '0.0.0.0',
  name: 'My Media Server',
  ffmpeg_binary: `${process.cwd()}/ffmpeg`,
  ffprobe_binary: `${process.cwd()}/ffprobe`,
  libraries: [],
  tmdb_apikey: '0699a1db883cf76d71187d9b24c8dd8e',
  dhtbootstrap: [
    'theremote.io:8235',
    'whileip.com:8235',
  ],
  dhtoffset: 0,
  dbKey: crypto.randomBytes(24).toString('hex'),
  dbNonce: crypto.randomBytes(16).toString('hex'),
  shareport: 8235,
  sharehost: '',
  sharespace: 15,
  videoFileTypes: [
    'mkv',
    'mp4',
    '3gp',
    'avi',
    'mov',
    'ts',
    'webm',
    'flv',
    'f4v',
    'vob',
    'ogv',
    'ogg',
    'wmv',
    'qt',
    'rm',
    'mpg',
    'mpeg',
    'm4v',
  ],
  // 0: debug, 1: info, 2: warning, 3: exception
  verbosity: 1,
  guessit: {
    host: 'guessit.theremote.io',
    port: 5000,
  },
  startscan: true,
  filewatcher: 'native',
  scanInterval: 3600,
  modules: [
    'debug',
    'ffmpeg',
    'guessit',
    'sharing',
    'tmdb',
    'rms-encrypt',
  ],
  startopen: true,
  ssl: {},
  sslport: 8443,
};

const Settings = {
  observers: [],

  createIfNotExists() {
    if (!fs.existsSync('settings.json')) {
      Settings.save();
    }
  },

  getValue(key) {
    return settingsObj[key];
  },

  /**
   * returns true if value changed
   * @param key
   * @param value
   * @returns {boolean}
   */
  setValue(key, value) {
    if (key === 'libraries') {
      value.forEach((lib) => {
        if (!lib.uuid) {
          lib.uuid = uuid.v4();
        }
      });
    }

    const originalValue = settingsObj[key];
    settingsObj[key] = value;

    // quick lazy way to do a deep compare
    if (JSON.stringify(originalValue) !== JSON.stringify(value)) {
      this.triggerObservers(key);
      return true;
    }
    return false;
  },

  getAll() {
    return settingsObj;
  },

  load() {
    let newSettings = settingsObj;
    if (fs.existsSync('settings.json')) {
      const contents = fs.readFileSync('settings.json', 'utf8');
      newSettings = JSON.parse(contents);
    }
    Object.keys(newSettings).forEach((key) => {
      let val = env[`RMS_${key.toLocaleUpperCase()}`];
      if (val && val[0] === '{') val = JSON.parse(val);
      val = val || newSettings[key];
      if (val === 'false') val = false;
      settingsObj[key] = val;
    });
  },

  save() {
    fs.writeFileSync('settings.json', JSON.stringify(settingsObj, null, '  '));
  },

  triggerObservers(variable) {
    if (!Settings.observers[variable]) {
      return;
    }
    Settings.observers[variable].forEach((observer) => { observer(variable); });
  },

  addObserver(variable, callback) {
    if (!Settings.observers[variable]) {
      Settings.observers[variable] = [];
    }
    Settings.observers[variable].push(callback);
  },
};

Settings.load();
Settings.createIfNotExists();

module.exports = Settings;
