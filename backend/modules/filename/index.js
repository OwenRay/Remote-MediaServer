/**
 * Created by owenray on 29-06-16.
 */
const IExtendedInfo = require('../../core/scanner/IExtendedInfo');
const path = require('path');
const Log = require('../../core/Log');
const core = require('../../core');
const ExtendedInfoQueue = require('../../core/scanner/ExtendedInfoQueue');

class ParseFileNameExtendedInfo extends IExtendedInfo {
  static extendInfo(mediaItem, library) {
    const relativePath = mediaItem.attributes.filepath;

    if (mediaItem.attributes.title) {
      return;
    }
    Log.debug('parse filename', mediaItem.id);

    const filePath = path.parse(relativePath);
    const fileParts = filePath.dir.split(path.sep);

    let serieName = '';
    if (library.type === 'tv') {
      let offset;
      for (offset = 0; offset < fileParts.length; offset += 1) {
        // the first directory we find containing season info is probably the child directory
        // Of the directory containing the season name.
        const seasonCheck = fileParts[offset].replace(/^.*?(s|se|season)[^a-zA-Z0-9]?([0-9]+).*?$/i, '$2');
        if (seasonCheck !== fileParts[offset]) {
          mediaItem.attributes.season = parseInt(seasonCheck, 10);
          break;
        }
      }
      if (mediaItem.attributes.season && offset > 0) {
        serieName = fileParts[offset - 1];
      }
      if (!mediaItem.attributes.season) {
        serieName = fileParts[fileParts.length - 1];
      }
    }

    const serieYearMatch = /\((\d{4})\)/.exec(serieName);
    if (serieYearMatch) {
      mediaItem.attributes.year = parseInt(serieYearMatch[1], 10);
      serieName = serieName.replace(/\(\d{4}\)/, '').trim();
    }

    let name = filePath.base;

    if (library.type === 'tv') {
      let seRegex = /s(\d{1,2})e(\d{1,3})/ig;
      let match = seRegex.exec(name);
      if (match && match.length >= 3) {
        mediaItem.attributes.season = parseInt(match[1], 10);
        mediaItem.attributes.episode = parseInt(match[2], 10);
      } else {
        seRegex = /e(pisode.?)?(\d{1,3})/ig;
        match = seRegex.exec(name);
        if (match) mediaItem.attributes.episode = parseInt(match[2], 10);
      }
      if (!mediaItem.attributes.episode) {
        mediaItem.attributes.episode = parseInt(/\d+/.exec(name)[0], 10);
      }
      name = name.replace(seRegex, '');
    }
    let yearRegex = /\((\d{4})\)/ig;
    if (!name.match(yearRegex)) yearRegex = /\b(\d{4})\b/ig;
    const yearMatch = name.match(yearRegex);
    // take the last valid year in the name (to support years in the titles)
    if (yearMatch) {
      for (let c = yearMatch.length - 1; c >= 0; c -= 1) {
        const year = parseInt(yearMatch[c].replace(/\D/g, ''), 10);
        if (year > 1888 && year < new Date().getFullYear() + 10) {
          mediaItem.attributes.year = year;
          [name] = name.split(yearMatch[c]);
          break;
        }
      }
    }

    const strip = [
      /\.[\d\w]+$/, // file extension
      /\(.*?\)/g,
      /(3d.?)?blu.?ray.*$/ig,
      /\d{3,4}p.*$/ig, // resolution
      /(3d.?)?(dvd|hd).?rip.*$/ig,
      /(3d.?)?web.?dl.*$/ig,
      /(3d.?)?(hd|sd|4k).tv.*$/ig,
      /(extended|remastered|xvid|ac3|theatrical.cut).*$/ig,
      /HD.*$/g,
      /cd\d.*$/ig,
      /(\[|\(]).*?(\]|\))/g, // remove everything between brackets
      /(3d.?)?(hd|sd|4k)$/ig,
      /(h|v|half|full).(sbs|ou).*$/ig,
    ];
    name = strip.reduce((red, regex) => red.replace(regex, ''), name);
    name = name.replace(/[ \\._]+/g, ' ');

    if (library.type === 'tv') {
      name = name.split('-').filter(value => value.length > 1);
      while (name.length > 1) mediaItem.attributes['episode-title'] = name.pop().trim();
      name = name.join(' ').trim();

      if (serieName.toLowerCase() !== name.toLocaleLowerCase()) {
        mediaItem.attributes['episode-title'] = name.trim();
      }
      mediaItem.attributes.title = serieName;
    } else if (!mediaItem.attributes.year) {
      const parent = fileParts[fileParts.length - 1];
      if (parent.match(/\d{4}/)) {
        mediaItem.attributes.year = parseInt(/\d{4}/.exec(fileParts[fileParts.length - 1])[0], 10);
      }
    }

    if (!mediaItem.attributes.title) {
      mediaItem.attributes.title = name.trim();
    }
    const commaForAlpabeticRegex = /^(.*), ?(the|a|an)$/i;
    const { title } = mediaItem.attributes;
    if (title.match(commaForAlpabeticRegex)) {
      mediaItem.attributes.title = title.replace(commaForAlpabeticRegex, '$2 $1');
    }


    mediaItem.attributes.type = library.type;
    if (!mediaItem.attributes.episode === undefined || !mediaItem.attributes.title) {
      Log.warning('Problem extracting info from mediaItem', mediaItem.attributes);
    }
  }
}

core.addBeforeStartListener(() =>
  ExtendedInfoQueue.registerExtendedInfoProvider(ParseFileNameExtendedInfo, true));

module.exports = ParseFileNameExtendedInfo;
