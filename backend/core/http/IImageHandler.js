/**
 * Created by owenray on 7/9/16.
 */
const RequestHandler = require('./RequestHandler');
const Database = require('../database/Database');

class IImageHandler extends RequestHandler {
  /**
     *
     * @param method
     * @param path
     * @param context
     */
  constructor(context, method, path) {
    super(context, method, path);

    if (!this.context) {
      return;
    }
    const item = context.params.image.split('_');
    context.set('Cache-control', 'max-age=86400');

    [, this.type] = item;
    this.item = Database.getById('media-item', item[0]);
    this.response.header['Content-Type'] = 'image/jpeg';
  }

  static getDescription() {
    return ':image should be [id]_[type]  \n'
    + 'where type is one of  \n'
    + '- backdrop  \n'
    + '- poster  \n'
    + '- posterlarge  \n'
    + '- postersmall';
  }
}

IImageHandler.TYPE_BACKDROP = 'backdrop';
IImageHandler.TYPE_POSTER = 'poster';
IImageHandler.TYPE_POSTER_LARGE = 'posterlarge';
IImageHandler.TYPE_POSTER_SMALL = 'postersmall';

module.exports = IImageHandler;
