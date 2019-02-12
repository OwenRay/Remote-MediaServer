/**
 * Created by Owen on 14-4-2016.
 */


const RequestHandler = require('../RequestHandler');
const Settings = require('../../Settings.js');

class SettingsApiHandler extends RequestHandler {
  handleRequest() {
    this.response.header['Content-Type'] = 'text/json';

    if (this.request.method === 'PATCH') {
      const data = this.context.request.body;
      const attrs = data.data.attributes;
      Object.keys(attrs).forEach(key => Settings.setValue(key, attrs[key]));
      Settings.save();
    }
    this.respond();

    return true;
  }

  respond() {
    this.context.body = { data: { id: 1, type: 'setting', attributes: Settings.getAll() } };
  }
}

require('..')
  .registerRoute('all', '/api/settings/:unused_id', SettingsApiHandler);

module.exports = SettingsApiHandler;
