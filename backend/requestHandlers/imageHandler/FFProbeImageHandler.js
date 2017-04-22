"use strict";
/**
 * Created by owenray on 7/9/16.
 */
const IImageHandler = require("./IImageHandler");
const Prom = require("node-promise").Promise;
const spawn = require("child_process").spawn;
const Settings = require("../../Settings");
const MediaItemHelper = require("../../helpers/MediaItemHelper");
const Log = require("../../helpers/Log");

class FFProbeImageHandler extends IImageHandler
{
    getImageData(item, type)
    {
        const promise = new Prom();
        
        let offset = 0;
        if(!item.attributes.width)
        {
            return false;
        }
        if(item.attributes.fileduration)
        {
            offset = item.attributes.fileduration/2;
        }

        let crop = {
            x: 0, y: 0,
            width: item.attributes.width, height: item.attributes.height
        };
        let size = crop.width + "x" + crop.height;

        if(type!==IImageHandler.TYPE_BACKDROP)
        {
            const targetSize = type === IImageHandler.TYPE_POSTER ? {w: 300, h: 450} : {w: 150, h: 218};

            size = targetSize.w+"x"+targetSize.h;
            if(targetSize.w/targetSize.h>crop.width/crop.height)
            {
                crop.width = targetSize.width;
                crop.height = crop.width*(targetSize.h/targetSize.w);
            }else{
                crop.height = targetSize.height;
                crop.width = crop.height*(targetSize.w/targetSize.h);
            }
            crop.y+=Math.floor((item.attributes.height-crop.height)/2);
            crop.x+=Math.floor((item.attributes.width-crop.width)/2);
        }
        crop = crop.width+":"+crop.height+":"+crop.x+":"+crop.y;

        const file = MediaItemHelper.getFullFilePath(item);
        const args = [
            "-ss", offset,
            "-i", file,
            "-frames", "1",
            "-filter", "crop=" + crop,
            "-y",
            "-s", size,
            "-f", "singlejpeg",
            "-"
        ];
        const proc = spawn(
            Settings.getValue("ffmpeg_binary"),
            args);

        let b;
        proc.stdout.on("data", function(data){
            if(b)
            {
                b = Buffer.concat([b, data]);
            }else {
                b = data;
            }
        }.bind(this));

        proc.stderr.on('data', function(data)
        {
            Log.debug(`${data}`);
        });

        proc.on("close", function(){
            promise.resolve(b);
        }.bind(this));

        return promise;
    }
}

module.exports = FFProbeImageHandler;