"use strict";
/**
 * Created by owenray on 7/9/16.
 */
const IImageHandler = require("./IImageHandler");
const http = require("http");
const Log = require("../../helpers/Log");
const httpServer = require("../../HttpServer");

class TmdbImageHandler extends IImageHandler
{
    handleRequest()
    {
        let w = "w300";
        if(this.type===IImageHandler.TYPE_BACKDROP)
        {
            w = "w1280";
        }else if(this.type===IImageHandler.TYPE_POSTER_SMALL)
        {
            w = "w150";
            this.type = "poster";

        }

        if(!this.item.attributes[this.type + "-path"]) {
            return false;
        }

        const img = "http://image.tmdb.org/t/p/" + w + "/" + this.item.attributes[this.type + "-path"];
        Log.log("img"+img);
        var p = new Promise(resolve => {

            http.get(img, response => {
                const bytes = [];
                response.on("data", data=>{
                    bytes.push(data);
                });
                response.on("end", () => {
                    this.context.body = Buffer.concat(bytes);
                    resolve();
                });
            });
        });
        return p;
    }
}

httpServer.registerRoute("get", "/img/:image.jpg", TmdbImageHandler, 1);

module.exports = TmdbImageHandler;