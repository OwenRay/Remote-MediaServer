"use strict";
/**
 * Created by owenray on 7/9/16.
 */
const IImageHandler = require("./IImageHandler");
const Prom = require("node-promise").Promise;
const fs = require("fs");
const Log = require("../../helpers/Log");

class ImageCacheHandler extends IImageHandler
{
    getImageData(item, type)
    {
        const promise = new Prom();
        const filename = "cache/thumb_" + item.id + "_" + type;
        try {
            fs.statSync(filename);
        }catch(e)
        {
            Log.debug(e);
            return false;
        }
        Log.log("img from cache");
        fs.readFile(filename, function(err, data){
            promise.resolve(data);
        });
        return promise;
    }

    put(item, data, type)
    {
        const filename = "cache/thumb_" + item.id + "_" + type;
        fs.writeFile(filename, data);
    }
}

module.exports = ImageCacheHandler;