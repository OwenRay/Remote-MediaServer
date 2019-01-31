const RequestHandler = require('../RequestHandler');
const httpServer = require('../../HttpServer');
const DatabaseSearch = require('../../helpers/DatabaseSearch');
const Database = require('../../Database');

class WatchNext extends RequestHandler {
  async handleRequest() {
    let continueWatching = DatabaseSearch.query(
      'media-item',
      {
        join: 'play-position',
        where: { type: 'tv' },
        relationConditions: { 'play-position': { watched: 'true' } },
        sort: 'season:DESC,episode:DESC',
        distinct: 'external-id',
      },
    ).data;

    // sort by the most recently watched items
    continueWatching.sort((a, b) =>
      (Database.getById('play-position', b.relationships['play-position'].data.id).attributes.created || 0)
        - (Database.getById('play-position', a.relationships['play-position'].data.id).attributes.created || 0));


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
      .filter(i => i);

    this.context.body = {
      continueWatching: {
        data: continueWatching,
        includes: DatabaseSearch.getRelationShips('play-position', continueWatching),
      },
    };
  }
}

httpServer.registerRoute('get', '/api/watchNext', WatchNext);

module.exports = WatchNext;
