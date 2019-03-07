const RequestHandler = require('../../core/http/RequestHandler');
const httpServer = require('../../core/http');
const Database = require('../../core/database/Database');
const MovieDB = require('moviedb-api');
const Settings = require('../../core/Settings');

const movieDB = new MovieDB({
  consume: true,
  apiKey: Settings.getValue('tmdb_apikey'),
});

class redirectToIMDBHandler extends RequestHandler {
  async handleRequest() {
    const item = Database.getById('media-item', this.context.params.id);
    let m;

    if (item.attributes.mediaType === 'tv') m = await movieDB.tvExternal_ids({ id: item.attributes['external-id'] });
    else m = await movieDB.movie({ id: item.attributes['external-id'] });

    this.context.redirect(`https://imdb.com/title/${m.imdb_id}`);
    return true;
  }

  static getDescription() {
    return 'will 302 redirect the client to an IMDB link';
  }
}

httpServer.registerRoute('get', '/api/redirectToIMDB/:id', redirectToIMDBHandler);

module.exports = redirectToIMDBHandler;
