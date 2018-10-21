

/**
 * Created by owenray on 7/9/16.
 */
const RequestHandler = require('../RequestHandler');
const Database = require('../../Database');

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

    [, this.type] = item;
    this.item = Database.getById('media-item', item[0]);
    this.response.header['Content-Type'] = 'image/jpeg';
  }
}

IImageHandler.TYPE_BACKDROP = 'backdrop';
IImageHandler.TYPE_POSTER = 'poster';
IImageHandler.TYPE_POSTER_SMALL = 'postersmall';

module.exports = IImageHandler;
