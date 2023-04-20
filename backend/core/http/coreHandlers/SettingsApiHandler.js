/**
 * Created by Owen on 14-4-2016.
 */

// eslint-disable-next-line max-classes-per-file
const fs = require('fs');
const util = require('util');
const RequestHandler = require('../RequestHandler');
const Settings = require('../../Settings');

const readdir = util.promisify(fs.readdir);

class SettingsApiHandler extends RequestHandler {
  handleRequest() {
    this.response.header['Content-Type'] = 'text/json';

    if (this.request.method === 'PATCH') {
      const data = this.context.request.body;
      const attrs = data.data.attributes;
      Object.keys(attrs).forEach((key) => Settings.setValue(key, attrs[key]));
      Settings.save();
    }
    this.respond();

    return true;
  }

  respond() {
    this.context.body = { data: { id: 1, type: 'setting', attributes: Settings.getAll() } };
  }
}

class ModuleApiHandler extends RequestHandler {
  async handleRequest() {
    this.context.body = await readdir(`${__dirname}/../../../modules`);
  }
}

require('..')
  .registerRoute('all', '/api/settings/:unused_id', SettingsApiHandler)
  .registerRoute('get', '/api/modules', ModuleApiHandler);

module.exports = SettingsApiHandler;
