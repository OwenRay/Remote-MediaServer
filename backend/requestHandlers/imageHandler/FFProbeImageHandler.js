"use strict";
/**
 * Created by owenray on 7/9/16.
 */
var IImageHandler = require("./IImageHandler");
var Promise = require("node-promise").Promise;
var Database = require("../../Database");
var spawn = require("child_process").spawn;
var Settings = require("../../Settings");
var MediaItemHelper = require("../../helpers/MediaItemHelper");

class FFProbeImageHandler extends IImageHandler
{
    getImageData(item, type)
    {
        var promise = new Promise();
        
        var offset = 0;
        if(!item.attributes.width)
        {
            return false;
        }
        if(item.attributes.fileduration)
        {
            offset = item.attributes.fileduration/2;
        }

        var crop = {x:0, y:0,
                    width:item.attributes.width, height:item.attributes.height};
        var size = crop.width+"x"+crop.height;

        if(type!=IImageHandler.TYPE_BACKDROP)
        {
            var targetSize = type==IImageHandler.TYPE_POSTER?{w:300,h:450}:{w:150,h:218};

            size = targetSize.w+"x"+targetSize.h;
            if(targetSize.w/targetSize.h>crop.width/crop.height)
            {
                crop.width = crop.width;
                crop.height = crop.width*(targetSize.h/targetSize.w);
            }else{
                crop.height = crop.height;
                crop.width = crop.height*(targetSize.w/targetSize.h);
            }
            crop.y+=Math.floor((item.attributes.height-crop.height)/2);
            crop.x+=Math.floor((item.attributes.width-crop.width)/2);
        }
        crop = crop.width+":"+crop.height+":"+crop.x+":"+crop.y;

        var file = MediaItemHelper.getFullFilePath(item);
        var args = [
            "-ss", offset,
            "-i", file,
            "-frames", "1",
            "-filter", "crop="+crop,
            "-y",
            "-s", size,
            "-f", "singlejpeg",
            "-"
        ];
        var proc = spawn(
            Settings.getValue("ffmpeg_binary"),
            args);

        var b;
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
            //console.log(`${data}`);
        });

        proc.on("close", function(){
            promise.resolve(b);
        }.bind(this));

        return promise;
    }
}

module.exports = FFProbeImageHandler;