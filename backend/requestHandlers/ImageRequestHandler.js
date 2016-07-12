"use strict";
/**
 * Created by owenray on 08-04-16.
 */
var RequestHandler = require("./RequestHandler");
var Database = require("../Database");
var FFProbeImageHandler = require("./imageHandler/FFProbeImageHandler");
var TmbdImageHandler = require("./imageHandler/TmbdImageHandler");
var ImageCacheHandler = require("./imageHandler/ImageCacheHandler");
var path = require("path");


class CorsRequestHandler extends RequestHandler{
    handleRequest()
    {
        var item = path.parse(this.request.url);
        item = item.name.split("_");

        var type = item[1];
        item = Database.getById("media-item", item[0]);
        this.response.setHeader("Content-Type", "image/jpeg");
        if(!item)
        {
            return this.response.end();
        }
        var loop = [
                //ImageCacheHandler,
                TmbdImageHandler,
                FFProbeImageHandler
            ];
        var promise = null;
        for(var c = 0; c<loop.length&&!promise; c++)
        {
            promise = new loop[c]().getImageData(item, type);
        }
        if(promise)
        {
            promise.then(function(data)
            {
                if(c!=1) {
                    new ImageCacheHandler().put(item, data, type);
                }
                console.log("return data");
                this.response.end(data);
            }.bind(this));
        }else{
            //redirect to no-img
            console.log("could not get cover img");
            this.response.end("");
        }
    }
}

//export RequestHandler;
module.exports = CorsRequestHandler;
