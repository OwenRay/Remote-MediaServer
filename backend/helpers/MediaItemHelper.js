const Settings = require('../Settings');

class MediaItemHelper {
  static getFullFilePath(mediaItem) {
    /* var libraries = Settings.getValue("libraries");
        var library;
        for(var key in libraries)
        {
            if(libraries[key].uuid==mediaItem.attributes.libraryId)
            {
                library = libraries[key];
            }
        }
        if(!library)
            return ""; */
    return mediaItem.attributes.filepath;
  }

  static getLibrary(item) {
    return Settings.getValue('libraries')
      .find(l => l.uuid.split('-')[0] === item.attributes.libraryId);
  }
}

module.exports = MediaItemHelper;
