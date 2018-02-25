"use strict";
/**
 * Created by owenray on 29-06-16.
 */
const IExtendedInfo = require("./IExtendedInfo");
const Prom = require("node-promise").Promise;
const Settings = require("../../Settings");
const path = require('path');
const Database = require("../../Database");
const Log = require("../../helpers/Log");
const MovieDB = require('moviedb-api');
const movieDB = new MovieDB({
    consume:true,
    apiKey:Settings.getValue("tmdb_apikey")
});

const discardRegex = new RegExp('\\W|-|_|([0-9]+p)|(LKRG)', "g");


class TheMovieDBExtendedInfo extends IExtendedInfo
{
    async extendInfo(mediaItem, library, tryCount = 0)
    {
        if(!tryCount)
        {
            tryCount = 0;
        }

        if(mediaItem.attributes.gotExtendedInfo>=2) {
            return
        }
        Log.debug("process tmdb", mediaItem.id);


        //If the movie cannot be found:
        // 1. try again without year,
        // 2. Then try again with the filename

        let params = {query: mediaItem.attributes.title};

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

        let searchMethod = movieDB.searchMovie;
        switch(library.type)
        {
            case "tv":
                searchMethod = movieDB.tvSeasonEpisode;
                params = {};
                params.id = mediaItem.attributes["external-id"];
                params.season_number = mediaItem.attributes.season;
                params.episode_number = mediaItem.attributes.episode;
                params.episode_number = mediaItem.attributes.episode;
                break;
        }
        searchMethod = searchMethod.bind(movieDB);

        let res = await searchMethod(params);

        res = library.type !== "tv" ?
            (res.results && res.results.length > 0 ? res.results[0] : null)
            : res;

        if (res) {
            if (library.type === "tv") {
                res["external-episode-id"] = res.id;
                res["episode-title"] = res.name;
                delete res.name;
            } else {
                res["external-id"] = res.id;
            }

            if(library.type==="movie") {
                const {crew, date} = await this.getMoreMovieInfo(res.id);
                mediaItem.attributes.actors = crew.cast.map(actor => actor.name);
                mediaItem.attributes.mpaa = date.certification;
            }

            delete res.id;
            for (let key in res) {
                mediaItem.attributes[key.replace(/_/g, "-")] = res[key];
            }
            let releaseDate = res.release_date ? res.release_date : res.first_air_date;
            releaseDate = releaseDate ? releaseDate : res.air_date;

            mediaItem.attributes["release-date"] = releaseDate;
            if (releaseDate) {
                mediaItem.attributes.year = releaseDate.split("-")[0];
            }
            mediaItem.attributes.gotExtendedInfo=2;

        } else if (tryCount < 2) {
            await this.extendInfo(mediaItem, library, tryCount + 1);
        }
    }

    async getMoreMovieInfo(id) {
        let crew = await movieDB.movieCredits({id});
        let date;
        let dates = await movieDB.movieRelease_dates({id});

        //is there a US release? get it. otherwise whichever's first
        dates = dates.results;
        for (let key in dates) {
            if (dates[key].iso_3166_1 === "US") {
                date = dates[key].release_dates.pop();
                break;
            }
        }
        if (!date && dates.length) {
            date = dates[0].release_dates.pop();
        }
        return {crew, date};
    }
}

TheMovieDBExtendedInfo.lastRequest = 0;


module.exports = TheMovieDBExtendedInfo;
