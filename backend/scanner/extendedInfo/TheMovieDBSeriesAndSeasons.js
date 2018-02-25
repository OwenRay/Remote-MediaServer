"use strict";
/**
 * Created by owenray on 18-09-16.
 */
const IExtendedInfo = require("./IExtendedInfo");
const Settings = require("../../Settings");
const NodeCache = new (require("node-cache"))();
const Log = require("../../helpers/Log");
const MovieDB = require('moviedb-api');
const movieDB = new MovieDB({
    consume:true,
    apiKey:Settings.getValue("tmdb_apikey")
});

class TheMovieDBSeriesAndSeasons extends IExtendedInfo
{
    async extendInfo(mediaItem, library) {
        if (library.type !== "tv") {
            return;
        }
        if (mediaItem.attributes.gotSeriesAndSeasonInfo>=2) {
            return;
        }


        Log.debug("process serie", mediaItem.id);

        //find series info
        let cache = NodeCache.get("1:" + mediaItem.attributes.title);
        let res = cache ? cache : await movieDB.searchTv({query: mediaItem.attributes.title});

        NodeCache.set("1:" + mediaItem.attributes.title, res);
        res = res.results[0];
        res["external-id"] = res.id;
        delete res.id;
        for (let key in res) {
            mediaItem.attributes[key.replace(/_/g, "-")] = res[key];
        }
        const date = res.release_date ? res.release_date : res.first_air_date;
        mediaItem.attributes.year = date.split("-")[0];

        //find season info
        cache = NodeCache.get("2:" + mediaItem.attributes.title + ":" + mediaItem.attributes.season);
        res = cache ? cache : await movieDB.tvSeason({
            "id": mediaItem.attributes["external-id"],
            "season_number": mediaItem.attributes.season
        });
        NodeCache.set("2:" + mediaItem.attributes.title + ":" + mediaItem.attributes.season, res);

        delete res.episodes;
        mediaItem.attributes.seasonInfo = res;

        try {
            //get credits
            cache = NodeCache.get("3:" + mediaItem.attributes.title + ":" + mediaItem.attributes.season);
            res = cache ? cache : await movieDB.tvCredits({
                "id": mediaItem.attributes["external-id"]
            });
            NodeCache.set("3:" + mediaItem.attributes.title + ":" + mediaItem.attributes.season, res);
            mediaItem.attributes.actors = res.cast.map(actor => actor.name);
        }catch(e){
            Log.debug(e);
        }

        try {
            //get credits
            cache = NodeCache.get("4:" + mediaItem.attributes.title + ":" + mediaItem.attributes.season);
            res = cache ? cache : await movieDB.tvContent_ratings({
                "id": mediaItem.attributes["external-id"]
            });
            NodeCache.set("4:" + mediaItem.attributes.title + ":" + mediaItem.attributes.season, res);
            //is there a US release? get it. otherwise whichever's first
            res = res.results;
            let r;
            for (let key in res) {
                if (res[key].iso_3166_1 === "US") {
                    r = res[key];
                    break;
                }
            }
            if (!r && res.length) {
                r = dates[0];
            }

            if(r) {
                mediaItem.attributes.mpaa = r.rating;
            }
        }catch(e) {
            Log.debug(e);
        }
        mediaItem.attributes.gotSeriesAndSeasonInfo = 2;
    }
}


module.exports = TheMovieDBSeriesAndSeasons;
