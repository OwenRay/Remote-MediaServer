/**
 * Created by owenray on 18-09-16.
 */
const IExtendedInfo = require('../../core/scanner/IExtendedInfo');
const Settings = require('../../core/Settings');
const NodeCache = require('node-cache');
const Log = require('../../core/Log');
const MovieDB = require('moviedb-api');
const core = require('../../core');
const ExtendedInfoQueue = require('../../core/scanner/ExtendedInfoQueue');

const nodeCache = new NodeCache();

const movieDB = new MovieDB({
  consume: true,
  apiKey: Settings.getValue('tmdb_apikey'),
});

class TheMovieDBSeriesAndSeasonsExtendedInfo extends IExtendedInfo {
  static async extendInfo(mediaItem, library) {
    if (library.type !== 'tv') {
      return;
    }
    if (mediaItem.attributes.gotSeriesAndSeasonInfo >= 2) {
      return;
    }


    Log.debug('process serie', mediaItem.id);

    // find series info
    const { title } = mediaItem.attributes;
    let cache = nodeCache.get(`1:${title}`);
    const items = cache || await movieDB.searchTv({ query: title });
    nodeCache.set(`1:${title}`, items);

    let res = items.results.find(i => i.name.toLocaleLowerCase() === title.toLocaleLowerCase());
    if (!res) [res] = items.results;

    if (res) {
      res['external-id'] = res.id;
      delete res.id;
      Object.keys(res).forEach((key) => {
        mediaItem.attributes[key.replace(/_/g, '-')] = res[key];
      });

      const date = res.release_date ? res.release_date : res.first_air_date;
      mediaItem.attributes.year = parseInt(date.split('-')[0], 10);
    }
    // find season info
    cache = nodeCache.get(`2:${title}:${mediaItem.attributes.season}`);
    res = cache || await movieDB.tvSeason({
      id: mediaItem.attributes['external-id'],
      season_number: mediaItem.attributes.season,
    });
    if (res) {
      nodeCache.set(`2:${title}:${mediaItem.attributes.season}`, res);

      delete res.episodes;
      mediaItem.attributes.seasonInfo = res;
    }

    try {
      // get credits
      cache = nodeCache.get(`3:${title}:${mediaItem.attributes.season}`);
      res = cache || await movieDB.tvCredits({
        id: mediaItem.attributes['external-id'],
      });
      nodeCache.set(`3:${title}:${mediaItem.attributes.season}`, res);
      mediaItem.attributes.actors = res.cast.map(actor => actor.name);
    } catch (e) {
      Log.debug(e);
    }

    try {
      // get credits
      cache = nodeCache.get(`4:${title}:${mediaItem.attributes.season}`);
      res = cache || await movieDB.tvContent_ratings({
        id: mediaItem.attributes['external-id'],
      });
      nodeCache.set(`4:${title}:${mediaItem.attributes.season}`, res);
      // is there a US release? get it. otherwise whichever's first
      res = res.results;
      let r = res.find(d => d.iso_3166_1 === 'US');
      if (!r && res.length) {
        [r] = res;
      }

      if (r) {
        mediaItem.attributes.mpaa = r.rating;
      }
    } catch (e) {
      Log.debug(e);
    }
    mediaItem.attributes.gotSeriesAndSeasonInfo = 2;
  }
}

core.addBeforeStartListener(() =>
  ExtendedInfoQueue.registerExtendedInfoProvider(TheMovieDBSeriesAndSeasonsExtendedInfo));

module.exports = TheMovieDBSeriesAndSeasonsExtendedInfo;
