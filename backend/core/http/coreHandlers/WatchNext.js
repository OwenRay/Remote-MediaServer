const MovieDB = require('moviedb-api');
const RequestHandler = require('../RequestHandler');
const httpServer = require('..');
const DatabaseSearch = require('../../database/DatabaseSearch');
const Database = require('../../database/Database');
const Settings = require('../../Settings');

const movieDB = new MovieDB({
  apiKey: Settings.getValue('tmdb_apikey'),
});

// @todo let modules add responses here.

class WatchNext extends RequestHandler {
  async handleRequest() {
    let continueWatching = DatabaseSearch.query(
      'media-item',
      {
        join: 'play-position',
        where: { type: 'tv', extra: 'false' },
        relationConditions: { 'play-position': { watched: 'true' } },
        sort: 'season:DESC,episode:DESC',
        distinct: 'external-id',
      },
    ).data;

    WatchNext.sortByRecentWatch(continueWatching);

    continueWatching = continueWatching
      // now find the next episode if available
      .map(({ attributes }) => {
        let { season, episode } = attributes;
        const id = attributes['external-id'];
        episode += 1;
        const [i] = Database.findByMatchFilters('media-item', { season, episode, 'external-id': id });
        season += 1;
        episode = 1;
        return i || Database.findByMatchFilters('media-item', { season, episode, 'external-id': id }).pop();
      })
      // filter out the one's that are not found
      .filter((i) => i);

    const newMovies = DatabaseSearch.query(
      'media-item',
      {
        sort: 'date_added:DESC', join: 'play-position', where: { type: 'movie' }, limit: 20,
      },
    );
    const newTV = DatabaseSearch.query(
      'media-item',
      {
        sort: 'date_added:DESC', join: 'play-position', where: { type: 'tv' }, limit: 20,
      },
    );

    this.context.body = {
      continueWatching: {
        data: continueWatching,
        included: DatabaseSearch.getRelationShips('play-position', continueWatching),
      },
      newMovies,
      newTV,
      recommended: await WatchNext.getRecommendations(),
    };
  }

  static async getRecommendations() {
    let { data } = DatabaseSearch.query(
      'media-item',
      {
        join: 'play-position',
        where: { type: 'movie', extra: 'false' },
        relationConditions: { 'play-position': { watched: 'true' } },
        distinct: 'external-id',
      },
    );

    // last 5
    WatchNext.sortByRecentWatch(data);
    data = data.slice(0, 5).map((i) => i.attributes);

    // fetch rec's, get relevant movies, filter out missing, and count double
    const itemsById = {};
    (await Promise.all(data.map((i) => WatchNext.getRecommendation(i['external-id']))))
      .reduce((acc, { results }) => acc.concat(results), [])
      .map(({ id }) => DatabaseSearch.query(
        'media-item',
        {
          join: 'play-position',
          where: { 'external-id': id, extra: 'false' },
          limit: 1,
          relationConditions: { 'play-position': { watched: 'false' } },
        },
      ).data.pop())
      .filter((i) => i)
      .forEach((i) => {
        if (itemsById[i.id]) {
          itemsById[i.id].count += 1;
          return;
        }
        i.count = 1;
        itemsById[i.id] = i;
      });

    // sort by occurence and return
    const items = Object.values(itemsById).sort((a, b) => b.count - a.count);
    return { data: items, included: DatabaseSearch.getRelationShips('play-position', items) };
  }

  static async getRecommendation(id) {
    return new Promise((resolve) => {
      movieDB.request(
        '/movie/{id}/recommendations',
        'GET',
        { id },
        (err, res) => {
          resolve(res);
        },
      );
    });
  }

  static sortByRecentWatch(items) {
    // sort by the most recently watched items
    items.sort((a, b) => (Database.getById('play-position', b.relationships['play-position'].data.id).attributes.created || 0)
      - (Database.getById('play-position', a.relationships['play-position'].data.id).attributes.created || 0));
  }
}

httpServer.registerRoute('get', '/api/watchNext', WatchNext);

module.exports = WatchNext;
