const Settings = require('./Settings');

class MediaItemHelper {
  static getFullFilePath(mediaItem) {
    return mediaItem.attributes.filepath;
  }

  static getLibrary(item) {
    return Settings.getValue('libraries')
      .find((l) => l.uuid.split('-')[0] === item.attributes.libraryId);
  }
}

module.exports = MediaItemHelper;
