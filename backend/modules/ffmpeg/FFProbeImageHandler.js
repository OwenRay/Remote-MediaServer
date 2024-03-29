/**
 * Created by owenray on 7/9/16.
 */
const { spawn } = require('child_process');
const IImageHandler = require('../../core/http/IImageHandler');
const Settings = require('../../core/Settings');
const MediaItemHelper = require('../../core/MediaItemHelper');
const Log = require('../../core/Log');
const httpServer = require('../../core/http');
const ImageCacheHandler = require('../../core/http/coreHandlers/ImageCacheHandler');

const sizes = {};
sizes[IImageHandler.TYPE_POSTER] = { w: 300, h: 450 };
sizes[IImageHandler.TYPE_POSTER_SMALL] = { w: 300, h: 450 };
sizes[IImageHandler.TYPE_POSTER_LARGE] = { w: 1280, h: 2000 };

class FFProbeImageHandler extends IImageHandler {
  handleRequest() {
    let offset = 0;
    if (!this.item || !this.item.attributes.width) {
      return false;
    }
    if (this.item.attributes.fileduration) {
      offset = this.item.attributes.fileduration / 2;
    }

    let crop = {
      x: 0,
      y: 0,
      width: this.item.attributes.width,
      height: this.item.attributes.height,
    };
    let size = `${crop.width}x${crop.height}`;

    if (this.type !== IImageHandler.TYPE_BACKDROP) {
      const targetSize = sizes[this.type];

      size = `${targetSize.w}x${targetSize.h}`;
      if (targetSize.w / targetSize.h > crop.width / crop.height) {
        crop.width = targetSize.w;
        crop.height = crop.width * (targetSize.h / targetSize.w);
      } else {
        crop.height = targetSize.h;
        crop.width = crop.height * (targetSize.w / targetSize.h);
      }
      crop.y += Math.floor((this.item.attributes.height - crop.height) / 2);
      crop.x += Math.floor((this.item.attributes.width - crop.width) / 2);
    }
    crop = `${crop.width}:${crop.height}:${crop.x}:${crop.y}`;

    const file = MediaItemHelper.getFullFilePath(this.item);
    const args = [
      '-ss', offset,
      '-i', file,
      '-frames', '1',
      '-filter', `crop=${crop}`,
      '-y',
      '-s', size,
      '-f', 'singlejpeg',
      '-',
    ];
    const proc = spawn(
      Settings.getValue('ffmpeg_binary'),
      args,
    );

    let b;
    proc.stdout.on('data', (data) => {
      if (b) {
        b = Buffer.concat([b, data]);
      } else {
        b = data;
      }
    });

    proc.stderr.on('data', (data) => {
      Log.debug(`${data}`);
    });

    return new Promise((resolve) => {
      proc.on('close', () => {
        new ImageCacheHandler(this.context).put(b);
        this.context.body = b;
        resolve();
      });
    });
  }

  static getDescription() {
    return `will get a thumbnail from the middle of the video  \n${IImageHandler.getDescription()}`;
  }
}

httpServer.registerRoute('get', '/img/:image.jpg', FFProbeImageHandler, 0, 1);

module.exports = FFProbeImageHandler;
