

/**
 * Created by owenray on 29-06-16.
 */
const IExtendedInfo = require('./IExtendedInfo');
const Database = require('../database/Database');
const path = require('path');

class ExtrasExtendedInfo extends IExtendedInfo {
  static extendInfo(mediaItem) {
    if (!mediaItem.attributes.extra || mediaItem.attributes['external-id']) {
      return;
    }
    // If external id has not been detected yet and items is an extra
    let items;

    // find all items with the same path, filtering out the current item
    let fileParts = mediaItem.attributes.filepath;
    for (let c = 0; c < 2; c += 1) {
      fileParts = path.parse(fileParts).dir;
      items = Database
        .findByMatchFilters('media-item', { filepath: `${fileParts}%` })
        .filter(item => item.id !== mediaItem.id);
      if (items.length) {
        break;
      }
    }

    // have we found an item? give this item the same ids
    if (items.length) {
      mediaItem.attributes['exernal-id'] = items[0].attributes['external-id'];
      mediaItem.attributes['external-episode-id'] = items[0].attributes['external-episode-id'];
    } else {
      mediaItem.attributes.extra = false;
    }
  }
}

module.exports = ExtrasExtendedInfo;
