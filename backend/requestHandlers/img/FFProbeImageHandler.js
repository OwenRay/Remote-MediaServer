"use strict";
/**
 * Created by owenray on 7/9/16.
 */
const IImageHandler = require("./IImageHandler");
const spawn = require("child_process").spawn;
const Settings = require("../../Settings");
const MediaItemHelper = require("../../helpers/MediaItemHelper");
const Log = require("../../helpers/Log");
const httpServer = require("../../HttpServer");
const ImageCacheHandler = require("./ImageCacheHandler");

class FFProbeImageHandler extends IImageHandler
{
    handleRequest()
    {
        
        let offset = 0;
        if(!this.item.attributes.width)
        {
            return false;
        }
        if(this.item.attributes.fileduration)
        {
            offset = this.item.attributes.fileduration/2;
        }

        let crop = {
            x: 0, y: 0,
            width: this.item.attributes.width, height: this.item.attributes.height
        };
        let size = crop.width + "x" + crop.height;

        if(this.type!==IImageHandler.TYPE_BACKDROP)
        {
            const targetSize = this.type === IImageHandler.TYPE_POSTER ? {w: 300, h: 450} : {w: 150, h: 218};

            size = targetSize.w+"x"+targetSize.h;
            if(targetSize.w/targetSize.h>crop.width/crop.height)
            {
                crop.width = targetSize.w;
                crop.height = crop.width*(targetSize.h/targetSize.w);
            }else{
                crop.height = targetSize.h;
                crop.width = crop.height*(targetSize.w/targetSize.h);
            }
            crop.y+=Math.floor((this.item.attributes.height-crop.height)/2);
            crop.x+=Math.floor((this.item.attributes.width-crop.width)/2);
        }
        crop = crop.width+":"+crop.height+":"+crop.x+":"+crop.y;

        const file = MediaItemHelper.getFullFilePath(this.item);
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

        return new Promise(resolve => {
            proc.on("close", ()=>{
                new ImageCacheHandler(this.context).put(b);
                this.context.body = b;
                resolve();
            });
        });

    }
}

httpServer.registerRoute("get", "/img/:image.jpg", FFProbeImageHandler, 0,  1);

module.exports = FFProbeImageHandler;