"use strict";
/**
 * Created by owenray on 18-09-16.
 */

var IExtendedInfo = require("./IExtendedInfo");
var Promise = require("node-promise").Promise;
var MovieDB = require('moviedb')('0699a1db883cf76d71187d9b24c8dd8e');
var Database = require("../../Database");
var TheMovieDBExtendedInfo = require("./TheMovieDBExtendedInfo");
var NodeCache = new (require( "node-cache" ))();

var cachedTvSearch = [];

class TheMovieDBSeriesAndSeasons extends IExtendedInfo
{
    extendInfo(args, round)
    {
        var mediaItem = args[0];
        var library = args[1];
        if(!round)
        {
            round = 0;
        }

        var promise = new Promise();

        if(mediaItem.attributes.gotSeriesAndSeasonInfo&&round==0||mediaItem.attributes.extra)
        {
            promise.resolve([mediaItem, library]);
            return promise;
        }

        if(library.type!="tv")
        {
            promise.resolve([mediaItem, library]);
        }else{
            switch(round)
            {
                case 0://find series
                    var result = function(err, res)
                    {
                        NodeCache.set("1:"+mediaItem.attributes.title, res);
                        if(!err&&res.results.length>0) {
                            res = res.results[0];
                            res["external-id"] = res.id;
                            delete res.id;
                            for (var key in res) {
                                mediaItem.attributes[key.replace(/_/g, "-")] = res[key];
                            }
                            var date = res["release_date"] ? res["release_date"] : res["first_air_date"];
                            mediaItem.attributes.year = date.split("-")[0];
                            mediaItem.attributes.gotSeriesAndSeasonInfo = true;
                            Database.update("media-item", mediaItem);
                            return this.extendInfo([mediaItem, library], round+1).then(promise.resolve)
                        }
                        promise.resolve([mediaItem, library]);
                    }.bind(this);
                    var cache = NodeCache.get("1:"+mediaItem.attributes.title);
                    if(cache) {
                        result(null, cache);
                        break;
                    }

                    var waitFor = 300-(new Date().getTime()-TheMovieDBExtendedInfo.lastRequest);
                    if(waitFor<0)
                    {
                        waitFor = 0;
                    }
                    setTimeout(function() {
                        TheMovieDBExtendedInfo.lastRequest = new Date().getTime();
                        MovieDB.searchTv({query: mediaItem.attributes.title}, result);
                    }, waitFor);
                    break;
                case 1://find season info
                    var result = function(err, res)
                    {
                        NodeCache.set("2:"+mediaItem.attributes.title+":"+mediaItem.attributes.season, res);
                        if(!err) {
                            delete res.episodes;
                            mediaItem.seasonInfo = res;
                            Database.update("media-item", mediaItem);
                        }
                        promise.resolve([mediaItem, library]);
                    };
                    var cached = NodeCache.get("2:"+mediaItem.attributes.title+":"+mediaItem.attributes.season);
                    if(cached)
                    {
                        console.log("fromcache2!");
                        result(null, cached);
                        break;
                    }

                    var waitFor = 300-(new Date().getTime()-TheMovieDBExtendedInfo.lastRequest);
                    if(waitFor<0)
                    {
                        waitFor = 0;
                    }
                    setTimeout(function() {
                        TheMovieDBExtendedInfo.lastRequest = new Date().getTime();
                        MovieDB.tvSeasonInfo({
                            "id": mediaItem.attributes["external-id"],
                            "season_number": mediaItem.attributes.season
                        }, result);
                    }, waitFor);
                    break;
            }
        }

        return promise;
    }
}


module.exports = TheMovieDBSeriesAndSeasons;