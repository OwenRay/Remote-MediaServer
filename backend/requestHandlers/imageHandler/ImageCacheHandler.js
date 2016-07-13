"use strict";
/**
 * Created by owenray on 7/9/16.
 */
var IImageHandler = require("./IImageHandler");
var Promise = require("node-promise").Promise;
var fs = require("fs");

class ImageCacheHandler extends IImageHandler
{
    getImageData(item, type)
    {
        var promise = new Promise();
        var filename = "cache/thumb_"+item.id+"_"+type;
        try {
            fs.statSync(filename);
        }catch(e)
        {
            //console.log(e);
            return false;
        }
        console.log("img from cache");
        fs.readFile(filename, function(err, data){
            promise.resolve(data);
        });
        return promise;
    }

    put(item, data, type)
    {
        var filename = "cache/thumb_"+item.id+"_"+type;
        fs.writeFile(filename, data);
    }
}

module.exports = ImageCacheHandler;