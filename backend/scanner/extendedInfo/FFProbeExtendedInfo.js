"use strict";
/**
 * Created by owenray on 29-06-16.
 */
const IExtendedInfo = require("./IExtendedInfo");
const FFProbe = require('../../helpers/FFProbe');
const Log = require("../../helpers/Log");

class FFProbeExtendedInfo extends IExtendedInfo
{
    async extendInfo(mediaItem, library)
    {

        if(mediaItem.attributes.gotfileinfo) {
            return;
        }

        Log.debug("ffprobe extended info", mediaItem.id);

        const fileData = await FFProbe.getInfo(mediaItem.attributes.filepath);
        if(!fileData||!fileData.format) {
            return;
        }

        mediaItem.attributes.width = fileData.streams[0].width;
        mediaItem.attributes.height = fileData.streams[0].height;
        mediaItem.attributes.fileduration = parseFloat(fileData.format.duration);
        mediaItem.attributes.filesize = parseInt(fileData.format.size);
        mediaItem.attributes.bitrate = fileData.format.bit_rate;
        mediaItem.attributes.gotfileinfo = true;
    }
}

module.exports = FFProbeExtendedInfo;
