

/**
 * Created by owenray on 29-06-16.
 */
const IExtendedInfo = require('../../core/scanner/IExtendedInfo');
const Guessit = require('./Guessit');
const path = require('path');
const Log = require('../../core/Log');
const core = require('../../core');
const ExtendedInfoQueue = require('../../core/scanner/ExtendedInfoQueue');

class ParseFileNameExtendedInfo extends IExtendedInfo {
  static async extendInfo(mediaItem, library, tryCount = 0) {
    if (!tryCount) {
      tryCount = 0;
    }

    const relativePath = mediaItem.attributes.filepath;

    if (mediaItem.attributes.title) {
      return;
    }
    Log.debug('parse filename', mediaItem.id);

    const filePath = path.parse(relativePath);
    const folder = path.parse(filePath.dir);
    const extraGuessitOptions = [];
    const fileParts = filePath.dir.split(path.sep);

    let season = '';
    let serieName = '';
    if (library.type === 'tv') {
      let offset;
      for (offset = 0; offset < fileParts.length; offset += 1) {
        // the first directory we find containing season info is probably the child directory
        // Of the directory containing the season name.
        const seasonCheck = fileParts[offset].replace(/^.*?(s|se|season)[^a-zA-Z0-9]?([0-9]+).*?$/i, '$2');
        if (seasonCheck !== fileParts[offset]) {
          season = parseInt(seasonCheck, 10);
          break;
        }
      }
      if (season && offset > 0) {
        serieName = fileParts[offset - 1];
        extraGuessitOptions.push(`-T ${serieName}`);
      }
    }

    let searchQuery = filePath.base.replace(/ /g, '.');

    if (tryCount === 1) {
      searchQuery = `${folder.base.replace(/ /g, '.')}-${filePath.base.replace(/ /g, '.')}`;
    }

    try {
      const data = await Guessit.parseName(
        searchQuery,
        { options: `-t ${library.type} ${extraGuessitOptions.join(' ')}` },
      );
      if (tryCount === 1 && data.title) {
        data.title = data.title.replace(`${folder.base}-`, '');
      }
      if (data.title) {
        if (season) {
          data.season = season;
        }
        if (serieName) {
          mediaItem.attributes['episode-title'] = data['episode-title'] ? data['episode-title'] : data.title;
          data.title = serieName;
        }
        mediaItem.attributes.season = data.season;
        mediaItem.attributes.episode = data.episode;
        mediaItem.attributes.title = data.title;
        mediaItem.attributes.type = library.type;
        return;
      }
      if (tryCount >= 1) {
        return;
      }
      await this.extendInfo(mediaItem, library, tryCount + 1);
    } catch (e) {
      Log.debug(e);
    }
  }
}

core.addBeforeStartListener(() =>
  ExtendedInfoQueue.registerExtendedInfoProvider(ParseFileNameExtendedInfo, true));

module.exports = ParseFileNameExtendedInfo;
