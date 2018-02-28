const fs = require('fs');
const uuid = require('node-uuid');

const settingsObj = {
  port: 8080,
  name: 'My Media Server',
  ffmpeg_binary: `${process.cwd()}/ffmpeg`,
  ffprobe_binary: `${process.cwd()}/ffprobe`,
  libraries: [],
  tmdb_apikey: '0699a1db883cf76d71187d9b24c8dd8e',
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
  scanInterval: 3600,
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

    if (originalValue !== value) {
      this.triggerObservers(key);
    }
  },

  getAll() {
    return settingsObj;
  },

  load() {
    if (!fs.existsSync('settings.json')) {
      return;
    }
    const contents = fs.readFileSync('settings.json', 'utf8');
    const newSettings = JSON.parse(contents);
    Object.keys(newSettings).forEach((key) => { settingsObj[key] = newSettings[key]; });
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
