"use strict";
/**
 * Created by owenray on 29-06-16.
 */
const IExtendedInfo = require("./IExtendedInfo");
const Prom = require("node-promise").Promise;
const FFProbe = require('../../helpers/FFProbe');
const Database = require("../../Database");
const Log = require("../../helpers/Log");

class FFProbeExtendedInfo extends IExtendedInfo
{
    extendInfo(args)
    {
        const mediaItem = args[0];
        const library = args[1];
        const promise = new Prom();

        if(mediaItem.attributes.gotfileinfo) {
            promise.resolve([mediaItem, library]);
            return promise;
        }

        Log.debug("ffprobe extended info", mediaItem.id);

        const file = mediaItem.attributes.filepath;
        FFProbe.getInfo(file)
            .then(
                /**
                 * @param {FFProbe.fileInfo} fileData
                 * @returns {*}
                 */
                function(fileData)
                {
                    if(!fileData||!fileData.format) {
                        return promise.resolve([mediaItem, library]);
                    }

                    mediaItem.attributes.width = fileData.streams[0].width;
                    mediaItem.attributes.height = fileData.streams[0].height;
                    mediaItem.attributes.fileduration = parseFloat(fileData.format.duration);
                    mediaItem.attributes.filesize = parseInt(fileData.format.size);
                    mediaItem.attributes.bitrate = fileData.format.bit_rate;
                    mediaItem.attributes.gotfileinfo = true;
                    Database.update("media-item", mediaItem);
                    promise.resolve([mediaItem, library]);
                }
            );
        return promise;
    }
}

module.exports = FFProbeExtendedInfo;