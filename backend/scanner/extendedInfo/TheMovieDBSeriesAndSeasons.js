"use strict";
/**
 * Created by owenray on 18-09-16.
 */
const IExtendedInfo = require("./IExtendedInfo");
const Prom = require("node-promise").Promise;
const MovieDB = require('moviedb')('0699a1db883cf76d71187d9b24c8dd8e');
const Database = require("../../Database");
const TheMovieDBExtendedInfo = require("./TheMovieDBExtendedInfo");
const NodeCache = new (require("node-cache"))();
const Log = require("../../helpers/Log");

class TheMovieDBSeriesAndSeasons extends IExtendedInfo
{
    extendInfo(args, round)
    {
        const mediaItem = args[0];
        const library = args[1];
        if(!round)
        {
            round = 0;
        }

        const promise = new Prom();

        if(mediaItem.attributes.gotSeriesAndSeasonInfo&&round===0)
        {
            promise.resolve([mediaItem, library]);
            return promise;
        }

        if(library.type!=="tv")
        {
            promise.resolve([mediaItem, library]);
        }else{
            Log.debug("process serie", mediaItem.id);
            let result, waitFor;
            switch(round)
            {
                case 0://find series
                    result = function(err, res)
                    {
                        NodeCache.set("1:"+mediaItem.attributes.title, res);
                        if(!err&&res.results.length>0) {
                            res = res.results[0];
                            res["external-id"] = res.id;
                            delete res.id;
                            for (let key in res) {
                                mediaItem.attributes[key.replace(/_/g, "-")] = res[key];
                            }
                            const date = res.release_date ? res.release_date : res.first_air_date;
                            mediaItem.attributes.year = date.split("-")[0];
                            mediaItem.attributes.gotSeriesAndSeasonInfo = true;
                            Database.update("media-item", mediaItem);
                            return this.extendInfo([mediaItem, library], round+1).then(promise.resolve);
                        }
                        promise.resolve([mediaItem, library]);
                    }.bind(this);
                    const cache = NodeCache.get("1:" + mediaItem.attributes.title);
                    if(cache) {
                        result(null, cache);
                        break;
                    }

                    waitFor = 300 - (new Date().getTime() - TheMovieDBExtendedInfo.lastRequest);
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
                    result = function(err, res)
                    {
                        NodeCache.set("2:"+mediaItem.attributes.title+":"+mediaItem.attributes.season, res);
                        if(!err) {
                            delete res.episodes;
                            mediaItem.seasonInfo = res;
                            Database.update("media-item", mediaItem);
                        }
                        promise.resolve([mediaItem, library]);
                    };
                    const cached = NodeCache.get("2:" + mediaItem.attributes.title + ":" + mediaItem.attributes.season);
                    if(cached)
                    {
                        Log.debug("get series from cache2!");
                        result(null, cached);
                        break;
                    }

                    waitFor = 300-(new Date().getTime()-TheMovieDBExtendedInfo.lastRequest);
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