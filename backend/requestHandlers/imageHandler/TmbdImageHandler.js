"use strict";
/**
 * Created by owenray on 7/9/16.
 */
const IImageHandler = require("./IImageHandler");
const Prom = require("node-promise").Promise;
const http = require("http");
const Log = require("../../helpers/Log");

class TmdbImageHandler extends IImageHandler
{
    getImageData(item, type)
    {
        if(!item.attributes.gotExtendedInfo)
        {
            return false;
        }
        let w = "w300";
        if(type===IImageHandler.TYPE_BACKDROP)
        {
            w = "w1280";
        }else if(type===IImageHandler.TYPE_POSTER_SMALL)
        {
            w = "w150";
            type = "poster";

        }

        const img = "http://image.tmdb.org/t/p/" + w + "/" + item.attributes[type + "-path"];
        Log.log("img"+img);
        const promise = new Prom();
        http.get(img, function (response) {
            const bytes = [];
            response.on("data", function(data){
                bytes.push(data);
            });
            response.on("end", function(){
                promise.resolve(Buffer.concat(bytes));
            });
        });
        

        return promise;
    }
}

module.exports = TmdbImageHandler;