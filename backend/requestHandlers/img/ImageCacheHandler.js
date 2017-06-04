"use strict";
/**
 * Created by owenray on 7/9/16.
 */
const IImageHandler = require("./IImageHandler");
const fs = require("fs");
const Log = require("../../helpers/Log");
const httpServer = require("../../HttpServer");

class ImageCacheHandler extends IImageHandler
{
    handleRequest()
    {
        const filename = "cache/thumb_" + this.item.id + "_" + this.type;
        try {
            fs.statSync(filename);
        }catch(e) {
            Log.debug(e);
            return false;
        }

        return new Promise(resolve=>{
            fs.readFile(filename, (err, data) => {
                this.context.body = data;
                resolve(data);
            });
        });
    }

    put(data)
    {
        const filename = "cache/thumb_" + this.item.id + "_" + this.type;
        fs.writeFile(filename, data, ()=>{});
    }
}

httpServer.registerRoute("get", "/img/:image.jpg", ImageCacheHandler, 0,  10);

module.exports = ImageCacheHandler;