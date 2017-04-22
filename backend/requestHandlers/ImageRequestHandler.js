"use strict";
/**
 * Created by owenray on 08-04-16.
 */
const RequestHandler = require("./RequestHandler");
const Database = require("../Database");
const FFProbeImageHandler = require("./imageHandler/FFProbeImageHandler");
const TmbdImageHandler = require("./imageHandler/TmbdImageHandler");
const ImageCacheHandler = require("./imageHandler/ImageCacheHandler");
const path = require("path");
const Log = require("../helpers/Log");


class CorsRequestHandler extends RequestHandler{
    handleRequest()
    {
        let item = path.parse(this.request.url);
        item = item.name.split("_");

        const type = item[1];
        item = Database.getById("media-item", item[0]);
        this.response.setHeader("Content-Type", "image/jpeg");
        if(!item)
        {
            return this.response.end();
        }
        const loop = [
            ImageCacheHandler,
            TmbdImageHandler,
            FFProbeImageHandler
        ];
        let promise = null;
        let c;
        for(c = 0; c<loop.length&&!promise; c++)
        {
            promise = new loop[c]().getImageData(item, type);
        }
        if(promise)
        {
            promise.then(function(data)
            {
                if(c!==1) {
                    new ImageCacheHandler().put(item, data, type);
                }
                Log.debug("return img data");
                this.response.end(data);
            }.bind(this));
        }else{
            //redirect to no-img
            Log.warning("could not get cover img for "+item.name);
            this.response.end("");
        }
    }
}

//export RequestHandler;
module.exports = CorsRequestHandler;
