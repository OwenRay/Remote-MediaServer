"use strict";
/**
 * Created by owenray on 29-06-16.
 */

var IExtendedInfo = require("./IExtendedInfo");
var Promise = require("node-promise").Promise;
var MovieDB = require('moviedb')('0699a1db883cf76d71187d9b24c8dd8e');
var path = require('path');

var discardRegex = new RegExp('\\W|-|_|([0-9]+p)|(LKRG)', "g");

class TheMovieDBExtendedInfo extends IExtendedInfo
{
    extendInfo(args, tryCount)
    {
        var mediaItem = args[0];
        var library = args[1];
        console.log("moviedbhere", library);
        if(!tryCount)
        {
            tryCount = 0;
        }

        var promise = new Promise();
        console.log(args);

        if(mediaItem.attributes.gotExtendedInfo)
        {
            console.log("already extended")
            promise.resolve([mediaItem, library]);
            return promise;
        }

        var callback = function(err, res){
            if(!err&&res.results.length>0) {
                res = res.results[0];
                for (var key in res) {
                    mediaItem.attributes[key.replace("_", "-")] = res[key];
                }
                mediaItem.attributes.year = res["release_date"].split("-")[0];
                mediaItem.attributes.gotExtendedInfo = true;
                Database.update("media-item", mediaItem);
                console.log("got Extended attrs on", mediaItem.attributes.title);
            }else if(tryCount<2){

                this.extendInfo([mediaItem, library], tryCount+1).then(promise.resolve);
                return;
            }
            promise.resolve([mediaItem, library]);
        }.bind(this);

        //If the movie cannot be found:
        // 1. try again without year,
        // 2. Then try again with the filename

        var params = {query:mediaItem.attributes.title};

        if(mediaItem.attributes.episode)
        {
            params.query+=" "+mediaItem.attributes.episode;
        }

        switch(tryCount)
        {
            case 0:
                params.year = mediaItem.attributes.year;
                break;
            case 2:
                console.log(mediaItem.attributes.filepath);
                params.query = path.parse(mediaItem.attributes.filepath).base.split(".")[0];
                params.query = params.query.replace(discardRegex, " ");
                break;
        }

        //to make sure the api only gets called every 300ms
        setTimeout(function() {
            MovieDB.searchMovie(
                params,
                callback
            );
        }, 300);
        console.log("ret promise");
        return promise;
    }
}

module.exports = TheMovieDBExtendedInfo;