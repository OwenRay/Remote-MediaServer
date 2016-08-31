"use strict";
/**
 * Created by owenray on 7/9/16.
 */
var IImageHandler = require("./IImageHandler");
var Promise = require("node-promise").Promise;
var http = require("http");

class TmdbImageHandler extends IImageHandler
{
    getImageData(item, type)
    {
        if(!item.attributes.gotExtendedInfo)
        {
            return false;conso
        }
        var w = "w300";
        if(type==IImageHandler.TYPE_BACKDROP)
        {
            w = "w1280";
        }else if(type==IImageHandler.TYPE_POSTER_SMALL)
        {
            w = "w150";
            type = "poster";

        }

        var img = "http://image.tmdb.org/t/p/"+w+"/"+item.attributes[type+"-path"];
        console.log("img"+img);
        var promise = new Promise();
        http.get(img, function (response) {
            var bytes = [];
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