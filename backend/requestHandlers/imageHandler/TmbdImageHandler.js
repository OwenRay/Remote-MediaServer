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
        console.log(item);
        if(!item.attributes.gotExtendedInfo)
        {
            return false;
        }
        var w = "w150";
        if(type==IImageHandler.TYPE_BACKDROP) {
            w = "w1280";
        }

        var img = "http://image.tmdb.org/t/p/"+w+"/"+item.attributes[type+"-path"];
        console.log(img);
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