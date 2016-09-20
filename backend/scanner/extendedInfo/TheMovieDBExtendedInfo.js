"use strict";
/**
 * Created by owenray on 29-06-16.
 */

var IExtendedInfo = require("./IExtendedInfo");
var Promise = require("node-promise").Promise;
var MovieDB = require('moviedb')('0699a1db883cf76d71187d9b24c8dd8e');
var path = require('path');
var Database = require("../../Database");

var discardRegex = new RegExp('\\W|-|_|([0-9]+p)|(LKRG)', "g");

class TheMovieDBExtendedInfo extends IExtendedInfo
{
    extendInfo(args, tryCount)
    {
        var mediaItem = args[0];
        var library = args[1];
        if(!tryCount)
        {
            tryCount = 0;
        }

        var promise = new Promise();

        if(mediaItem.attributes.gotExtendedInfo)
        {
            promise.resolve([mediaItem, library]);
            return promise;
        }

        var callback = function(err, res){
            if(!err) {
                var res = library.type != "tv" ?
                    (res.results&&res.results.length > 0 ? res.results[0] : null)
                    : res;
            }
            if(res)
            {
                if(library.type=="tv")
                {
                    res["external-episode-id"] = res.id;
                    res["episode-title"] = res.name;
                    delete res.name;
                }
                else
                {
                    res["external-id"] = res.id;
                }
                delete res.id;
                for (var key in res) {
                    mediaItem.attributes[key.replace(/_/g, "-")] = res[key];
                }
                var date = res["release_date"]?res["release_date"]:res["first_air_date"];
                date = date?date:res["air_date"];

                mediaItem.attributes.year = date.split("-")[0];
                mediaItem.attributes.gotExtendedInfo = true;
                Database.update("media-item", mediaItem);
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
                params.query = path.parse(mediaItem.attributes.filepath).base.split(".")[0];
                params.query = params.query.replace(discardRegex, " ");
                break;
        }

        var searchMethod = MovieDB.searchMovie;
        switch(library.type)
        {
            case "tv":
                searchMethod = MovieDB.tvEpisodeInfo;
                params = {};
                params.id = mediaItem.attributes["external-id"];
                params.season_number = mediaItem.attributes.season;
                params.episode_number = mediaItem.attributes.episode;
                params.episode_number = mediaItem.attributes.episode;
                break;
        }

        searchMethod = searchMethod.bind(MovieDB);
        function makeCall()
        {
            searchMethod(
                params,
                callback
            );
            TheMovieDBExtendedInfo.lastRequest = new Date().getTime();
        }
        //to make sure the api only gets called every 300ms
        var waitFor = 300-(new Date().getTime()-TheMovieDBExtendedInfo.lastRequest);
        if(waitFor<20)
        {
            //console.log("do not wait:", waitFor);
            makeCall();
        }else
        {
            //console.log("make call with delay:", waitFor);
            setTimeout(makeCall, waitFor);
        }
        return promise;
    }
}

TheMovieDBExtendedInfo.lastRequest = 0;


module.exports = TheMovieDBExtendedInfo;