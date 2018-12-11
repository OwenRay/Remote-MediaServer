

/**
 * Created by owenray on 29-06-16.
 */
const IExtendedInfo = require('./IExtendedInfo');
const Settings = require('../../Settings');
const path = require('path');
const Log = require('../../helpers/Log');
const MovieDB = require('moviedb-api');

const movieDB = new MovieDB({
  consume: true,
  apiKey: Settings.getValue('tmdb_apikey'),
});

const discardRegex = new RegExp('\\W|-|_|([0-9]+p)|(LKRG)', 'g');


class TheMovieDBExtendedInfo extends IExtendedInfo {
  static async extendInfo(mediaItem, library, tryCount = 0) {
    if (!tryCount) {
      tryCount = 0;
    }

    if (mediaItem.attributes.gotExtendedInfo >= 2 ||
      !['tv', 'movie'].includes(mediaItem.attributes.type)) {
      return;
    }
    Log.debug('process tmdb', mediaItem.id);


    // If the movie cannot be found:
    // 1. try again without year,
    // 2. Then try again with the filename

    let params = { query: mediaItem.attributes.title };

    if (mediaItem.attributes.episode) {
      params.query += ` ${mediaItem.attributes.episode}`;
    }

    switch (tryCount) {
      case 0:
        params.year = mediaItem.attributes.year;
        break;
      default:
        [params.query] = path.parse(mediaItem.attributes.filepath).base.split('.');
        params.query = params.query.replace(discardRegex, ' ');
        break;
    }

    let searchMethod = movieDB.searchMovie;
    if (library.type === 'tv') {
      searchMethod = movieDB.tvSeasonEpisode;
      if (!mediaItem.attributes['external-id']) {
        return;
      }
      params = {
        id: mediaItem.attributes['external-id'],
        season_number: mediaItem.attributes.season,
        episode_number: mediaItem.attributes.episode,
      };
    }
    searchMethod = searchMethod.bind(movieDB);

    let res = await searchMethod(params);
    if (library.type !== 'tv') {
      res = (res.results && res.results.length > 0 ? res.results[0] : null);
    }

    if (res) {
      if (library.type === 'tv') {
        res['external-episode-id'] = res.id;
        res['episode-title'] = res.name;
        delete res.name;
      } else {
        res['external-id'] = res.id;
      }

      if (library.type === 'movie') {
        const { crew, date } = await TheMovieDBExtendedInfo.getMoreMovieInfo(res.id);
        if (crew && crew.cast) {
          mediaItem.attributes.actors = crew.cast.map(actor => actor.name);
        }
        if (date) {
          mediaItem.attributes.mpaa = date.certification;
        }
      }

      delete res.id;
      Object.keys(res).forEach((key) => { mediaItem.attributes[key.replace(/_/g, '-')] = res[key]; });

      let releaseDate = res.release_date ? res.release_date : res.first_air_date;
      releaseDate = releaseDate || res.air_date;

      mediaItem.attributes['release-date'] = releaseDate;
      if (releaseDate) {
        [mediaItem.attributes.year] = releaseDate.split('-');
      }
      mediaItem.attributes.gotExtendedInfo = 2;
    } else if (tryCount < 2) {
      await this.extendInfo(mediaItem, library, tryCount + 1);
    }
  }

  static async getMoreMovieInfo(id) {
    const crew = await movieDB.movieCredits({ id });
    let dates = await movieDB.movieRelease_dates({ id });

    // is there a US release? get it. otherwise whichever's first
    dates = dates.results;
    let date = dates.find(d => d.iso_3166_1 === 'US');
    if (!date && dates.length) {
      [date] = dates;
    }

    if (date) {
      date = date.release_dates.pop();
    }

    return { crew, date };
  }
}

TheMovieDBExtendedInfo.lastRequest = 0;


module.exports = TheMovieDBExtendedInfo;
