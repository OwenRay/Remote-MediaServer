

/**
 * Created by owenray on 29-06-16.
 */
const IExtendedInfo = require('../../core/scanner/IExtendedInfo');
const FFProbe = require('./FFProbe');
const Log = require('../../core/Log');
const core = require('../../core');
const ExtendedInfoQueue = require('../../core/scanner/ExtendedInfoQueue');

class FFProbeExtendedInfo extends IExtendedInfo {
  static async extendInfo(mediaItem) {
    if (mediaItem.attributes.gotfileinfo) {
      return;
    }

    Log.debug('ffprobe extended info', mediaItem.id);

    const fileData = await FFProbe.getInfo(mediaItem.attributes.filepath);
    if (!fileData || !fileData.format) {
      return;
    }

    const videoStream = fileData.streams.find(s => s.codec_type === 'video');
    if (videoStream) {
      mediaItem.attributes.width = videoStream.width;
      mediaItem.attributes.height = videoStream.height;
    }
    mediaItem.attributes.fileduration = parseFloat(fileData.format.duration);
    mediaItem.attributes.filesize = parseInt(fileData.format.size, 10);
    mediaItem.attributes.bitrate = fileData.format.bit_rate;
    mediaItem.attributes.format = fileData.format;
    mediaItem.attributes.streams = fileData.streams;
    mediaItem.attributes.gotfileinfo = true;
  }
}

core.addBeforeStartListener(() =>
  ExtendedInfoQueue.registerExtendedInfoProvider(FFProbeExtendedInfo));

module.exports = FFProbeExtendedInfo;
